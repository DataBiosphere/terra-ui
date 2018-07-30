import _ from 'lodash/fp'
import { Fragment, PureComponent } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import { buttonPrimary, buttonSecondary, Clickable, LabeledCheckbox, Select } from 'src/components/common'
import DropdownBox from 'src/components/DropdownBox'
import { icon } from 'src/components/icons'
import { IntegerInput, textInput } from 'src/components/input'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { machineTypes, profiles } from 'src/data/clusters'
import { Jupyter } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const noCompute = 'You do not have access to run analyses on this workspace.'

const styles = {
  container: {
    height: '3rem',
    display: 'flex', alignItems: 'center',
    marginLeft: 'auto', paddingLeft: '1rem', paddingRight: '1rem',
    borderTopLeftRadius: 5, borderBottomLeftRadius: 5,
    backgroundColor: Style.colors.background
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
    fontWeight: 500
  },
  smallInput: {
    width: 80
  },
  smallSelect: {
    width: 80,
    display: 'inline-block',
    verticalAlign: 'middle'
  },
  warningBox: {
    fontSize: 12,
    backgroundColor: '#fffceb',
    color: Style.colors.warning,
    borderTop: `1px solid ${Style.colors.warning}`,
    borderBottom: `1px solid ${Style.colors.warning}`,
    padding: '1rem',
    marginTop: '1rem',
    marginLeft: '-1rem',
    marginRight: '-1rem'
  },
  divider: {
    marginTop: '1rem',
    marginLeft: '-1rem',
    marginRight: '-1rem',
    borderBottom: `1px solid ${Style.colors.border}`
  }
}

const machineTypesByName = _.keyBy('name', machineTypes)

const profilesByName = _.keyBy('name', profiles)

const normalizeMachineConfig = ({ masterMachineType, masterDiskSize, numberOfWorkers, numberOfPreemptibleWorkers, workerMachineType, workerDiskSize }) => {
  return {
    masterMachineType: masterMachineType || 'n1-standard-4',
    masterDiskSize: masterDiskSize || 500,
    numberOfWorkers: numberOfWorkers || 0,
    numberOfPreemptibleWorkers: (numberOfWorkers && numberOfPreemptibleWorkers) || 0,
    workerMachineType: (numberOfWorkers && workerMachineType) || 'n1-standard-4',
    workerDiskSize: (numberOfWorkers && workerDiskSize) || 500
  }
}

const machineConfigCost = config => {
  const { masterMachineType, numberOfWorkers, numberOfPreemptibleWorkers, workerMachineType } = normalizeMachineConfig(config)
  return machineTypesByName[masterMachineType].price +
    (numberOfWorkers - numberOfPreemptibleWorkers) * machineTypesByName[workerMachineType].price +
    numberOfPreemptibleWorkers * machineTypesByName[workerMachineType].preemptiblePrice
}

const machineConfigsEqual = (a, b) => {
  return _.isEqual(normalizeMachineConfig(a), normalizeMachineConfig(b))
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
            wrapperStyle: styles.smallSelect,
            searchable: false,
            clearable: false,
            value: currentCpu,
            onChange: ({ value }) => onChangeMachineType(_.find({ cpu: value }, machineTypes).name),
            options: _.map(cpu => ({ label: cpu, value: cpu }), _.uniq(_.map('cpu', machineTypes)))
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
            wrapperStyle: styles.smallSelect,
            searchable: false,
            clearable: false,
            value: currentMemory,
            onChange: ({ value }) =>
              onChangeMachineType(_.find({ cpu: currentCpu, memory: value }, machineTypes).name),
            options: _.map(
              ({ memory }) => ({ label: memory, value: memory }),
              _.sortBy('memory', _.filter({ cpu: currentCpu }, machineTypes))
            )
          }),
        ' GB'
      ])
    ])
  ])
}

const ClusterIcon = ({ shape, onClick, disabled, ...props }) => {
  return h(Clickable, {
    style: { color: onClick && !disabled ? Style.colors.secondary : Style.colors.disabled },
    onClick, disabled, ...props
  }, [icon(shape, { size: 20, className: 'is-solid' })])
}

const MiniLink = ({ href, disabled, tooltip, children, ...props }) => {
  return h(TooltipTrigger, { content: tooltip }, [
    h(Interactive, _.merge({
      as: 'a',
      href: !disabled ? href : undefined,
      style: {
        color: 'white', backgroundColor: !disabled ? Style.colors.secondary : Style.colors.disabled,
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

export default class ClusterManager extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      open: false,
      busy: false,
      clusters: undefined,
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
    const { namespace } = this.props
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

  destroyClusters(keepIndex) {
    const activeClusters = this.getActiveClustersOldestFirst()
    this.executeAndRefresh(
      Promise.all(_.map(
        ({ googleProject, clusterName }) => Jupyter.cluster(googleProject, clusterName).delete(),
        _.without([_.nth(keepIndex, activeClusters)], activeClusters)
      ))
    )
  }

  startCluster() {
    const { googleProject, clusterName } = this.getCurrentCluster()
    this.executeAndRefresh(
      Jupyter.cluster(googleProject, clusterName).start()
    )
  }

  stopCluster() {
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
      ...normalizeMachineConfig(currentConfig),
      jupyterUserScriptUri: '',
      profile: matchingProfile ? matchingProfile.name : 'custom'
    })
  }

  renderCreateForm() {
    const { busy, profile, masterMachineType, masterDiskSize, workerMachineType, numberOfWorkers, numberOfPreemptibleWorkers, workerDiskSize, jupyterUserScriptUri } = this.state
    const currentCluster = this.getCurrentCluster()
    const changed = !currentCluster || !machineConfigsEqual(this.getMachineConfig(), currentCluster.machineConfig)
    return div({ style: { padding: '1rem' } }, [
      div({ style: { fontSize: 16, fontWeight: 500 } }, 'Runtime environment'),
      div({ style: styles.row }, [
        div({ style: { ...styles.col1, ...styles.label } }, 'Profile'),
        div({ style: { flex: 1 } }, [
          h(Select, {
            value: profile,
            onChange: ({ value }) => {
              this.setState({
                profile: value,
                ...(value === 'custom' ? {} : normalizeMachineConfig(profilesByName[value].machineConfig))
              })
            },
            searchable: false,
            clearable: false,
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
        buttonPrimary({ disabled: busy || !changed, onClick: () => this.createCluster() }, 'Update')
      ])
    ])
  }

  renderDestroyForm() {
    const { busy } = this.state
    return div({ style: { padding: '1rem' } }, [
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
    return div({ style: { padding: '1rem' } }, [
      'Your environment is being created.'
    ])
  }

  renderDropdown() {
    const { canCompute } = this.props
    const { open } = this.state
    const activeClusters = this.getActiveClustersOldestFirst()
    const creating = _.some({ status: 'Creating' }, activeClusters)
    const multiple = !creating && activeClusters.length > 1
    return h(DropdownBox, {
      disabled: !canCompute,
      tooltip: !canCompute && noCompute,
      open: open || multiple,
      onToggle: v => this.toggleDropdown(v),
      width: creating || multiple ? 300 : 450,
      outsideClickIgnoreClass: 'cluster-manager-opener'
    }, [
      Utils.cond(
        [creating, () => this.renderCreatingMessage()],
        [multiple, () => this.renderDestroyForm()],
        () => this.renderCreateForm()
      )
    ])
  }

  render() {
    const { namespace, name, clusters, canCompute } = this.props
    const { busy, open } = this.state
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
        default:
          return h(ClusterIcon, { shape: 'ban' })
      }
    }
    const totalCost = _.sum(_.map(
      ({ machineConfig }) => machineConfigCost(machineConfig),
      _.filter(({ status }) => status !== 'Stopped', clusters)
    ))
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
      }, [icon('code', { size: 18 })]),
      renderIcon(),
      h(Clickable, {
        disabled: !canCompute,
        tooltip: !canCompute && noCompute,
        onClick: () => this.toggleDropdown(!open),
        style: { marginLeft: '0.5rem', paddingRight: '0.25rem' },
        className: 'cluster-manager-opener'
      }, [
        div({ style: { fontSize: 12, fontWeight: 500 } }, 'Notebook Runtime'),
        div({ style: { fontSize: 10 } }, [
          span({ style: { textTransform: 'uppercase', fontWeight: 500 } }, currentStatus || 'None'),
          ` (${Utils.formatUSD(totalCost)} hr)`
        ])
      ]),
      this.renderDropdown()
    ])
  }
}
