import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Component, Fragment } from 'react'
import { b, div, fieldset, h, label, legend, p, span } from 'react-hyperscript-helpers'
import { ButtonPrimary, ButtonSecondary, GroupedSelect, IdContainer, Link, Select } from 'src/components/common'
import { ImageDepViewer } from 'src/components/ImageDepViewer'
import { NumberInput, TextInput, ValidatedInput } from 'src/components/input'
import { withModalDrawer } from 'src/components/ModalDrawer'
import { InfoBox } from 'src/components/PopupTrigger'
import TitleBar from 'src/components/TitleBar'
import { machineTypes, profiles } from 'src/data/machines'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import { notify } from 'src/libs/notifications'
import { deleteText, findMachineType, machineConfigCost, normalizeRuntimeConfig } from 'src/libs/runtime-utils'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import validate from 'validate.js'


const styles = {
  row: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '1rem'
  },
  label: { fontWeight: 600, whiteSpace: 'pre' },
  disabledInputs: {
    border: `1px solid ${colors.dark(0.2)}`, borderRadius: 4, padding: '0.5rem'
  }
}

const terraDockerBaseGithubUrl = 'https://github.com/databiosphere/terra-docker'
const terraBaseImages = `${terraDockerBaseGithubUrl}#terra-base-images`
const safeImageDocumentation = 'https://support.terra.bio/hc/en-us/articles/360034669811'
const rstudioBaseImages = 'https://github.com/anvilproject/anvil-docker'
const zendeskImagePage = 'https://support.terra.bio/hc/en-us/articles/360037269472-Working-with-project-specific-environments-in-Terra#h_b5773619-e264-471c-9647-f9b826c27820'

// distilled from https://github.com/docker/distribution/blob/95daa793b83a21656fe6c13e6d5cf1c3999108c7/reference/regexp.go
const imageValidationRegexp = /^[A-Za-z0-9]+[\w./-]+(?::\w[\w.-]+)?(?:@[\w+.-]+:[A-Fa-f0-9]{32,})?$/

const validMachineTypes = _.filter(({ memory }) => memory >= 4, machineTypes)

const MachineSelector = ({ machineType, onChangeMachineType, diskSize, onChangeDiskSize, readOnly }) => {
  const { cpu: currentCpu, memory: currentMemory } = findMachineType(machineType)
  return h(Fragment, [
    h(IdContainer, [
      id => h(Fragment, [
        label({ htmlFor: id, style: styles.label }, 'CPUs'),
        readOnly ? div({ style: styles.disabledInputs }, [currentCpu]) :
          div([
            h(Select, {
              id,
              isSearchable: false,
              value: currentCpu,
              onChange: ({ value }) => onChangeMachineType(_.find({ cpu: value }, validMachineTypes)?.name || machineType),
              options: _.flow(_.map('cpu'), _.union([currentCpu]), _.sortBy(_.identity))(validMachineTypes)
            })
          ])
      ])
    ]),
    h(IdContainer, [
      id => h(Fragment, [
        label({ htmlFor: id, style: styles.label }, 'Memory (GB)'),
        readOnly ? div({ style: styles.disabledInputs }, [currentMemory]) :
          div([
            h(Select, {
              id,
              isSearchable: false,
              value: currentMemory,
              onChange: ({ value }) => onChangeMachineType(_.find({ cpu: currentCpu, memory: value }, validMachineTypes)?.name || machineType),
              options: _.flow(_.filter({ cpu: currentCpu }), _.map('memory'), _.union([currentMemory]), _.sortBy(_.identity))(validMachineTypes)
            })
          ])
      ])
    ]),
    h(IdContainer, [
      id => h(Fragment, [
        label({ htmlFor: id, style: styles.label }, 'Disk size (GB)'),
        readOnly ? div({ style: styles.disabledInputs }, [diskSize]) :
          h(NumberInput, {
            id,
            min: 10,
            max: 64000,
            isClearable: false,
            onlyInteger: true,
            value: diskSize,
            onChange: onChangeDiskSize
          })
      ])
    ])
  ])
}

const CUSTOM_MODE = '__custom_mode__'
const PROJECT_SPECIFIC_MODE = '__project_specific_mode__'

export const NewRuntimeModal = withModalDrawer({ width: 675 })(class NewRuntimeModal extends Component {
  static propTypes = {
    currentRuntime: PropTypes.object,
    namespace: PropTypes.string.isRequired,
    onDismiss: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props)
    const { currentRuntime } = props
    const { cloudService, ...currentConfig } = normalizeRuntimeConfig(currentRuntime?.runtimeConfig || profiles[0].runtimeConfig)
    const matchingProfile = _.find({ runtimeConfig: { masterMachineType: currentConfig.masterMachineType } }, profiles)

    this.state = {
      profile: matchingProfile?.name || 'custom',
      jupyterUserScriptUri: '', customEnvImage: '', viewMode: undefined,
      sparkMode: cloudService === 'GCE' ? false : currentConfig.numberOfWorkers === 0 ? 'master' : 'cluster',
      ...currentConfig
    }
  }

  getRuntimeConfig() {
    const { sparkMode, numberOfWorkers, masterMachineType, masterDiskSize, workerMachineType, workerDiskSize, numberOfPreemptibleWorkers } = this.state

    return !!sparkMode ? {
      cloudService: 'DATAPROC',
      numberOfWorkers, masterMachineType,
      masterDiskSize, workerMachineType,
      workerDiskSize, numberOfWorkerLocalSSDs: 0,
      numberOfPreemptibleWorkers
    } : {
      cloudService: 'GCE',
      machineType: masterMachineType,
      diskSize: masterDiskSize
    }
  }

  deleteRuntime() {
    const { currentRuntime } = this.props
    const { googleProject, runtimeName } = currentRuntime

    return Ajax().Runtimes.runtime(googleProject, runtimeName).delete()
  }

  createRuntime() {
    const { namespace, onSuccess, currentRuntime } = this.props
    const { jupyterUserScriptUri, selectedLeoImage, customEnvImage } = this.state
    onSuccess(Promise.all([
      Ajax().Runtimes.runtime(namespace, Utils.generateRuntimeName()).create({
        runtimeConfig: this.getRuntimeConfig(),
        toolDockerImage: selectedLeoImage === CUSTOM_MODE || selectedLeoImage === PROJECT_SPECIFIC_MODE ? customEnvImage : selectedLeoImage,
        labels: { saturnIsProjectSpecific: `${selectedLeoImage === PROJECT_SPECIFIC_MODE}` },
        ...(jupyterUserScriptUri ? { jupyterUserScriptUri } : {})
      }),
      !!currentRuntime && this.deleteRuntime()
    ]))
  }

  updateRuntime(isStopRequired = false) {
    const { currentRuntime, onSuccess } = this.props
    const { googleProject, runtimeName } = currentRuntime

    if (isStopRequired) {
      notify('info', 'To be updated, your runtime will now stop, and then start. This will take 3-5 minutes.')
    }

    return onSuccess(
      Ajax().Runtimes.runtime(googleProject, runtimeName).update({
        runtimeConfig: this.getRuntimeConfig()
      }),
      isStopRequired ? 5000 : 0)
  }

  hasStartUpScriptChanged() {
    const { currentRuntime } = this.props
    const { jupyterUserScriptUri } = this.state
    const originalJupyterUserScriptUri = currentRuntime.jupyterUserScriptUri || ''
    return jupyterUserScriptUri !== originalJupyterUserScriptUri
  }

  hasImageChanged() {
    const { selectedLeoImage, customEnvImage, currentRuntimeDetails } = this.state
    const { imageUrl } = currentRuntimeDetails ? this.getImageUrl(currentRuntimeDetails) : ''
    return !_.includes(imageUrl, [selectedLeoImage, customEnvImage])
  }

  //determines whether the changes are applicable for a call to the leo patch endpoint
  //see this for a diagram of the conditional this implements https://drive.google.com/file/d/1mtFFecpQTkGYWSgPlaHksYaIudWHa0dY/view
  //this function returns true for cases 2 & 3 in this diagram
  canUpdate() {
    const { currentRuntime } = this.props

    if (!currentRuntime) return false

    const currentRuntimeConfig = normalizeRuntimeConfig(currentRuntime.runtimeConfig)
    const userSelectedConfig = normalizeRuntimeConfig(this.getRuntimeConfig())

    const cantWorkersUpdate = currentRuntimeConfig.numberOfWorkers !== userSelectedConfig.numberOfWorkers &&
      (currentRuntimeConfig.numberOfWorkers < 2 || userSelectedConfig.numberOfWorkers < 2)

    const hasUnUpdateableResourceChanged =
      currentRuntimeConfig.workerDiskSize !== userSelectedConfig.workerDiskSize ||
      currentRuntimeConfig.workerMachineType !== userSelectedConfig.workerMachineType ||
      currentRuntimeConfig.numberOfWorkerLocalSSDs !== userSelectedConfig.numberOfWorkerLocalSSDs

    const hasWorkers = currentRuntimeConfig.numberOfWorkers >= 2 || currentRuntimeConfig.numberOfPreemptibleWorkers >= 2
    const hasWorkersResourceChanged = hasWorkers && hasUnUpdateableResourceChanged

    const hasDiskSizeDecreased = currentRuntimeConfig.masterDiskSize > userSelectedConfig.masterDiskSize

    const cantUpdate = cantWorkersUpdate || hasWorkersResourceChanged || hasDiskSizeDecreased || this.hasImageChanged() ||
      this.hasStartUpScriptChanged()
    return !cantUpdate
  }

  hasChanges() {
    const { currentRuntime } = this.props
    if (!currentRuntime) return true

    //TODO: this _.pickBy will need to change if the UI-side machineConfig starts tracking the cloud service (which it will once Leo exposes the ability to create GCE runtimes)
    const currentRuntimeWithoutService = _.pickBy((v, k) => k !== 'cloudService', currentRuntime.runtimeConfig)
    const hasMachineConfigChanges = !_.isMatch(currentRuntimeWithoutService, this.getRuntimeConfig())

    return hasMachineConfigChanges || this.hasImageChanged() || this.hasStartUpScriptChanged()
  }

  //returns true for case 3 in this diagram: https://drive.google.com/file/d/1mtFFecpQTkGYWSgPlaHksYaIudWHa0dY/view
  isStopRequired() {
    const { currentRuntime } = this.props

    const currentRuntimeConfig = normalizeRuntimeConfig(currentRuntime.runtimeConfig)
    const userSelectedConfig = normalizeRuntimeConfig(this.getRuntimeConfig())

    const isMasterMachineTypeChanged = currentRuntimeConfig.masterMachineType !== userSelectedConfig.masterMachineType

    const isRuntimeRunning = currentRuntime.status === 'Running'

    return this.canUpdate() && isMasterMachineTypeChanged && isRuntimeRunning
  }

  getRunningUpdateText() {
    return this.isStopRequired() ?
      p([
        'Changing the machine type (increasing or decreasing the # of CPUs or Mem) results in an update that requires a ',
        b(['restart']),
        ' of your runtime. This may take a 3-5 minutes. Would you like to proceed? ',
        b(['(You will not lose any files.)'])
      ]) :
      p([
        'Increasing the disk size or changing the number of workers (when the number of workers is >2) results in a real-time update to your runtime. ',
        'Updating the number of workers can take around 2 minutes. ',
        'During this update, you can continue to work.'
      ])
  }

  getImageUrl(runtimeDetails) {
    const { runtimeImages } = runtimeDetails
    return _.find(({ imageType }) => _.includes(imageType, ['Jupyter', 'RStudio']), runtimeImages)
  }

  componentDidMount = withErrorReporting('Error loading runtime', async () => {
    const { currentRuntime, namespace } = this.props

    const [currentRuntimeDetails, newLeoImages] = await Promise.all([
      currentRuntime ? Ajax().Runtimes.runtime(currentRuntime.googleProject, currentRuntime.runtimeName).details() : null,
      Ajax().Buckets.getObjectPreview('terra-docker-image-documentation', 'terra-docker-versions.json', namespace, true).then(res => res.json())
    ])

    this.setState({ leoImages: newLeoImages, currentRuntimeDetails })
    if (currentRuntimeDetails) {
      const { jupyterUserScriptUri } = currentRuntimeDetails
      const { imageUrl } = this.getImageUrl(currentRuntimeDetails)
      if (_.find({ image: imageUrl }, newLeoImages)) {
        this.setState({ selectedLeoImage: imageUrl })
      } else if (currentRuntimeDetails.labels.saturnIsProjectSpecific === 'true') {
        this.setState({ selectedLeoImage: PROJECT_SPECIFIC_MODE, customEnvImage: imageUrl })
      } else {
        this.setState({ selectedLeoImage: CUSTOM_MODE, customEnvImage: imageUrl })
      }

      if (jupyterUserScriptUri) {
        this.setState({ jupyterUserScriptUri, profile: 'custom' })
      }
    } else {
      this.setState({ selectedLeoImage: _.find({ id: 'terra-jupyter-gatk' }, newLeoImages).image })
    }
  })

  render() {
    const { currentRuntime, onDismiss, onSuccess } = this.props
    const {
      profile, masterMachineType, masterDiskSize, sparkMode, workerMachineType, numberOfWorkers, numberOfPreemptibleWorkers, workerDiskSize,
      jupyterUserScriptUri, selectedLeoImage, customEnvImage, leoImages, viewMode
    } = this.state
    const { version, updated, packages } = _.find({ image: selectedLeoImage }, leoImages) || {}

    const makeEnvSelect = id => h(Select, {
      id,
      'aria-label': 'Select Environment',
      value: selectedLeoImage,
      onChange: ({ value }) => this.setState({ selectedLeoImage: value }),
      isSearchable: true,
      isClearable: false,
      options: _.map(({ label, image }) => ({ label, value: image }), leoImages)
    })

    const isSelectedImageInputted = selectedLeoImage === CUSTOM_MODE || selectedLeoImage === PROJECT_SPECIFIC_MODE

    const machineTypeConstraints = { inclusion: { within: _.map('name', validMachineTypes), message: 'is not supported' } }
    const errors = validate(
      { masterMachineType, workerMachineType, customEnvImage },
      {
        masterMachineType: machineTypeConstraints,
        workerMachineType: machineTypeConstraints,
        customEnvImage: isSelectedImageInputted ? { format: { pattern: imageValidationRegexp } } : {}
      },
      {
        prettify: v => ({ customEnvImage: 'Container image', masterMachineType: 'Main CPU/memory', workerMachineType: 'Worker CPU/memory' }[v] ||
          validate.prettify(v))
      }
    )

    const makeGroupedEnvSelect = id => h(GroupedSelect, {
      id,
      maxMenuHeight: '25rem',
      value: selectedLeoImage,
      onChange: ({ value }) => {
        this.setState({ selectedLeoImage: value, customEnvImage: '' })
      },
      isSearchable: true,
      isClearable: false,
      options: [{ label: 'JUPYTER ENVIRONMENTS', options: _.map(({ label, image }) => ({ label, value: image }), leoImages) },
        {
          label: 'OTHER ENVIRONMENTS',
          options: [{ label: 'Custom Environment', value: CUSTOM_MODE }, { label: 'Project-Specific Environment', value: PROJECT_SPECIFIC_MODE }]
        }]
    })

    const makeImageInfo = style => div({ style: { whiteSpace: 'pre', ...style } }, [
      div({ style: Style.proportionalNumbers }, ['Updated: ', updated ? Utils.makeStandardDate(updated) : null]),
      div(['Version: ', version || null])
    ])

    const bottomButtons = () => h(Fragment, [
      div({ style: { display: 'flex', margin: '3rem 0 1rem' } }, [
        !!currentRuntime && h(ButtonSecondary, { onClick: () => this.setState({ viewMode: 'delete' }) }, 'Delete Runtime'),
        div({ style: { flex: 1 } }),
        h(ButtonSecondary, { style: { marginRight: '2rem' }, onClick: onDismiss }, 'Cancel'),
        h(ButtonPrimary, {
          disabled: !this.hasChanges() || !!errors,
          tooltip: Utils.summarizeErrors(errors),
          onClick: () => {
            if (isSelectedImageInputted && !this.canUpdate()) {
              this.setState({ viewMode: 'warning' })
            } else if (!!currentRuntime) {
              this.setState({ viewMode: getUpdateOrReplace() })
            } else {
              this.createRuntime()
            }
          }
        }, !!currentRuntime ? _.startCase(getUpdateOrReplace()) : 'Create')
      ])
    ])

    const getUpdateOrReplace = () => this.canUpdate() ? 'update' : 'replace'

    const machineConfig = () => h(Fragment, [
      div({
        style: {
          padding: '1rem', marginTop: '1rem',
          border: `2px solid ${colors.dark(0.3)}`, borderRadius: 9
        }
      }, [
        div({ style: { fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' } }, ['COMPUTE POWER']),
        div({ style: { marginBottom: '1rem' } }, ['Select from one of the default runtime profiles or define your own']),
        div({ style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.2fr 1fr 5.5rem', gridGap: '1rem', alignItems: 'center' } }, [
          h(IdContainer, [
            id => h(Fragment, [
              label({ htmlFor: id, style: styles.label }, 'Profile'),
              div({ style: { gridColumnEnd: 'span 5' } }, [
                h(Select, {
                  id,
                  value: profile,
                  onChange: ({ value }) => {
                    this.setState({
                      profile: value,
                      ...(value === 'custom' ? {} : normalizeRuntimeConfig(_.find({ name: value }, profiles).runtimeConfig))
                    })
                  },
                  isSearchable: false,
                  isClearable: false,
                  options: [
                    ..._.map(({ name, label }) => ({ value: name, label: `${label} computer power` }), profiles),
                    { value: 'custom', label: 'Custom' }
                  ]
                })
              ])
            ])
          ]),
          h(MachineSelector, {
            machineType: masterMachineType,
            onChangeMachineType: v => this.setState({ masterMachineType: v }),
            diskSize: masterDiskSize,
            onChangeDiskSize: v => this.setState({ masterDiskSize: v }),
            readOnly: profile !== 'custom'
          }),
          profile === 'custom' && h(IdContainer, [
            id => h(Fragment, [
              label({ htmlFor: id, style: styles.label }, 'Startup\nscript'),
              div({ style: { gridColumnEnd: 'span 5' } }, [
                h(TextInput, {
                  id,
                  placeholder: 'URI',
                  value: jupyterUserScriptUri,
                  onChange: v => this.setState({ jupyterUserScriptUri: v })
                })
              ])
            ])
          ]),
          h(IdContainer, [
            id => h(Fragment, [
              label({ htmlFor: id, style: styles.label }, 'Runtime\nType'),
              div({ style: { gridColumnEnd: 'span 3' } }, [
                h(Select, {
                  id,
                  isSearchable: false,
                  value: sparkMode,
                  onChange: ({ value }) => this.setState({
                    sparkMode: value,
                    numberOfWorkers: value === 'cluster' ? 2 : 0,
                    numberOfPreemptibleWorkers: 0
                  }),
                  options: [
                    { value: false, label: 'Standard VM' },
                    { value: 'master', label: 'Spark master node' },
                    { value: 'cluster', label: 'Configure as spark cluster' }
                  ]
                })
              ])
            ])
          ])
        ]),
        sparkMode === 'cluster' && fieldset({
          style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.2fr 1fr 5.5rem', gridGap: '1rem', alignItems: 'center' }
        }, [
          legend(['Worker config']),
          h(IdContainer, [
            id => h(Fragment, [
              label({ htmlFor: id, style: styles.label }, 'Workers'),
              h(NumberInput, {
                id,
                min: 2,
                isClearable: false,
                onlyInteger: true,
                value: numberOfWorkers,
                onChange: v => this.setState({
                  numberOfWorkers: v,
                  numberOfPreemptibleWorkers: _.min([numberOfPreemptibleWorkers, v])
                })
              })
            ])
          ]),
          h(IdContainer, [
            id => h(Fragment, [
              label({
                htmlFor: id,
                style: styles.label
              }, 'Preemptible'),
              h(NumberInput, {
                id,
                min: 0,
                max: numberOfWorkers,
                isClearable: false,
                onlyInteger: true,
                value: numberOfPreemptibleWorkers,
                onChange: v => this.setState({ numberOfPreemptibleWorkers: v })
              })
            ])
          ]),
          div({ style: { gridColumnEnd: 'span 2' } }),
          h(MachineSelector, {
            machineType: workerMachineType,
            onChangeMachineType: v => this.setState({ workerMachineType: v }),
            diskSize: workerDiskSize,
            onChangeDiskSize: v => this.setState({ workerDiskSize: v })
          })
        ]),
        div({
          style: { backgroundColor: colors.dark(0.2), borderRadius: 100, width: 'fit-content', padding: '0.75rem 1.25rem', ...styles.row }
        }, [
          span({ style: { ...styles.label, marginRight: '0.25rem' } }, ['COST:']),
          `${Utils.formatUSD(machineConfigCost(this.getRuntimeConfig()))} per hour`
        ])
      ])
    ])

    const contents = Utils.switchCase(viewMode,
      ['packages', () => h(Fragment, [
        makeEnvSelect(),
        makeImageInfo({ margin: '1rem 0 0.5rem' }),
        packages && h(ImageDepViewer, { packageLink: packages })
      ])],
      ['warning', () => h(Fragment, [
        p({ style: { marginTop: 0, lineHeight: 1.5 } }, [
          `You are about to create a virtual machine using an unverified Docker image.
            Please make sure that it was created by you or someone you trust, using one of our `,
          h(Link, { href: terraBaseImages, ...Utils.newTabLinkProps }, ['base images.']),
          ' Custom Docker images could potentially cause serious security issues.'
        ]),
        h(Link, { href: safeImageDocumentation, ...Utils.newTabLinkProps }, ['Learn more about creating safe and secure custom Docker images.']),
        p({ style: { lineHeight: 1.5 } }, [
          'If you\'re confident that your image is safe, click ', b([!!currentRuntime ? 'NEXT' : 'CREATE']),
          ' to use it. Otherwise, click ', b(['BACK']), ' to select another image.'
        ]),
        div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' } }, [
          h(ButtonSecondary, { style: { marginRight: '2rem' }, onClick: () => this.setState({ viewMode: undefined }) }, ['Back']),
          h(ButtonPrimary, {
            onClick: () => !!currentRuntime ? this.setState({ viewMode: 'replace' }) : this.createRuntime()
          }, [!!currentRuntime ? 'Next' : 'Create'])
        ])
      ])],
      ['delete', () => h(Fragment, [
        h(deleteText),
        div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' } }, [
          h(ButtonSecondary, { style: { marginRight: '2rem' }, onClick: () => this.setState({ viewMode: undefined }) }, ['CANCEL']),
          h(ButtonPrimary, { onClick: () => onSuccess(this.deleteRuntime()) }, ['DELETE'])
        ])
      ])],
      ['replace', () => h(Fragment, [
        p([
          'Replacing your runtime will ', b(['delete any files on the associated hard disk ']),
          '(e.g. input data or analysis outputs) and installed packages. To permanently save these files, ',
          h(Link, {
            href: 'https://support.terra.bio/hc/en-us/articles/360026639112',
            ...Utils.newTabLinkProps
          }, ['move them to the workspace bucket.'])
        ]),
        p(['You will be unable to work on the notebooks in this workspace while it updates, which can take a few minutes.']),
        div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' } }, [
          h(ButtonSecondary, {
            style: { marginRight: '2rem' },
            onClick: () => this.setState({ viewMode: undefined })
          }, ['BACK']),
          h(ButtonPrimary, { onClick: () => this.createRuntime() }, ['REPLACE'])
        ])
      ])],
      ['update', () => h(Fragment, [
        currentRuntime.status === 'Running' ?
          this.getRunningUpdateText() :
          p([
            'This will update your existing runtime. You will not lose any files. ',
            'After the update is finished you will be able to start your runtime. ',
            'Note that updating the number of workers requires your runtime to already be started.'
          ]),
        div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' } }, [
          h(ButtonSecondary, {
            style: { marginRight: '2rem' },
            onClick: () => this.setState({ viewMode: undefined })
          }, ['BACK']),
          h(ButtonPrimary, { onClick: () => this.updateRuntime(this.isStopRequired()) }, ['UPDATE'])
        ])
      ])],
      [Utils.DEFAULT, () => h(Fragment, [
        div({ style: { marginBottom: '1rem' } }, [
          'Create a cloud compute instance to launch Jupyter Notebooks or a Project-Specific software application.'
        ]),
        h(IdContainer, [
          id => h(Fragment, [
            div({ style: { marginBottom: '0.5rem' } }, [
              label({ htmlFor: id, style: styles.label }, 'ENVIRONMENT'),
              h(InfoBox, { style: { marginLeft: '0.5rem' } }, [
                'Environment defines the software application + programming languages + packages used when you create your runtime. '
              ])
            ]),
            div({ style: { height: 45 } }, [makeGroupedEnvSelect(id)])
          ])
        ]),
        Utils.switchCase(selectedLeoImage,
          [CUSTOM_MODE, () => {
            return h(Fragment, [
              h(IdContainer, [
                id => h(Fragment, [
                  label({ htmlFor: id, style: { ...styles.label, display: 'block', margin: '0.5rem 0' } }, 'CONTAINER IMAGE'),
                  div({ style: { height: 52, marginBottom: '0.5rem' } }, [
                    h(ValidatedInput, {
                      inputProps: {
                        id,
                        placeholder: '<image name>:<tag>',
                        value: customEnvImage,
                        onChange: customEnvImage => this.setState({ customEnvImage })
                      },
                      error: Utils.summarizeErrors(customEnvImage && errors?.customEnvImage)
                    })
                  ])
                ])
              ]),
              div({ style: { margin: '0.5rem' } }, [
                'Custom environments ', b(['must ']), 'be based off one of the ',
                h(Link, { href: terraBaseImages, ...Utils.newTabLinkProps }, ['Terra Jupyter Notebook base images']),
                ' or a ',
                h(Link, { href: zendeskImagePage, ...Utils.newTabLinkProps }, ['Project-Specific image'])
              ])
            ])
          }],
          [PROJECT_SPECIFIC_MODE, () => {
            return div({ style: { lineHeight: 1.5 } }, [
              'Some consortium projects, such as ',
              h(Link, { href: rstudioBaseImages, ...Utils.newTabLinkProps }, ['AnVIL']),
              ', have created environments that are specific to their project. If you want to use one of these:',
              div({ style: { marginTop: '0.5rem' } }, [
                '1. Find the environment image (',
                h(Link, { href: zendeskImagePage, ...Utils.newTabLinkProps }, ['view image list']),
                ') '
              ]),
              div({ style: { margin: '0.5rem 0' } }, ['2. Copy the URL from the github repository']),
              div({ style: { margin: '0.5rem 0' } }, ['3. Enter the URL for the image in the text box below']),
              h(ValidatedInput, {
                inputProps: {
                  placeholder: 'Paste image path here',
                  value: customEnvImage,
                  onChange: customEnvImage => this.setState({ customEnvImage })
                },
                error: Utils.summarizeErrors(customEnvImage && errors?.customEnvImage)
              })
            ])
          }],
          [Utils.DEFAULT, () => {
            return h(Fragment, [
              div({ style: { display: 'flex' } }, [
                h(Link, { onClick: () => this.setState({ viewMode: 'packages' }) }, ['What’s installed on this environment?']),
                makeImageInfo({ marginLeft: 'auto' })
              ])
            ])
          }]),
        machineConfig(),
        bottomButtons()
      ])]
    )

    return h(Fragment, [
      h(TitleBar, {
        title: Utils.switchCase(viewMode,
          ['packages', () => 'INSTALLED PACKAGES'],
          ['warning', () => 'WARNING!'],
          ['delete', () => 'DELETE RUNTIME?'],
          ['update', () => 'UPDATE RUNTIME?'],
          [Utils.DEFAULT, () => 'RUNTIME CONFIGURATION']
        ),
        onDismiss,
        onPrevious: !!viewMode ? () => this.setState({ viewMode: undefined }) : undefined
      }),
      div({ style: { padding: '0.5rem 1.5rem 1.5rem', flexGrow: 1, display: 'flex', flexDirection: 'column' } }, [contents])
    ])
  }
})
