import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Component, Fragment } from 'react'
import { b, div, h, image, label, p, span } from 'react-hyperscript-helpers'
import { ButtonPrimary, ButtonSecondary, GroupedSelect, IdContainer, LabeledCheckbox, Link, Select } from 'src/components/common'
import { ImageDepViewer } from 'src/components/ImageDepViewer'
import { NumberInput, TextInput, ValidatedInput } from 'src/components/input'
import { withModalDrawer } from 'src/components/ModalDrawer'
import { InfoBox } from 'src/components/PopupTrigger'
import TitleBar from 'src/components/TitleBar'
import { machineTypes, profiles } from 'src/data/clusters'
import { Ajax } from 'src/libs/ajax'
import { deleteText, machineConfigCost, normalizeMachineConfig } from 'src/libs/cluster-utils'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


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
const zendeskImagePage = 'https://support.terra.bio/hc/en-us/articles/360037269472'
const machineConfigsEqual = (a, b) => {
  return _.isEqual(normalizeMachineConfig(a), normalizeMachineConfig(b))
}

// distilled from https://github.com/docker/distribution/blob/95daa793b83a21656fe6c13e6d5cf1c3999108c7/reference/regexp.go
const imageValidationRegexp = /^[A-Za-z0-9]+[\w./-]+(?::\w[\w.-]+)?(?:@[\w+.-]+:[A-Fa-f0-9]{32,})?$/

const MachineSelector = ({ machineType, onChangeMachineType, diskSize, onChangeDiskSize, readOnly }) => {
  const { cpu: currentCpu, memory: currentMemory } = _.find({ name: machineType }, machineTypes)
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
              onChange: ({ value }) => onChangeMachineType(_.find({ cpu: value }, machineTypes).name),
              options: _.uniq(_.map('cpu', machineTypes))
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
              onChange: ({ value }) => onChangeMachineType(_.find({ cpu: currentCpu, memory: value }, machineTypes).name),
              options: _.map('memory', _.sortBy('memory', _.filter({ cpu: currentCpu }, machineTypes)))
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

export const NewClusterModal = withModalDrawer({ width: 675 })(class NewClusterModal extends Component {
  static propTypes = {
    currentCluster: PropTypes.object,
    namespace: PropTypes.string.isRequired,
    onDismiss: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props)
    const { currentCluster } = props
    const currentConfig = currentCluster ? currentCluster.machineConfig : profiles[0].machineConfig
    const matchingProfile = _.find(
      ({ machineConfig }) => machineConfigsEqual(machineConfig, currentConfig),
      profiles
    )
    this.state = {
      profile: matchingProfile ? matchingProfile.name : 'custom',
      jupyterUserScriptUri: '', customEnvImage: '', viewMode: undefined,
      ...normalizeMachineConfig(currentConfig)
    }
  }

  getMachineConfig() {
    const { numberOfWorkers, masterMachineType, masterDiskSize, workerMachineType, workerDiskSize, numberOfPreemptibleWorkers } = this.state
    return {
      numberOfWorkers, masterMachineType,
      masterDiskSize, workerMachineType,
      workerDiskSize, numberOfWorkerLocalSSDs: 0,
      numberOfPreemptibleWorkers
    }
  }

  deleteCluster() {
    const { currentCluster } = this.props
    const { googleProject, clusterName } = currentCluster

    return Ajax().Clusters.cluster(googleProject, clusterName).delete()
  }

  createCluster() {
    const { namespace, onSuccess, currentCluster } = this.props
    const { jupyterUserScriptUri, selectedLeoImage, customEnvImage } = this.state
    onSuccess(Promise.all([
      Ajax().Clusters.cluster(namespace, Utils.generateClusterName()).create({
        machineConfig: this.getMachineConfig(),
        toolDockerImage: selectedLeoImage === CUSTOM_MODE || selectedLeoImage === PROJECT_SPECIFIC_MODE ? customEnvImage : selectedLeoImage,
        labels: { saturnIsProjectSpecific: `${selectedLeoImage === PROJECT_SPECIFIC_MODE}` },
        ...(jupyterUserScriptUri ? { jupyterUserScriptUri } : {})
      }),
      !!currentCluster && this.deleteCluster()
    ]))
  }

  updateCluster() {
    console.log('in update cluster')
    const { currentCluster } = this.props
    const { googleProject, clusterName } = currentCluster

    return Ajax().Clusters.cluster(googleProject, clusterName).update({
        machineConfig: this.getMachineConfig()
    })
  }

  componentDidMount = withErrorReporting('Error loading cluster', async () => {
    const { currentCluster, namespace } = this.props

    const [currentClusterDetails, newLeoImages] = await Promise.all([
      currentCluster ? Ajax().Clusters.cluster(currentCluster.googleProject, currentCluster.clusterName).details() : null,
      Ajax().Buckets.getObjectPreview('terra-docker-image-documentation', 'terra-docker-versions.json', namespace, true).then(res => res.json())
    ])

    console.log("Current cluster details: ", currentClusterDetails)

    this.setState({ leoImages: newLeoImages })
    if (currentClusterDetails) {
      const { clusterImages, jupyterUserScriptUri } = currentClusterDetails
      const { imageUrl } = _.find(({ imageType }) => _.includes(imageType, ['Jupyter', 'RStudio']), clusterImages)
      if (_.find({ image: imageUrl }, newLeoImages)) {
        this.setState({ selectedLeoImage: imageUrl, originalImageUrl: imageUrl })
      } else if (currentClusterDetails.labels.saturnIsProjectSpecific === 'true') {
        this.setState({ selectedLeoImage: PROJECT_SPECIFIC_MODE, customEnvImage: imageUrl, originalImageUrl: imageUrl})
      } else {
        this.setState({ selectedLeoImage: CUSTOM_MODE, customEnvImage: imageUrl, originalImageUrl: imageUrl })
      }
      if (jupyterUserScriptUri) {
        this.setState({ jupyterUserScriptUri, profile: 'custom' })
      }
    } else {
      this.setState({ selectedLeoImage: _.find({ id: 'terra-jupyter-gatk' }, newLeoImages).image })
    }
  })

  render() {
    const { currentCluster, onDismiss, onSuccess } = this.props
    const {
      profile, masterMachineType, masterDiskSize, workerMachineType, numberOfWorkers, numberOfPreemptibleWorkers, workerDiskSize,
      jupyterUserScriptUri, selectedLeoImage, customEnvImage, leoImages, viewMode, originalImageUrl
    } = this.state
    const { version, updated, packages } = _.find({ image: selectedLeoImage }, leoImages) || {}


    const makeEnvSelect = id => h(Select, {
      id,
      value: selectedLeoImage,
      onChange: ({ value }) => this.setState({ selectedLeoImage: value }),
      isSearchable: false,
      isClearable: false,
      options: _.map(({ label, image }) => ({ label, value: image }), leoImages)
    })

    const isCustomImageInvalid = !imageValidationRegexp.test(customEnvImage)
    const isSelectedImageInputted = selectedLeoImage === CUSTOM_MODE || selectedLeoImage === PROJECT_SPECIFIC_MODE

    const makeGroupedEnvSelect = id => h(GroupedSelect, {
      id,
      maxMenuHeight: '25rem',
      value: selectedLeoImage,
      onChange: ({ value }) => {
        this.setState({ selectedLeoImage: value, customEnvImage: '' })
      },
      isSearchable: false,
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
        !!currentCluster && h(ButtonSecondary, { onClick: () => this.setState({ viewMode: 'delete' }) }, 'Delete Runtime'),
        div({ style: { flex: 1 } }),
        h(ButtonSecondary, { style: { marginRight: '2rem' }, onClick: onDismiss }, 'Cancel'),
        h(ButtonPrimary, {
          disabled: isSelectedImageInputted && isCustomImageInvalid,
          tooltip: isSelectedImageInputted && isCustomImageInvalid && 'Enter a valid docker image to use',
          onClick: () => {
            if (isSelectedImageInputted) {
              this.setState({ viewMode: 'warning' })
            } else if (!!currentCluster) {
              this.setState({ viewMode: _.lowerCase(getUpdateOrReplace()) })
            } else {
              this.createCluster()
            }
          }
        }, !!currentCluster ? getUpdateOrReplace() : 'Create')
      ])
    ])

    //determines whether the changes are applicable for a call to the leo patch endpoint
    //see this for a diagram of the conditional this implements https://drive.google.com/file/d/1mtFFecpQTkGYWSgPlaHksYaIudWHa0dY/view
    //this function returns true for cases 2 & 3 in this diagram
    const canUpdate = () => {
      const currentClusterConfig = currentCluster.machineConfig
      const userSelectedConfig = this.getMachineConfig()

      const hasImageChanged = !_.includes(originalImageUrl, [selectedLeoImage, customEnvImage])

      const workersCantUpdate = currentClusterConfig.numberOfWorkers != userSelectedConfig.numberOfWorkers &&
        (currentClusterConfig.numberOfWorkers < 2 || userSelectedConfig.numberOfWorkers < 2)

      const hasUnUpdateableResourceChanged =
        currentClusterConfig.workerDiskSize != userSelectedConfig.workerDiskSize ||
        currentClusterConfig.workerMachineType != userSelectedConfig.workerMachineType ||
        currentClusterConfig.numberOfWorkerLocalSSDs != userSelectedConfig.numberOfWorkerLocalSSDs

      const hasWorkers = currentClusterConfig.numberOfWorkers >= 2 || currentClusterConfig.numberOfPreemptibleWorkers >= 2

      const hasWorkersResourceChanged = hasWorkers && hasUnUpdateableResourceChanged

      const hasDiskSizeDecreased = currentClusterConfig.masterDiskSize > userSelectedConfig.masterDiskSize

      const cantUpdate = workersCantUpdate || hasWorkersResourceChanged || hasDiskSizeDecreased || hasImageChanged
      return !cantUpdate
    }

    //returns true for case 3 in this diagram: https://drive.google.com/file/d/1mtFFecpQTkGYWSgPlaHksYaIudWHa0dY/view
    const isStopRequired = () => {
      const currentClusterConfig = currentCluster.machineConfig
      const userSelectedConfig = this.getMachineConfig()

      const isMasterMachineTypeChanged = currentClusterConfig.masterMachineType != userSelectedConfig.masterMachineType

      const isClusterRunning = currentCluster.status == 'Running'

      return canUpdate() && isMasterMachineTypeChanged && isClusterRunning
    }

    const getUpdateOrReplace = () => canUpdate() ? "Update" : "Replace"

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
                      ...(value === 'custom' ? {} : normalizeMachineConfig(_.find({ name: value }, profiles).machineConfig))
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
          profile === 'custom' && h(Fragment, [
            h(IdContainer, [
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
            div({ style: { gridColumnEnd: 'span 6' } }, [
              h(LabeledCheckbox, {
                checked: !!numberOfWorkers,
                onChange: v => this.setState({
                  numberOfWorkers: v ? 2 : 0,
                  numberOfPreemptibleWorkers: 0
                })
              }, ' Configure as Spark cluster')
            ]),
            !!numberOfWorkers && h(Fragment, [
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
            ])
          ])
        ]),
        div({
          style: { backgroundColor: colors.dark(0.2), borderRadius: 100, width: 'fit-content', padding: '0.75rem 1.25rem', ...styles.row }
        }, [
          span({ style: { ...styles.label, marginRight: '0.25rem' } }, ['COST:']),
          `${Utils.formatUSD(machineConfigCost(this.getMachineConfig()))} per hour`
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
          'If you\'re confident that your image is safe, click ', b([!!currentCluster ? 'NEXT' : 'CREATE']),
          ' to use it. Otherwise, click ', b(['BACK']), ' to select another image.'
        ]),
        div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' } }, [
          h(ButtonSecondary, { style: { marginRight: '2rem' }, onClick: () => this.setState({ viewMode: undefined }) }, ['Back']),
          h(ButtonPrimary, {
            onClick: () => !!currentCluster ? this.setState({ viewMode: 'replace' }) : this.createCluster()
          }, [!!currentCluster ? 'Next' : 'Create'])
        ])
      ])],
      ['delete', () => h(Fragment, [
        h(deleteText),
        div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' } }, [
          h(ButtonSecondary, { style: { marginRight: '2rem' }, onClick: () => this.setState({ viewMode: undefined }) }, ['CANCEL']),
          h(ButtonPrimary, { onClick: () => onSuccess(this.deleteCluster()) }, ['DELETE'])
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
          h(ButtonPrimary, { onClick: () => this.createCluster() }, ['REPLACE'])
        ])
      ])],
      [ 'update', () => h(Fragment, [
        isStopRequired()
          ? p(['Changing the machine type (increasing or decreasing the # of CPUs or Mem) results in an update that requires a ',
            b(['restart']),
            ' of your runtime. This may take a few minutes.  Would you like to proceed? ',
            b(['(You will not lose any files.)'])
          ])
          : p(['Increasing the disk size or changing the number of workers (when the number of workers is >2) results in a real-time update to your runtime. ',
            'During this update, you can continue to work']),
        div({ style: { display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' } }, [
          h(ButtonSecondary, {
            style: { marginRight: '2rem' },
            onClick: () => this.setState({ viewMode: undefined })
          }, ['BACK']),
          h(ButtonPrimary, { onClick: () => onSuccess(this.updateCluster()) }, ['UPDATE'])
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
                      error: customEnvImage && isCustomImageInvalid && 'Not a valid image'
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
                error: customEnvImage && isCustomImageInvalid && 'Not a valid image'
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
