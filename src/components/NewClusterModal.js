import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Component, Fragment } from 'react'
import { b, div, h, label, p, span } from 'react-hyperscript-helpers'
import { ButtonPrimary, ButtonSecondary, GroupedSelect, IdContainer, LabeledCheckbox, Link, Select } from 'src/components/common'
import { ImageDepViewer } from 'src/components/ImageDepViewer'
import { NumberInput, TextInput, ValidatedInput } from 'src/components/input'
import { withModalDrawer } from 'src/components/ModalDrawer'
import TitleBar from 'src/components/TitleBar'
import { machineTypes, profiles } from 'src/data/clusters'
import { imageValidationRegexp } from 'src/data/leo-images'
import { Ajax } from 'src/libs/ajax'
import { machineConfigCost, normalizeMachineConfig } from 'src/libs/cluster-utils'
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
  warningBox: {
    fontSize: 12,
    backgroundColor: colors.warning(),
    color: 'white',
    padding: '2rem',
    margin: '2rem -1.5rem 0 -1.5rem'
  }
}

const terraDockerBaseGithubUrl = 'https://github.com/databiosphere/terra-docker'
const terraBaseImages = `${terraDockerBaseGithubUrl}#terra-base-images`
const imageInstructions = `${terraDockerBaseGithubUrl}#how-to-create-your-own-custom-image-to-use-with-notebooks-on-terra`
const safeImageDocumentation = 'https://support.terra.bio/hc/en-us/articles/360034669811'
const machineConfigsEqual = (a, b) => {
  return _.isEqual(normalizeMachineConfig(a), normalizeMachineConfig(b))
}

const MachineSelector = ({ machineType, onChangeMachineType, diskSize, onChangeDiskSize, readOnly }) => {
  const { cpu: currentCpu, memory: currentMemory } = _.find({ name: machineType }, machineTypes)
  return h(Fragment, [
    h(IdContainer, [
      id => h(Fragment, [
        label({ htmlFor: id, style: styles.label }, 'CPUs'),
        div([
          h(Select, {
            isDisabled: readOnly,
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
        div([
          h(Select, {
            isDisabled: readOnly,
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
        h(NumberInput, {
          disabled: readOnly,
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
      jupyterUserScriptUri: '',
      customEnvImage: '',
      viewModeBreadCrumbs: ['JupyterEnv'],
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

  createCluster() {
    const { namespace, onSuccess, currentCluster } = this.props
    const { jupyterUserScriptUri, selectedLeoImage, customEnvImage } = this.state
    onSuccess(Promise.all([
      Ajax().Jupyter.cluster(namespace, Utils.generateClusterName()).create({
        machineConfig: this.getMachineConfig(),
        toolDockerImage: this.getCurrViewFromBreadCrumbs() === 'CustomEnv' ? customEnvImage : selectedLeoImage,
        ...(jupyterUserScriptUri ? { jupyterUserScriptUri } : {})
      }),
      currentCluster && currentCluster.status === 'Error' && Ajax().Jupyter.cluster(currentCluster.googleProject, currentCluster.clusterName).delete()
    ]))
  }

  addCurrViewToBreadCrumbs = viewMode => {
    const { viewModeBreadCrumbs } = this.state
    const tempBreadCrumbs = viewModeBreadCrumbs
    tempBreadCrumbs.push(viewMode)
    this.setState({ viewModeBreadCrumbs: tempBreadCrumbs })
  }

  getCurrViewFromBreadCrumbs = () => {
    const { viewModeBreadCrumbs } = this.state
    return (viewModeBreadCrumbs[viewModeBreadCrumbs.length - 1])
  }

  removeCurrViewFromBreadCrumbs = () => {
    const { viewModeBreadCrumbs } = this.state
    const tempBreadCrumbs = viewModeBreadCrumbs
    tempBreadCrumbs.pop()
    this.setState({ viewModeBreadCrumbs: tempBreadCrumbs })
  }

  componentDidMount = withErrorReporting('Error loading cluster', async () => {
    const { currentCluster, namespace } = this.props
    const [currentClusterDetails, newLeoImages] = await Promise.all([
      currentCluster ? Ajax().Jupyter.cluster(currentCluster.googleProject, currentCluster.clusterName).details() : null,
      Ajax().Buckets.getObjectPreview('terra-docker-image-documentation', 'terra-docker-versions.json', namespace, true).then(res => res.json())
    ])
    this.setState({ leoImages: newLeoImages })
    if (currentClusterDetails) {
      const { clusterImages, jupyterUserScriptUri } = currentClusterDetails
      const { imageUrl } = _.find({ imageType: 'Jupyter' }, clusterImages)
      if (_.find({ image: imageUrl }, newLeoImages)) {
        this.setState({ selectedLeoImage: imageUrl })
      } else {
        this.addCurrViewToBreadCrumbs('CustomEnv')
        this.setState({ customEnvImage: imageUrl })
      }
      if (jupyterUserScriptUri) {
        this.setState({ jupyterUserScriptUri, profile: 'custom' })
      }
    } else {
      this.setState({ selectedLeoImage: _.find({ id: 'leonardo-jupyter-dev' }, newLeoImages).image })
    }
  })

  render() {
    const { currentCluster, onDismiss } = this.props
    const {
      profile, masterMachineType, masterDiskSize, workerMachineType, numberOfWorkers, numberOfPreemptibleWorkers, workerDiskSize,
      jupyterUserScriptUri, selectedLeoImage, customEnvImage, leoImages
    } = this.state
    const { version, updated, packages } = _.find({ image: selectedLeoImage }, leoImages) || {}

    const isCustomImageInvalid = !imageValidationRegexp.test(customEnvImage)

    const makeEnvSelect = id => h(Select, {
      id,
      value: selectedLeoImage,
      onChange: ({ value }) => this.setState({ selectedLeoImage: value }),
      isSearchable: false,
      isClearable: false,
      options: _.map(({ label, image }) => ({ label, value: image }), leoImages)
    })

    const makeGroupedEnvSelect = id => h(GroupedSelect, {
      id,
      value: this.getCurrViewFromBreadCrumbs() === 'JupyterEnv' ? selectedLeoImage : customEnvImage,
      onChange: ({ value, label }) => {
        Utils.switchCase(label,
          ['Custom Environment',
            () => {
              this.setState({ customEnvImage: value })
              this.addCurrViewToBreadCrumbs('CustomEnv')
            }],
          [Utils.DEFAULT,
            () => {
              this.setState({ selectedLeoImage: value })
              this.addCurrViewToBreadCrumbs('JupyterEnv')
            }]
        )
      },
      isSearchable: false,
      isClearable: false,
      options: makeGroupedOptionsArray()
    })

    const makeGroupedOptionsArray = () => {
      return (
        [{ label: 'JUPYTER ENVIRONMENTS', options: _.map(({ label, image }) => ({ label, value: image }), leoImages) },
          { label: 'OTHER ENVIRONMENTS', options: [{ label: 'Custom Environment', value: customEnvImage }] }]
      )
    }

    const makeImageInfo = style => div({ style: { whiteSpace: 'pre', ...style } }, [
      div({ style: Style.proportionalNumbers }, ['Updated: ', updated ? Utils.makeStandardDate(updated) : null]),
      div(['Version: ', version || null])
    ])

    const { contents, onPrevious } = Utils.switchCase(this.getCurrViewFromBreadCrumbs(),
      ['CustomEnv', () => ({
        contents: h(Fragment, [
          h(IdContainer, [
            id => h(Fragment, [
              label({ htmlFor: id, style: { ...styles.label, alignSelf: 'start' } }, 'CONTAINER IMAGE'),
              div({ style: { gridColumnStart: '1', gridColumnEnd: 'span 3', alignSelf: 'start', height: '45px' } }, [
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
          div({ style: { gridColumnStart: 1, gridColumnEnd: 'span 3', alignSelf: 'start', margin: '0.5rem' } }, [
            h(Link, { href: imageInstructions, ...Utils.newTabLinkProps }, ['Custom notebook environments']),
            span({ style: { fontWeight: 'bold' } }, [' must ']),
            ' be based off one of the ',
            h(Link, { href: terraBaseImages, ...Utils.newTabLinkProps }, ['Terra base images.'])
          ])
        ])
      })],
      ['JupyterEnv', () => ({
        contents: h(Fragment, [
          div({ style: { gridColumnStart: 1, gridColumnEnd: 'span 2', alignSelf: 'start' } }, [
            h(Link, { onClick: () => this.addCurrViewToBreadCrumbs('Packages') },
              ['What’s installed on this environment?'])
          ]),
          makeImageInfo()
        ])
      })],
      ['Packages', () => ({
        onPrevious: () => this.removeCurrViewFromBreadCrumbs(),
        contents: h(Fragment, [
          makeEnvSelect(),
          makeImageInfo({ margin: '1rem 0 2rem' }),
          packages && h(ImageDepViewer, { packageLink: packages })
        ])
      })],
      ['Warning', () => ({
        onPrevious: () => this.removeCurrViewFromBreadCrumbs(),
        contents: h(Fragment, [
          div({ style: { marginBottom: '0.5rem', fontWeight: 'bold' } }, ['Warning!']),
          p([
            `You are about to create a virtual machine using an unverified Docker image.
             Please make sure that it was created by you or someone you trust, using one of our `,
            h(Link, { href: terraBaseImages, ...Utils.newTabLinkProps }, ['base images.']),
            ' Custom Docker images could potentially cause serious security issues.'
          ]),
          h(Link, { href: safeImageDocumentation, ...Utils.newTabLinkProps }, ['Learn more about creating safe and secure custom Docker images.']),
          p([
            'If you\'re confident that your image is safe, click ', b(['Create']), ' to use it. Otherwise, click ', b(['Back']),
            ' to select another image.'
          ]),
          div({ style: { display: 'flex', justifyContent: 'flex-end' } }, [
            h(ButtonSecondary,
              {
                style: { marginRight: '2rem' }, onClick: () => this.removeCurrViewFromBreadCrumbs()
              },
              ['Back']),
            h(ButtonPrimary, { onClick: () => this.createCluster() }, ['Create'])
          ])
        ])
      })]
    )

    const bottomButtons = () => h(Fragment, [
      div({ style: { flexGrow: 1 } }),
      div(
        { style: { display: 'grid', gridTemplateColumns: '2fr 1.5fr .75fr .75fr', gridGap: '1rem', margin: '1.5rem 0 1rem', alignItems: 'center' } },
        [
          div({ style: { gridColumnStart: '3' } }, [
            h(ButtonSecondary, {
              onClick: onDismiss
            }, 'Cancel')
          ]),
          div({ style: { gridColumnStart: '4' } }, [
            h(ButtonPrimary, {
              disabled: this.getCurrViewFromBreadCrumbs() === 'CustomEnv' && isCustomImageInvalid,
              tooltip: this.getCurrViewFromBreadCrumbs() === 'CustomEnv' && isCustomImageInvalid &&
                'Enter a valid docker image to use',
              onClick: () => this.getCurrViewFromBreadCrumbs() === 'CustomEnv' ?
                this.addCurrViewToBreadCrumbs('Warning') :
                this.createCluster()
            }, !!currentCluster ? 'Replace' : 'Create')
          ])
        ])
    ])

    const machineConfig = () => h(Fragment, [
      div({
        style: {
          padding: '1rem', marginTop: '1rem',
          backgroundColor: colors.dark(0.15),
          border: `2px solid ${colors.dark(0.3)}`, borderRadius: '9px'
        }
      }, [
        div({ style: { fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' } }, ['COMPUTE POWER']),
        div({ style: { marginBottom: '1rem' } }, ['Select from one of the compute runtime profiles or define your own']),
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
        div({ style: styles.row }, [
          span({ style: { ...styles.label, marginRight: '0.25rem' } }, ['Cost:']),
          `${Utils.formatUSD(machineConfigCost(this.getMachineConfig()))} per hour`
        ])
      ]),
      !!currentCluster && div({ style: styles.warningBox }, [
        div({ style: styles.label }, ['Caution:']),
        'Replacing your runtime will stop all running notebooks, and delete any files on the associated hard disk (e.g. input data or analysis outputs) and installed packages. To permanently save these files, ',
        h(Link, {
          variant: 'light',
          href: 'https://support.terra.bio/hc/en-us/articles/360026639112',
          ...Utils.newTabLinkProps
        }, ['move them to the workspace bucket.']),
        p(['You will be unable to work on the notebooks in this workspace while it updates, which can take a few minutes.'])
      ])
    ])

    const fullDrawer = () => {
      return (
        this.getCurrViewFromBreadCrumbs() === 'CustomEnv' || this.getCurrViewFromBreadCrumbs() === 'JupyterEnv' ?
          h(Fragment, [
            div({ style: { marginBottom: '1rem' } },
              ['Create a compute instance to launch Jupyter Notebooks or a Project-Specific software application.']),
            div({ style: { display: 'grid', gridTemplateColumns: '7rem 2fr 1fr', gridGap: '0.75rem', alignItems: 'center', minHeight: 100 } },
              [h(IdContainer, [
                id => h(Fragment, [
                  label({ htmlFor: id, style: styles.label }, 'ENVIRONMENT'),
                  div({ style: { gridColumnEnd: 'span 3', height: '45px' } }, [makeGroupedEnvSelect(id)])
                ])
              ]), contents]),
            machineConfig(),
            bottomButtons()
          ]) : h(Fragment, [contents])
      )
    }

    return h(Fragment, [
      h(TitleBar, {
        title: this.getCurrViewFromBreadCrumbs() === 'Packages' ? 'INSTALLED PACKAGES' : 'APPLICATION COMPUTE CONFIGURATION',
        onDismiss,
        onPrevious
      }),
      div({ style: { padding: '0 1.5rem 1.5rem 1.5rem', flexGrow: 1, display: 'flex', flexDirection: 'column' } }, [fullDrawer()])
    ])
  }
})
