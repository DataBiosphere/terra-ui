import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Fragment, PureComponent, useState } from 'react'
import { b, div, h, h3, iframe, label, p, span } from 'react-hyperscript-helpers'
import { ButtonPrimary, ButtonSecondary, IdContainer, LabeledCheckbox, Link, Select, SimpleTabBar } from 'src/components/common'
import { NumberInput, TextInput, ValidatedInput } from 'src/components/input'
import { withModalDrawer } from 'src/components/ModalDrawer'
import TitleBar from 'src/components/TitleBar'
import { machineTypes, profiles } from 'src/data/clusters'
import { imageValidationRegexp, leoImages } from 'src/data/leo-images'
import { Ajax } from 'src/libs/ajax'
import { machineConfigCost, normalizeMachineConfig } from 'src/libs/cluster-utils'
import colors from 'src/libs/colors'
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

const terraImageRepo = 'https://github.com/databiosphere/terra-docker'
const imageInstructions = `${terraImageRepo}#how-to-create-your-own-terra-images`
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

const ImageDepViewer = ({ packages }) => {
  const pages = _.keys(packages)
  const [language, setLanguage] = useState(pages[0])
  const url = packages[language]

  return h(Fragment, [
    div({ style: { display: 'flex', alignItems: 'center' } }, [
      div({ style: { fontWeight: 'bold', marginRight: '1rem' } }, ['Installed packages']),
      pages.length === 1 ?
        `(${language})` :
        div({ style: { width: 100, textTransform: 'capitalize' } }, [
          h(Select, {
            'aria-label': 'Select a language',
            value: language,
            onChange: ({ value }) => setLanguage(value),
            isSearchable: false,
            isClearable: false,
            options: pages
          })
        ])
    ]),
    iframe({
      src: url,
      style: {
        padding: '1rem', marginTop: '1rem',
        backgroundColor: 'white', borderRadius: 5, border: 'none',
        overflowY: 'auto', flexGrow: 1
      }
    })
  ])
}

export const NewClusterModal = withModalDrawer({ width: 675 })(class NewClusterModal extends PureComponent {
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
      selectedLeoImage: leoImages[0].image,
      isCustomEnv: false, customEnvImage: '', showingCustomWarning: false,
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
    const { jupyterUserScriptUri, selectedLeoImage, isCustomEnv, customEnvImage } = this.state
    onSuccess(Promise.all([
      Ajax().Jupyter.cluster(namespace, Utils.generateClusterName()).create({
        machineConfig: this.getMachineConfig(),
        jupyterDockerImage: isCustomEnv ? customEnvImage : selectedLeoImage,
        ...(jupyterUserScriptUri ? { jupyterUserScriptUri } : {})
      }),
      currentCluster && currentCluster.status === 'Error' && Ajax().Jupyter.cluster(currentCluster.googleProject, currentCluster.clusterName).delete()
    ]))
  }

  render() {
    const { currentCluster, onDismiss } = this.props
    const {
      profile, masterMachineType, masterDiskSize, workerMachineType, numberOfWorkers, numberOfPreemptibleWorkers, workerDiskSize,
      jupyterUserScriptUri, selectedLeoImage,
      viewingPackages, isCustomEnv, customEnvImage, showingCustomWarning
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

    const makeImageInfo = style => div({ style: { whiteSpace: 'pre', ...style } }, [
      div({ style: Style.proportionalNumbers }, [`Updated: ${Utils.makeStandardDate(updated)}`]),
      div([`Version: ${version}`])
    ])

    const { onPrevious, contents } = Utils.cond(
      [
        viewingPackages, () => ({
          onPrevious: () => this.setState({ viewingPackages: false }),
          contents: h(Fragment, [
            makeEnvSelect(),
            makeImageInfo({ margin: '1rem 0 2rem' }),
            h(ImageDepViewer, { packages })
          ])
        })
      ],
      [
        showingCustomWarning, () => ({
          onPrevious: () => this.setState({ showingCustomWarning: false }),
          contents: h(Fragment, [
            h3({ style: { marginBottom: '0.5rem' } }, ['Warning!']),
            p([
              `You are about to create a virtual machine using an unverified Docker image. 
             Please make sure that it was created by you or someone you trust, using one of our `,
              h(Link, { href: terraImageRepo, ...Utils.newTabLinkProps }, ['base images.']),
              ' Custom Docker images could potentially cause serious security issues.'
            ]),
            h(Link, { href: imageInstructions, ...Utils.newTabLinkProps }, ['Learn more about creating safe and secure custom Docker images.']),
            p([
              'If you\'re confident that your image is safe, click ', b(['Create']), ' to use it. Otherwise, click ', b(['Back']),
              ' to select another image.'
            ]),
            div({ style: { display: 'flex', justifyContent: 'flex-end' } }, [
              h(ButtonSecondary, { style: { marginRight: '2rem' }, onClick: () => this.setState({ showingCustomWarning: false }) }, ['Back']),
              h(ButtonPrimary, { onClick: () => this.createCluster() }, ['Create'])
            ])
          ])
        })
      ],
      () => ({
        onPrevious: undefined,
        contents: h(Fragment, [
          div({ style: { marginBottom: '1rem' } }, [
            'Choose a Terra pre-installed runtime environment (e.g. programming languages + packages) or choose a custom environment'
          ]),
          h(SimpleTabBar, {
            tabs: [{ title: 'PRE-INSTALLED ENVIRONMENT', key: false, width: 265 }, { title: 'CUSTOM ENVIRONMENT', key: true, width: 215 }],
            value: isCustomEnv,
            onChange: value => this.setState({ isCustomEnv: value })
          }),
          div({
            style: {
              display: 'grid', gridTemplateColumns: '7rem 2fr 1fr', gridGap: '1rem', alignItems: 'center', margin: '1.5rem 0 1rem', minHeight: 100
            }
          }, [
            isCustomEnv ?
              h(Fragment, [
                h(IdContainer, [
                  id => h(Fragment, [
                    label({ htmlFor: id, style: { ...styles.label, lineHeight: '38px', alignSelf: 'start' } }, 'Image Path'),
                    div({ style: { gridColumnEnd: 'span 2', alignSelf: 'start', height: '45px' } }, [
                      h(ValidatedInput, {
                        inputProps: {
                          id,
                          placeholder: 'Example: us.gcr.io/broad-dsp-gcr-public/terra-jupyter-base:0.0.1',
                          value: customEnvImage,
                          onChange: customEnvImage => this.setState({ customEnvImage })
                        },
                        error: customEnvImage && isCustomImageInvalid && 'Not a valid image'
                      })
                    ])
                  ])
                ]),
                div({ style: { gridColumnStart: 2, gridColumnEnd: 'span 2', alignSelf: 'start' } }, [
                  h(Link, { href: imageInstructions, ...Utils.newTabLinkProps }, ['Learn how']),
                  ' to create your own custom docker image from one of our ',
                  h(Link, { href: terraImageRepo, ...Utils.newTabLinkProps }, ['Terra base images.'])
                ])
              ]) :
              h(Fragment, [
                h(IdContainer, [
                  id => h(Fragment, [
                    label({ htmlFor: id, style: styles.label }, 'Environment'),
                    div({ style: { gridColumnEnd: 'span 2' } }, [
                      makeEnvSelect(id)
                    ])
                  ])
                ]),
                div({ style: { gridColumnStart: 2, alignSelf: 'start' } }, [
                  h(Link, { onClick: () => this.setState({ viewingPackages: true }) }, ['What’s installed on this environment?'])
                ]),
                makeImageInfo()
              ])
          ]),
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
            div({ style: { display: 'flex' } }, [
              'Updating a Notebook Runtime environment will delete all existing non-notebook files and ',
              'installed packages. You will be unable to work on the notebooks in this workspace while it ',
              'updates, which can take a few minutes.'
            ])
          ]),
          div({ style: { flexGrow: 1 } }),
          div({ style: { display: 'flex', justifyContent: 'flex-end' } }, [
            h(ButtonSecondary, {
              style: { marginTop: '1rem', marginRight: '2rem' },
              onClick: onDismiss
            }, 'Cancel'),
            h(ButtonPrimary, {
              disabled: isCustomEnv && isCustomImageInvalid,
              tooltip: isCustomEnv && isCustomImageInvalid && 'Enter a valid docker image to use',
              style: { marginTop: '1rem' },
              onClick: () => isCustomEnv ? this.setState({ showingCustomWarning: true }) : this.createCluster()
            }, !!currentCluster ? 'Replace' : 'Create')
          ])
        ])
      })
    )

    return h(Fragment, [
      h(TitleBar, {
        title: viewingPackages ? 'INSTALLED PACKAGES' : 'RUNTIME CONFIGURATION',
        onDismiss,
        onPrevious
      }),
      div({ style: { padding: '0 1.5rem 1.5rem 1.5rem', flexGrow: 1, display: 'flex', flexDirection: 'column' } }, [contents])
    ])
  }
})
