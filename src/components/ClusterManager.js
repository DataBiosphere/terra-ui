import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Fragment, PureComponent, useState } from 'react'
import { div, h, label, span } from 'react-hyperscript-helpers'
import { ButtonPrimary, ButtonSecondary, Clickable, IdContainer, LabeledCheckbox, Link, Select, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { IntegerInput, TextInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import { notify } from 'src/components/Notifications.js'
import { Popup } from 'src/components/PopupTrigger'
import { machineTypes, profiles } from 'src/data/clusters'
import { Ajax, ajaxCaller } from 'src/libs/ajax'
import { clusterCost, currentCluster, machineConfigCost, normalizeMachineConfig, trimClustersOldestFirst } from 'src/libs/cluster-utils'
import colors from 'src/libs/colors'
import { reportError, withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { errorNotifiedClusters } from 'src/libs/state.js'
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
  col1: {
    width: 80
  },
  col2: {
    width: 120
  },
  col3: {
    width: 100
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  smallInput: {
    width: 80
  },
  smallSelect: base => ({
    ...base,
    width: 85,
    display: 'inline-block',
    verticalAlign: 'middle'
  }),
  warningBox: {
    fontSize: 12,
    backgroundColor: colors.warning(0.1),
    color: colors.warning(),
    borderTop: `1px solid ${colors.warning()}`,
    borderBottom: `1px solid ${colors.warning()}`,
    padding: '1rem',
    marginTop: '1rem',
    marginLeft: '-1.25rem',
    marginRight: '-1.25rem'
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
  return div([
    div({ style: styles.row }, [
      h(IdContainer, [id => h(Fragment, [
        label({ htmlFor: id, style: { ...styles.col1, ...styles.label } }, 'CPUs'),
        div({ style: styles.col2 }, [
          readOnly ?
            currentCpu :
            h(Select, {
              id,
              styles: { container: styles.smallSelect },
              isSearchable: false,
              value: currentCpu,
              onChange: ({ value }) => onChangeMachineType(_.find({ cpu: value }, machineTypes).name),
              options: _.uniq(_.map('cpu', machineTypes))
            })
        ])
      ])]),
      h(IdContainer, [id => h(Fragment, [
        label({ htmlFor: id, style: { ...styles.col3, ...styles.label } }, 'Disk size'),
        div([
          readOnly ?
            diskSize :
            h(IntegerInput, {
              id,
              style: styles.smallInput,
              min: 10,
              max: 64000,
              value: diskSize,
              onChange: onChangeDiskSize
            }),
          ' GB'
        ])
      ])])
    ]),
    h(IdContainer, [id => div({ style: styles.row }, [
      label({ htmlFor: id, style: { ...styles.col1, ...styles.label } }, 'Memory'),
      div({ style: styles.col2 }, [
        readOnly ?
          currentMemory :
          h(Select, {
            id,
            styles: { container: styles.smallSelect },
            isSearchable: false,
            value: currentMemory,
            onChange: ({ value }) => onChangeMachineType(_.find({ cpu: currentCpu, memory: value }, machineTypes).name),
            options: _.map(
              'memory',
              _.sortBy('memory', _.filter({ cpu: currentCpu }, machineTypes))
            )
          }),
        ' GB'
      ])
    ])])
  ])
}

const ClusterIcon = ({ shape, onClick, disabled, style, ...props }) => {
  return h(Clickable, {
    style: { color: onClick && !disabled ? colors.accent() : colors.dark(0.7), ...styles.verticalCenter, ...style },
    onClick, disabled, ...props
  }, [icon(shape, { size: 20 })])
}

export class NewClusterModal extends PureComponent {
  static propTypes = {
    currentCluster: PropTypes.object,
    namespace: PropTypes.string.isRequired,
    onCancel: PropTypes.func.isRequired,
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
    const { jupyterUserScriptUri } = this.state
    onSuccess(Promise.all([
      Ajax().Jupyter.cluster(namespace, Utils.generateClusterName()).create({
        machineConfig: this.getMachineConfig(),
        ...(jupyterUserScriptUri ? { jupyterUserScriptUri } : {})
      }),
      currentCluster && currentCluster.status === 'Error' && Ajax().Jupyter.cluster(currentCluster.googleProject, currentCluster.clusterName).delete()
    ]))
  }

  render() {
    const { currentCluster, onCancel } = this.props
    const { profile, masterMachineType, masterDiskSize, workerMachineType, numberOfWorkers, numberOfPreemptibleWorkers, workerDiskSize, jupyterUserScriptUri } = this.state
    const changed = !currentCluster ||
      currentCluster.status === 'Error' ||
      !machineConfigsEqual(this.getMachineConfig(), currentCluster.machineConfig) ||
      jupyterUserScriptUri
    return h(Modal, {
      title: 'Runtime environment',
      onDismiss: onCancel,
      okButton: h(ButtonPrimary, { disabled: !changed, onClick: () => this.createCluster() }, currentCluster ? 'Update' : 'Create')
    }, [
      h(IdContainer, [id => div({ style: styles.row }, [
        label({ htmlFor: id, style: { ...styles.col1, ...styles.label } }, 'Profile'),
        div({ style: { flex: 1 } }, [
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
              ..._.map(({ name, label, machineConfig }) => ({
                value: name,
                label: `${label} computer power (${Utils.formatUSD(machineConfigCost(machineConfig))} hr)`
              }), profiles),
              { value: 'custom', label: 'Custom' }
            ]
          })
        ])
      ])]),
      div([
        h(MachineSelector, {
          machineType: masterMachineType,
          onChangeMachineType: v => this.setState({ masterMachineType: v }),
          diskSize: masterDiskSize,
          onChangeDiskSize: v => this.setState({ masterDiskSize: v }),
          readOnly: profile !== 'custom'
        })
      ]),
      profile === 'custom' && h(Fragment, [
        h(IdContainer, [id => div({ style: styles.row }, [
          label({ htmlFor: id, style: { ...styles.col1, ...styles.label } }, 'Startup script'),
          div({ style: { flex: 1 } }, [
            h(TextInput, {
              id,
              placeholder: 'URI',
              value: jupyterUserScriptUri,
              onChange: v => this.setState({ jupyterUserScriptUri: v })
            })
          ])
        ])]),
        div({ style: styles.row }, [
          div({ style: styles.col1 }),
          div([
            h(LabeledCheckbox, {
              checked: !!numberOfWorkers,
              onChange: v => this.setState({
                numberOfWorkers: v ? 2 : 0,
                numberOfPreemptibleWorkers: 0
              })
            }, ' Configure as Spark cluster')
          ])
        ]),
        !!numberOfWorkers && h(Fragment, [
          div({ style: styles.row }, [
            h(IdContainer, [id => h(Fragment, [
              label({ htmlFor: id, style: { ...styles.col1, ...styles.label } }, 'Workers'),
              div({ style: styles.col2 }, [
                h(IntegerInput, {
                  id,
                  style: styles.smallInput,
                  min: 2,
                  value: numberOfWorkers,
                  onChange: v => this.setState({
                    numberOfWorkers: v,
                    numberOfPreemptibleWorkers: _.min([numberOfPreemptibleWorkers, v])
                  })
                })
              ])
            ])]),
            h(IdContainer, [id => h(Fragment, [
              label({ htmlFor: id, style: { ...styles.col3, ...styles.label } }, 'Preemptible'),
              div([
                h(IntegerInput, {
                  id,
                  style: styles.smallInput,
                  min: 0,
                  max: numberOfWorkers,
                  value: numberOfPreemptibleWorkers,
                  onChange: v => this.setState({ numberOfPreemptibleWorkers: v })
                })
              ])
            ])])
          ]),
          div({ style: { marginTop: '1rem' } }, [
            h(MachineSelector, {
              machineType: workerMachineType,
              onChangeMachineType: v => this.setState({ workerMachineType: v }),
              diskSize: workerDiskSize,
              onChangeDiskSize: v => this.setState({ workerDiskSize: v })
            })
          ])
        ])
      ]),
      changed ?
        div({ style: styles.warningBox }, [
          'Updated environments take a few minutes to prepare. ',
          'You will be notified when it is ready and can continue working as it builds.'
        ]) :
        div({ style: styles.divider }),
      div({ style: styles.row }, [
        div({ style: styles.label }, [
          `Cost: ${Utils.formatUSD(machineConfigCost(this.getMachineConfig()))} per hour`
        ])
      ])
    ])
  }
}

export const ClusterErrorModal = ({ cluster, onDismiss }) => {
  const [error, setError] = useState()
  const [userscriptError, setUserscriptError] = useState(false)
  const [loadingClusterDetails, setLoadingClusterDetails] = useState(false)

  const loadClusterError = _.flow(
    withErrorReporting('Error loading cluster details'),
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
    title: userscriptError ? 'Cluster Creation Failed due to Userscript Error' : 'Cluster Creation Failed',
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
    withErrorReporting('Error deleting cluster')
  )(async () => {
    await Ajax().Jupyter.cluster(googleProject, clusterName).delete()
    onSuccess()
  })
  return h(Modal, {
    title: 'Delete notebook runtime?',
    onDismiss,
    okButton: deleteCluster
  }, [
    'Deleting the notebook runtime will stop all running notebooks and associated costs. You can recreate it later, which will take several minutes.',
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
      createModalOpen: false,
      busy: false,
      deleteModalOpen: false
    }
  }

  componentDidUpdate(prevProps) {
    const prevCluster = _.last(_.sortBy('createdDate', _.remove({ status: 'Deleting' }, prevProps.clusters))) || {}
    const cluster = this.getCurrentCluster() || {}

    if (cluster.status === 'Error' && prevCluster.status !== 'Error' && !_.includes(cluster.id, errorNotifiedClusters.get())) {
      notify('error', 'Error Creating Cluster', {
        message: h(ClusterErrorNotification, { cluster })
      })
      errorNotifiedClusters.update(Utils.append(cluster.id))
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
      reportError('Cluster Error', error)
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
    const { busy, createModalOpen, deleteModalOpen, errorModalOpen, pendingNav } = this.state
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
            tooltip: canCompute ? 'Start cluster' : noCompute,
            'aria-label': 'Start cluster'
          })
        case 'Running':
          return h(ClusterIcon, {
            shape: 'pause',
            onClick: () => this.stopCluster(),
            disabled: busy || !canCompute,
            tooltip: canCompute ? 'Stop cluster' : noCompute,
            'aria-label': 'Stop cluster'
          })
        case 'Starting':
        case 'Stopping':
        case 'Creating':
          return h(ClusterIcon, {
            shape: 'sync',
            disabled: true,
            tooltip: 'Cluster update in progress',
            'aria-label': 'Cluster update in progress'
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
            tooltip: canCompute ? 'Create cluster' : noCompute,
            'aria-label': 'Create cluster'
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
          [!currentCluster, () => 'Create a basic cluster and open its terminal'],
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
        tooltip: 'Delete cluster',
        'aria-label': 'Delete cluster',
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
          onClick: () => this.setState({ createModalOpen: true }),
          disabled: isDisabled
        }, [
          div({
            style: { marginLeft: '0.5rem', paddingRight: '0.5rem', color: colors.dark() }
          }, [
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
      createModalOpen && h(NewClusterModal, {
        namespace, currentCluster,
        onCancel: () => this.setState({ createModalOpen: false }),
        onSuccess: promise => {
          this.setState({ createModalOpen: false })
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
