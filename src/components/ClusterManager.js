import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Fragment, PureComponent, useState } from 'react'
import { div, h, iframe, label, p, span } from 'react-hyperscript-helpers'
import { ButtonPrimary, ButtonSecondary, Clickable, IdContainer, LabeledCheckbox, Link, Select, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { NumberInput, TextInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { withModalDrawer } from 'src/components/ModalDrawer'
import { notify } from 'src/components/Notifications.js'
import { Popup } from 'src/components/PopupTrigger'
import TitleBar from 'src/components/TitleBar'
import { machineTypes, profiles } from 'src/data/clusters'
import leoImages from 'src/data/leo-images'
import { Ajax, ajaxCaller } from 'src/libs/ajax'
import { clusterCost, currentCluster, machineConfigCost, normalizeMachineConfig, trimClustersOldestFirst } from 'src/libs/cluster-utils'
import colors from 'src/libs/colors'
import { reportError, withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { errorNotifiedClusters, outdatedNotifiedClusters } from 'src/libs/state.js'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const noCompute = 'You do not have access to run analyses on this workspace.'

const styles = {
  verticalCenter: { display: 'flex', alignItems: 'center' },
  container: {
    height: '3rem',
    display: 'flex', alignItems: 'center', flex: 'none',
    marginLeft: 'auto', paddingLeft: '1rem', paddingRight: '1rem',
    borderTopLeftRadius: 5, borderBottomLeftRadius: 5,
    backgroundColor: colors.light()
  },
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
  },
  divider: {
    marginTop: '1rem',
    marginLeft: '-1.25rem',
    marginRight: '-1.25rem',
    borderBottom: `1px solid ${colors.dark(0.1)}`
  },
  button: isDisabled => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: isDisabled ? 'not-allowed' : 'pointer'
  })
}

const machineConfigsEqual = (a, b) => {
  return _.isEqual(normalizeMachineConfig(a), normalizeMachineConfig(b))
}

const MachineSelector = ({ machineType, onChangeMachineType, diskSize, onChangeDiskSize, readOnly }) => {
  const { cpu: currentCpu, memory: currentMemory } = _.find({ name: machineType }, machineTypes)
  return h(Fragment, [
    h(IdContainer, [id => h(Fragment, [
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
    ])]),
    h(IdContainer, [id => h(Fragment, [
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
    ])]),
    h(IdContainer, [id => h(Fragment, [
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
    ])])
  ])
}

const ClusterIcon = ({ shape, onClick, disabled, style, ...props }) => {
  return h(Clickable, {
    style: { color: onClick && !disabled ? colors.accent() : colors.dark(0.7), ...styles.verticalCenter, ...style },
    onClick, disabled, ...props
  }, [icon(shape, { size: 20 })])
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
    const { jupyterUserScriptUri, selectedLeoImage } = this.state
    onSuccess(Promise.all([
      Ajax().Jupyter.cluster(namespace, Utils.generateClusterName()).create({
        machineConfig: this.getMachineConfig(),
        jupyterDockerImage: selectedLeoImage,
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
      viewingPackages
    } = this.state
    const { version, updated, packages } = _.find({ image: selectedLeoImage }, leoImages)

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

    return h(Fragment, [
      h(TitleBar, {
        title: viewingPackages ? 'INSTALLED PACKAGES' : 'RUNTIME CONFIGURATION',
        onDismiss,
        onPrevious: viewingPackages ? () => this.setState({ viewingPackages: false }) : undefined
      }),
      div({ style: { padding: '0 1.5rem 1.5rem 1.5rem', flexGrow: 1, display: 'flex', flexDirection: 'column' } }, [
        viewingPackages ? h(Fragment, [
          makeEnvSelect(),
          makeImageInfo({ margin: '1rem 0 2rem' }),
          h(ImageDepViewer, { packages })
        ]) : h(Fragment, [
          div({ style: { marginBottom: '1rem' } }, [
            'Choose a Terra pre-installed runtime environment (e.g. programming languages + packages)' // TODO: once there's custom, add the text ' or choose a custom environment'
          ]),
          div({ style: { display: 'grid', gridTemplateColumns: '7rem 2fr 1fr', gridGap: '1rem', alignItems: 'center' } }, [
            h(IdContainer, [id => h(Fragment, [
              label({ htmlFor: id, style: styles.label }, 'Environment'),
              div({ style: { gridColumnEnd: 'span 2' } }, [
                makeEnvSelect(id)
              ])
            ])]),
            div({ style: { gridColumnStart: 2, alignSelf: 'start' } }, [
              h(Link, { onClick: () => this.setState({ viewingPackages: true }) }, ['What’s installed on this environment?'])
            ]),
            makeImageInfo()
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
              h(IdContainer, [id => h(Fragment, [
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
              ])]),
              h(MachineSelector, {
                machineType: masterMachineType,
                onChangeMachineType: v => this.setState({ masterMachineType: v }),
                diskSize: masterDiskSize,
                onChangeDiskSize: v => this.setState({ masterDiskSize: v }),
                readOnly: profile !== 'custom'
              }),
              profile === 'custom' && h(Fragment, [
                h(IdContainer, [id => h(Fragment, [
                  label({ htmlFor: id, style: styles.label }, 'Startup\nscript'),
                  div({ style: { gridColumnEnd: 'span 5' } }, [
                    h(TextInput, {
                      id,
                      placeholder: 'URI',
                      value: jupyterUserScriptUri,
                      onChange: v => this.setState({ jupyterUserScriptUri: v })
                    })
                  ])
                ])]),
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
                  h(IdContainer, [id => h(Fragment, [
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
                  ])]),
                  h(IdContainer, [id => h(Fragment, [
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
                  ])]),
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
            div({}, [
              'Deleting your runtime will stop all running notebooks, and delete any files on the associated hard disk (e.g. input data or analysis outputs) and installed packages. To permanently save these files, ',
              h(Link, {
                href: 'https://support.terra.bio/hc/en-us/articles/360026639112',
                ...Utils.newTabLinkProps
              }, ['move them to the workspace bucket.']),
              p(['You will be unable to work on the notebooks in this workspace while it updates, which can take a few minutes.'])
            ])
          ]),
          div({ style: { flexGrow: 1 } }),
          div({ style: { display: 'flex', justifyContent: 'flex-end' } }, [
            h(ButtonSecondary, {
              style: { marginTop: '1rem', marginRight: '2rem' },
              onClick: onDismiss
            }, 'Cancel'),
            h(ButtonPrimary, {
              style: { marginTop: '1rem' },
              onClick: () => this.createCluster()
            }, !!currentCluster ? 'Replace' : 'Create')
          ])
        ])
      ])
    ])
  }
})

export const ClusterErrorModal = ({ cluster, onDismiss }) => {
  const [error, setError] = useState()
  const [userscriptError, setUserscriptError] = useState(false)
  const [loadingClusterDetails, setLoadingClusterDetails] = useState(false)

  const loadClusterError = _.flow(
    withErrorReporting('Error loading notebook runtime details'),
    Utils.withBusyState(setLoadingClusterDetails)
  )(async () => {
    const { errors: clusterErrors } = await Ajax().Jupyter.cluster(cluster.googleProject, cluster.clusterName).details()
    if (_.some(({ errorMessage }) => errorMessage.includes('Userscript failed'), clusterErrors)) {
      setError(
        await Ajax().Buckets.getObjectPreview(cluster.stagingBucket, `userscript_output.txt`, cluster.googleProject, true).then(res => res.text()))
      setUserscriptError(true)
    } else {
      setError(clusterErrors[0].errorMessage)
    }
  })

  Utils.useOnMount(() => { loadClusterError() })

  return h(Modal, {
    title: userscriptError ? 'Notebook Runtime Creation Failed due to Userscript Error' : 'Notebook Runtime Creation Failed',
    showCancel: false,
    onDismiss
  }, [
    div({ style: { whiteSpace: 'pre-wrap', overflowWrap: 'break-word', overflowY: 'auto', maxHeight: 500, background: colors.light() } }, [error]),
    loadingClusterDetails && spinnerOverlay
  ])
}

export const DeleteClusterModal = ({ cluster: { googleProject, clusterName }, onDismiss, onSuccess }) => {
  const [deleting, setDeleting] = useState()
  const deleteCluster = _.flow(
    Utils.withBusyState(setDeleting),
    withErrorReporting('Error deleting notebook runtime')
  )(async () => {
    await Ajax().Jupyter.cluster(googleProject, clusterName).delete()
    onSuccess()
  })
  return h(Modal, {
    title: 'Delete notebook runtime?',
    onDismiss,
    okButton: deleteCluster
  }, [
    p(['Deleting the notebook runtime will stop all running notebooks and associated costs. You can recreate it later, which will take several minutes.']),
    span({ style: { fontWeight: 'bold' } }, 'NOTE: '),
    'Deleting your runtime will also delete any installed packaged and files on the associated hard disk (e.g. input data or analysis outputs). To permanently save these files, ',
    h(Link, {
      href: 'https://support.terra.bio/hc/en-us/articles/360026639112',
      ...Utils.newTabLinkProps
    }, ['move them to the workspace bucket.']),
    deleting && spinnerOverlay
  ])
}

const ClusterErrorNotification = ({ cluster }) => {
  const [modalOpen, setModalOpen] = useState(false)

  return h(Fragment, [
    h(Clickable, {
      onClick: () => setModalOpen(true),
      style: {
        marginTop: '1rem',
        textDecoration: 'underline',
        fontWeight: 'bold'
      }
    }, ['SEE LOG INFO']),
    modalOpen && h(ClusterErrorModal, {
      cluster,
      onDismiss: () => setModalOpen(false)
    })
  ])
}

const ClusterOutdatedNotification = () => {
  return h(Fragment, [
    p(['Your notebook runtime is over two months old. Please consider deleting and recreating your runtime in order to access the latest features and security updates.'])
  ])
}

export default ajaxCaller(class ClusterManager extends PureComponent {
  static propTypes = {
    namespace: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    clusters: PropTypes.array,
    canCompute: PropTypes.bool.isRequired,
    refreshClusters: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props)
    this.state = {
      createModalDrawerOpen: false,
      busy: false,
      deleteModalOpen: false
    }
  }

  componentDidUpdate(prevProps) {
    const prevCluster = _.last(_.sortBy('createdDate', _.remove({ status: 'Deleting' }, prevProps.clusters))) || {}
    const cluster = this.getCurrentCluster() || {}
    const twoMonthsAgo = _.tap(d => d.setMonth(d.getMonth() - 2), new Date())
    const createdDate = new Date(cluster.createdDate)

    if (cluster.status === 'Error' && prevCluster.status !== 'Error' && !_.includes(cluster.id, errorNotifiedClusters.get())) {
      notify('error', 'Error Creating Notebook Runtime', {
        message: h(ClusterErrorNotification, { cluster })
      })
      errorNotifiedClusters.update(Utils.append(cluster.id))
    } else if (createdDate < twoMonthsAgo && !_.includes(cluster.id, outdatedNotifiedClusters.get())) {
      notify('warn', 'Outdated Notebook Runtime', {
        message: h(ClusterOutdatedNotification, {})
      })
      outdatedNotifiedClusters.update(Utils.append(cluster.id))
    }
  }

  getActiveClustersOldestFirst() {
    const { clusters } = this.props
    return trimClustersOldestFirst(clusters)
  }

  getCurrentCluster() {
    const { clusters } = this.props
    return currentCluster(clusters)
  }

  async executeAndRefresh(promise) {
    try {
      const { refreshClusters } = this.props
      this.setState({ busy: true })
      await promise
      await refreshClusters()
    } catch (error) {
      reportError('Notebook Runtime Error', error)
    } finally {
      this.setState({ busy: false })
    }
  }

  createDefaultCluster() {
    const { ajax: { Jupyter }, namespace } = this.props
    this.executeAndRefresh(
      Jupyter.cluster(namespace, Utils.generateClusterName()).create({
        machineConfig: normalizeMachineConfig({})
      })
    )
  }

  destroyClusters(keepIndex) {
    const { ajax: { Jupyter } } = this.props
    const activeClusters = this.getActiveClustersOldestFirst()
    this.executeAndRefresh(
      Promise.all(_.map(
        ({ googleProject, clusterName }) => Jupyter.cluster(googleProject, clusterName).delete(),
        _.without([_.nth(keepIndex, activeClusters)], activeClusters)
      ))
    )
  }

  startCluster() {
    const { ajax: { Jupyter } } = this.props
    const { googleProject, clusterName } = this.getCurrentCluster()
    this.executeAndRefresh(
      Jupyter.cluster(googleProject, clusterName).start()
    )
  }

  stopCluster() {
    const { ajax: { Jupyter } } = this.props
    const { googleProject, clusterName } = this.getCurrentCluster()
    this.executeAndRefresh(
      Jupyter.cluster(googleProject, clusterName).stop()
    )
  }

  renderDestroyForm() {
    const { busy } = this.state
    return div({ style: { padding: '1rem', width: 300 } }, [
      div([
        'Your new runtime environment is ready to use.'
      ]),
      div({ style: styles.row }, [
        div({ style: { marginLeft: 'auto' } }, [
          busy && icon('loadingSpinner')
        ]),
        h(ButtonSecondary, {
          style: { marginLeft: '1rem', marginRight: '1rem' },
          disabled: busy,
          onClick: () => this.destroyClusters(-2)
        }, 'Discard'),
        h(ButtonPrimary, { disabled: busy, onClick: () => this.destroyClusters(-1) }, 'Apply')
      ])
    ])
  }

  render() {
    const { namespace, name, clusters, canCompute, refreshClusters } = this.props
    const { busy, createModalDrawerOpen, deleteModalOpen, errorModalOpen, pendingNav } = this.state
    if (!clusters) {
      return null
    }
    const currentCluster = this.getCurrentCluster()
    const currentStatus = currentCluster && currentCluster.status
    const renderIcon = () => {
      switch (currentStatus) {
        case 'Stopped':
          return h(ClusterIcon, {
            shape: 'play',
            onClick: () => this.startCluster(),
            disabled: busy || !canCompute,
            tooltip: canCompute ? 'Start notebook runtime' : noCompute,
            'aria-label': 'Start notebook runtime'
          })
        case 'Running':
          return h(ClusterIcon, {
            shape: 'pause',
            onClick: () => this.stopCluster(),
            disabled: busy || !canCompute,
            tooltip: canCompute ? 'Stop notebook runtime' : noCompute,
            'aria-label': 'Stop notebook runtime'
          })
        case 'Starting':
        case 'Stopping':
        case 'Creating':
          return h(ClusterIcon, {
            shape: 'sync',
            disabled: true,
            tooltip: 'Notebook runtime update in progress',
            'aria-label': 'Notebook runtime update in progress'
          })
        case 'Error':
          return h(ClusterIcon, {
            shape: 'warning-standard',
            style: { color: colors.danger(0.9) },
            onClick: () => this.setState({ errorModalOpen: true }),
            disabled: busy || !canCompute,
            tooltip: canCompute ? 'View error' : noCompute,
            'aria-label': 'View error'
          })
        default:
          return h(ClusterIcon, {
            shape: 'play',
            onClick: () => this.createDefaultCluster(),
            disabled: busy || !canCompute,
            tooltip: canCompute ? 'Create notebook runtime' : noCompute,
            'aria-label': 'Create notebook runtime'
          })
      }
    }
    const totalCost = _.sum(_.map(clusterCost, clusters))
    const activeClusters = this.getActiveClustersOldestFirst()
    const creating = _.some({ status: 'Creating' }, activeClusters)
    const multiple = !creating && activeClusters.length > 1 && currentStatus !== 'Error'
    const isDisabled = !canCompute || creating || multiple || busy

    return div({ style: styles.container }, [
      h(Link, {
        href: Nav.getLink('workspace-terminal-launch', { namespace, name }),
        tooltip: Utils.cond(
          [!canCompute, () => noCompute],
          [!currentCluster, () => 'Create a basic notebook runtime and open its terminal'],
          () => 'Open terminal'
        ),
        'aria-label': 'Open terminal',
        disabled: !canCompute,
        style: { marginRight: '2rem', ...styles.verticalCenter },
        ...Utils.newTabLinkProps
      }, [icon('terminal', { size: 24 })]),
      renderIcon(),
      h(ClusterIcon, {
        shape: 'trash',
        onClick: () => this.setState({ deleteModalOpen: true }),
        disabled: busy || !canCompute || !_.includes(currentStatus, ['Stopped', 'Running', 'Error']),
        tooltip: 'Delete notebook runtime',
        'aria-label': 'Delete notebook runtime',
        style: { marginLeft: '0.5rem' }
      }),
      h(IdContainer, [id => h(Fragment, [
        h(Clickable, {
          id,
          style: styles.button(isDisabled),
          tooltip: Utils.cond(
            [!canCompute, () => noCompute],
            [creating, () => 'Your environment is being created'],
            [multiple, () => undefined],
            () => 'Update runtime'
          ),
          onClick: () => this.setState({ createModalDrawerOpen: true }),
          disabled: isDisabled
        }, [
          div({ style: { marginLeft: '0.5rem', paddingRight: '0.5rem', color: colors.dark() } }, [
            div({ style: { fontSize: 12, fontWeight: 'bold' } }, 'Notebook Runtime'),
            div({ style: { fontSize: 10 } }, [
              span({ style: { textTransform: 'uppercase', fontWeight: 500 } }, currentStatus || 'None'),
              ` (${Utils.formatUSD(totalCost)} hr)`
            ])
          ]),
          icon('cog', { size: 22, style: { color: isDisabled ? colors.dark(0.7) : colors.accent() } })
        ]),
        multiple && h(Popup, { side: 'bottom', target: id, handleClickOutside: _.noop }, [this.renderDestroyForm()])
      ])]),
      deleteModalOpen && h(DeleteClusterModal, {
        cluster: this.getCurrentCluster(),
        onDismiss: () => this.setState({ deleteModalOpen: false }),
        onSuccess: () => {
          this.setState({ deleteModalOpen: false })
          refreshClusters()
        }
      }),
      h(NewClusterModal, {
        isOpen: createModalDrawerOpen,
        namespace,
        currentCluster,
        onDismiss: () => this.setState({ createModalDrawerOpen: false }),
        onSuccess: promise => {
          this.setState({ createModalDrawerOpen: false })
          this.executeAndRefresh(promise)
        }
      }),
      errorModalOpen && h(ClusterErrorModal, {
        cluster: currentCluster,
        onDismiss: () => this.setState({ errorModalOpen: false })
      }),
      pendingNav && spinnerOverlay
    ])
  }
})
