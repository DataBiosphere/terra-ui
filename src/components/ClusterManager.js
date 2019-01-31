import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { Fragment, PureComponent } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import { buttonPrimary, buttonSecondary, Clickable, LabeledCheckbox, Select } from 'src/components/common'
import { icon } from 'src/components/icons'
import { IntegerInput, textInput } from 'src/components/input'
import Modal from 'src/components/Modal'
import PopupTrigger from 'src/components/PopupTrigger'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { machineTypes, profiles, storagePrice } from 'src/data/clusters'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'


const noCompute = 'You do not have access to run analyses on this workspace.'

const styles = {
  container: {
    height: '3rem',
    display: 'flex', alignItems: 'center', flex: 'none',
    marginLeft: 'auto', paddingLeft: '1rem', paddingRight: '1rem',
    borderTopLeftRadius: 5, borderBottomLeftRadius: 5,
    backgroundColor: colors.gray[5]
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
    backgroundColor: colors.orange[5],
    color: colors.orange[0],
    borderTop: `1px solid ${colors.orange[0]}`,
    borderBottom: `1px solid ${colors.orange[0]}`,
    padding: '1rem',
    marginTop: '1rem',
    marginLeft: '-1rem',
    marginRight: '-1rem'
  },
  divider: {
    marginTop: '1rem',
    marginLeft: '-1rem',
    marginRight: '-1rem',
    borderBottom: `1px solid ${colors.gray[3]}`
  },
  button: isDisabled => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: isDisabled ? 'not-allowed' : 'pointer'
  })
}

const machineTypesByName = _.keyBy('name', machineTypes)

const profilesByName = _.keyBy('name', profiles)

const machineStorageCost = config => {
  const { masterDiskSize, numberOfWorkers, workerDiskSize } = Utils.normalizeMachineConfig(config)
  return (masterDiskSize + numberOfWorkers * workerDiskSize) * storagePrice
}

const machineConfigCost = config => {
  const { masterMachineType, numberOfWorkers, numberOfPreemptibleWorkers, workerMachineType } = Utils.normalizeMachineConfig(config)
  return _.sum([
    machineTypesByName[masterMachineType].price,
    (numberOfWorkers - numberOfPreemptibleWorkers) * machineTypesByName[workerMachineType].price,
    numberOfPreemptibleWorkers * machineTypesByName[workerMachineType].preemptiblePrice,
    machineStorageCost(config)
  ])
}

const machineConfigsEqual = (a, b) => {
  return _.isEqual(Utils.normalizeMachineConfig(a), Utils.normalizeMachineConfig(b))
}

const MachineSelector = ({ machineType, onChangeMachineType, diskSize, onChangeDiskSize, readOnly }) => {
  const { cpu: currentCpu, memory: currentMemory } = machineTypesByName[machineType]
  return div([
    div({ style: styles.row }, [
      div({ style: { ...styles.col1, ...styles.label } }, 'CPUs'),
      div({ style: styles.col2 }, [
        readOnly ?
          currentCpu :
          h(Select, {
            styles: { container: styles.smallSelect },
            isSearchable: false,
            value: currentCpu,
            onChange: ({ value }) => onChangeMachineType(_.find({ cpu: value }, machineTypes).name),
            options: _.uniq(_.map('cpu', machineTypes))
          })
      ]),
      div({ style: { ...styles.col3, ...styles.label } }, 'Disk size'),
      div([
        readOnly ?
          diskSize :
          h(IntegerInput, {
            style: styles.smallInput,
            min: 100,
            max: 64000,
            value: diskSize,
            onChange: onChangeDiskSize
          }),
        ' GB'
      ])
    ]),
    div({ style: styles.row }, [
      div({ style: { ...styles.col1, ...styles.label } }, 'Memory'),
      div({ style: styles.col2 }, [
        readOnly ?
          currentMemory :
          h(Select, {
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
    ])
  ])
}

const ClusterIcon = ({ shape, onClick, disabled, style, ...props }) => {
  return h(Clickable, {
    style: { color: onClick && !disabled ? colors.blue[0] : colors.gray[2], ...style },
    onClick, disabled, ...props
  }, [icon(shape, { size: 20, className: 'is-solid' })])
}

const MiniLink = ({ href, disabled, tooltip, children, ...props }) => {
  return h(TooltipTrigger, { content: tooltip }, [
    h(Interactive, _.merge({
      as: 'a',
      href: !disabled ? href : undefined,
      style: {
        color: !disabled ? colors.blue[0] : colors.gray[2], backgroundColor: colors.gray[5],
        cursor: disabled ? 'not-allowed' : 'pointer',
        borderRadius: 4
      }
    }, props), [children])
  ])
}

const getUpdateIntervalMs = status => {
  switch (status) {
    case 'Starting':
      return 5000
    case 'Creating':
    case 'Stopping':
      return 15000
    default:
      return 120000
  }
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
      open: false,
      busy: false,
      deleting: false,
      profile: 'moderate',
      masterMachineType: 'n1-standard-4',
      masterDiskSize: 500,
      jupyterUserScriptUri: '',
      numberOfWorkers: 0,
      numberOfPreemptibleWorkers: 0,
      workerDiskSize: 500,
      workerMachineType: 'n1-standard-4'
    }
  }

  refreshClusters = async () => {
    this.props.refreshClusters().then(() => this.resetUpdateInterval())
  }

  resetUpdateInterval() {
    const currentCluster = this.getCurrentCluster()

    clearInterval(this.interval)
    this.interval = setInterval(this.refreshClusters, getUpdateIntervalMs(currentCluster && currentCluster.status))
  }

  componentDidMount() {
    this.resetUpdateInterval()
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  getActiveClustersOldestFirst() {
    const { clusters } = this.props
    return _.sortBy('createdDate', _.remove({ status: 'Deleting' }, clusters))
  }

  getCurrentCluster() {
    return _.last(this.getActiveClustersOldestFirst())
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

  async executeAndRefresh(promise) {
    try {
      this.setState({ busy: true })
      await promise
      await this.refreshClusters()
    } catch (error) {
      reportError('Cluster Error', error)
    } finally {
      this.setState({ busy: false })
    }
  }

  createCluster() {
    const { ajax: { Jupyter }, namespace } = this.props
    const { jupyterUserScriptUri } = this.state
    this.executeAndRefresh(
      Jupyter.cluster(namespace, Utils.generateClusterName()).create({
        machineConfig: this.getMachineConfig(),
        ...(jupyterUserScriptUri ? { jupyterUserScriptUri } : {})
      }).then(() => {
        this.setState({ open: false })
      })
    )
  }

  createDefaultCluster() {
    const { ajax: { Jupyter }, namespace } = this.props
    this.executeAndRefresh(
      Jupyter.cluster(namespace, Utils.generateClusterName()).create({
        machineConfig: Utils.normalizeMachineConfig({})
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

  destroyActiveCluster() {
    const { ajax: { Jupyter } } = this.props
    const { googleProject, clusterName } = this.getCurrentCluster()
    this.executeAndRefresh(
      Jupyter.cluster(googleProject, clusterName).delete()
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

  toggleDropdown(v) {
    const currentCluster = this.getCurrentCluster()
    const currentConfig = currentCluster ? currentCluster.machineConfig : profiles[0].machineConfig
    const matchingProfile = _.find(
      ({ machineConfig }) => machineConfigsEqual(machineConfig, currentConfig),
      profiles
    )
    this.setState({
      open: v,
      ...Utils.normalizeMachineConfig(currentConfig),
      jupyterUserScriptUri: '',
      profile: matchingProfile ? matchingProfile.name : 'custom'
    })
  }

  renderCreateForm() {
    const { busy, profile, masterMachineType, masterDiskSize, workerMachineType, numberOfWorkers, numberOfPreemptibleWorkers, workerDiskSize, jupyterUserScriptUri } = this.state
    const currentCluster = this.getCurrentCluster()
    const changed = !currentCluster ||
      currentCluster.status === 'Error' ||
      !machineConfigsEqual(this.getMachineConfig(), currentCluster.machineConfig) ||
      jupyterUserScriptUri
    return div({ style: { padding: '1rem', width: 450 } }, [
      div({ style: { fontSize: 16, fontWeight: 'bold' } }, 'Runtime environment'),
      div({ style: styles.row }, [
        div({ style: { ...styles.col1, ...styles.label } }, 'Profile'),
        div({ style: { flex: 1 } }, [
          h(Select, {
            value: profile,
            onChange: ({ value }) => {
              this.setState({
                profile: value,
                ...(value === 'custom' ? {} : Utils.normalizeMachineConfig(profilesByName[value].machineConfig))
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
      ]),
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
        div({ style: styles.row }, [
          div({ style: { ...styles.col1, ...styles.label } }, 'Startup script'),
          div({ style: { flex: 1 } }, [
            textInput({
              placeholder: 'URI',
              value: jupyterUserScriptUri,
              onChange: e => this.setState({ jupyterUserScriptUri: e.target.value })
            })
          ])
        ]),
        div({ style: styles.row }, [
          div({ style: styles.col1 }),
          div([
            h(LabeledCheckbox, {
              checked: numberOfWorkers,
              onChange: v => this.setState({
                numberOfWorkers: v ? 2 : 0,
                numberOfPreemptibleWorkers: 0
              })
            }, ' Configure as Spark cluster')
          ])
        ]),
        !!numberOfWorkers && h(Fragment, [
          div({ style: styles.row }, [
            div({ style: { ...styles.col1, ...styles.label } }, 'Workers'),
            div({ style: styles.col2 }, [
              h(IntegerInput, {
                style: styles.smallInput,
                min: 2,
                value: numberOfWorkers,
                onChange: v => this.setState({
                  numberOfWorkers: v,
                  numberOfPreemptibleWorkers: _.min([numberOfPreemptibleWorkers, v])
                })
              })
            ]),
            div({ style: { ...styles.col3, ...styles.label } }, 'Preemptible'),
            div([
              h(IntegerInput, {
                style: styles.smallInput,
                min: 0,
                max: numberOfWorkers,
                value: numberOfPreemptibleWorkers,
                onChange: v => this.setState({ numberOfPreemptibleWorkers: v })
              })
            ])
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
        ]),
        div({ style: { marginLeft: 'auto' } }, [
          busy && icon('loadingSpinner')
        ]),
        buttonSecondary({
          style: { marginLeft: '1rem', marginRight: '1rem' },
          onClick: () => this.toggleDropdown(false)
        }, 'Cancel'),
        buttonPrimary({ disabled: busy || !changed, onClick: () => this.createCluster() }, currentCluster ? 'Update' : 'Create')
      ])
    ])
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
        buttonSecondary({
          style: { marginLeft: '1rem', marginRight: '1rem' },
          disabled: busy,
          onClick: () => this.destroyClusters(-2)
        }, 'Discard'),
        buttonPrimary({ disabled: busy, onClick: () => this.destroyClusters(-1) }, 'Apply')
      ])
    ])
  }

  renderCreatingMessage() {
    return div({ style: { padding: '1rem', width: 300 } }, [
      'Your environment is being created.'
    ])
  }

  render() {
    const { namespace, name, clusters, canCompute } = this.props
    const { busy, open, deleting } = this.state
    if (!clusters) {
      return null
    }
    const currentCluster = this.getCurrentCluster()
    const currentStatus = currentCluster && currentCluster.status
    const running = currentStatus === 'Running'
    const renderIcon = () => {
      switch (currentStatus) {
        case 'Stopped':
          return h(ClusterIcon, {
            shape: 'play',
            onClick: () => this.startCluster(),
            disabled: busy || !canCompute,
            tooltip: canCompute ? 'Start cluster' : noCompute
          })
        case 'Running':
          return h(ClusterIcon, {
            shape: 'pause',
            onClick: () => this.stopCluster(),
            disabled: busy || !canCompute,
            tooltip: canCompute ? 'Stop cluster' : noCompute
          })
        case 'Starting':
        case 'Stopping':
        case 'Creating':
          return h(ClusterIcon, { shape: 'sync' })
        case undefined:
          return h(ClusterIcon, {
            shape: 'play',
            onClick: () => this.createDefaultCluster(),
            disabled: busy || !canCompute,
            tooltip: canCompute ? 'Create cluster' : noCompute
          })
        default:
          return h(ClusterIcon, { shape: 'ban' })
      }
    }
    const totalCost = _.sum(_.map(({ machineConfig, status }) => {
      return (status === 'Stopped' ? machineStorageCost : machineConfigCost)(machineConfig)
    }, clusters))
    const isDisabled = !canCompute
    const activeClusters = this.getActiveClustersOldestFirst()
    const creating = _.some({ status: 'Creating' }, activeClusters)
    const multiple = !creating && activeClusters.length > 1
    return div({ style: styles.container }, [
      h(MiniLink, {
        href: Nav.getLink('workspace-terminal-launch', { namespace, name }),
        disabled: !running || !canCompute,
        tooltip: Utils.cond(
          [!canCompute, () => noCompute],
          [!running, () => 'Start runtime to open terminal'],
          () => 'Open terminal'
        ),
        style: { marginRight: '2rem' }
      }, [icon('terminal', { className: 'is-solid', size: 24 })]),
      renderIcon(),
      h(ClusterIcon, {
        shape: 'stop',
        onClick: () => this.setState({ deleting: true }),
        disabled: busy || !canCompute || !_.includes(currentStatus, ['Stopped', 'Running']),
        tooltip: 'Delete cluster',
        style: { marginLeft: '0.5rem' }
      }),
      h(PopupTrigger, {
        side: 'bottom',
        open: open || multiple,
        width: creating || multiple ? 300 : 450,
        onToggle: v => this.toggleDropdown(v),
        content: Utils.cond(
          [creating, () => this.renderCreatingMessage()],
          [multiple, () => this.renderDestroyForm()],
          () => this.renderCreateForm()
        )
      }, [
        h(Clickable, {
          style: { ...styles.button(isDisabled), color: isDisabled ? colors.gray[2] : (open ? colors.blue[1] : colors.blue[0]) },
          tooltip: !canCompute && noCompute,
          disabled: isDisabled
        }, [
          div({
            style: { marginLeft: '0.5rem', paddingRight: '0.5rem', color: colors.gray[0] }
          }, [
            div({ style: { fontSize: 12, fontWeight: 'bold' } }, 'Notebook Runtime'),
            div({ style: { fontSize: 10 } }, [
              span({ style: { textTransform: 'uppercase', fontWeight: 500 } }, currentStatus || 'None'),
              ` (${Utils.formatUSD(totalCost)} hr)`
            ])
          ]),
          icon('caretDown', { size: 18 })
        ])
      ]),
      deleting && h(Modal, {
        title: 'Delete notebook runtime?',
        onDismiss: () => this.setState({ deleting: false }),
        okButton: () => {
          this.setState({ deleting: false })
          this.destroyActiveCluster()
        }
      }, ['Deleting the machine will stop all associated costs. You can recreate it later, which will take several minutes.'])
    ])
  }
})
