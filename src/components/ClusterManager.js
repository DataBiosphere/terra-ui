import _ from 'lodash/fp'
import { Component, Fragment } from 'react'
import { div, h, span } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import { buttonPrimary, buttonSecondary, LabeledCheckbox } from 'src/components/common'
import DropdownBox from 'src/components/DropdownBox'
import { icon } from 'src/components/icons'
import { IntegerInput, textInput } from 'src/components/input'
import { Leo } from 'src/libs/ajax'
import { getBasicProfile } from 'src/libs/auth'
import { reportError } from 'src/libs/error'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Select } from 'src/libs/wrapped-components'


const styles = {
  container: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginRight: '1rem'
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

const machineTypes = [
  { name: 'n1-standard-1', cpu: 1, memory: 3.75, price: 0.0475, preemptiblePrice: 0.0100 },
  { name: 'n1-standard-2', cpu: 2, memory: 7.50, price: 0.0950, preemptiblePrice: 0.0200 },
  { name: 'n1-standard-4', cpu: 4, memory: 15, price: 0.1900, preemptiblePrice: 0.0400 },
  { name: 'n1-standard-8', cpu: 8, memory: 30, price: 0.3800, preemptiblePrice: 0.0800 },
  { name: 'n1-standard-16', cpu: 16, memory: 60, price: 0.7600, preemptiblePrice: 0.1600 },
  { name: 'n1-standard-32', cpu: 32, memory: 120, price: 1.5200, preemptiblePrice: 0.3200 },
  { name: 'n1-standard-64', cpu: 64, memory: 240, price: 3.0400, preemptiblePrice: 0.6400 },
  { name: 'n1-standard-96', cpu: 96, memory: 360, price: 4.5600, preemptiblePrice: 0.9600 },
  { name: 'n1-highmem-2', cpu: 2, memory: 13, price: 0.1184, preemptiblePrice: 0.0250 },
  { name: 'n1-highmem-4', cpu: 4, memory: 26, price: 0.2368, preemptiblePrice: 0.0500 },
  { name: 'n1-highmem-8', cpu: 8, memory: 52, price: 0.4736, preemptiblePrice: 0.1000 },
  { name: 'n1-highmem-16', cpu: 16, memory: 104, price: 0.9472, preemptiblePrice: 0.2000 },
  { name: 'n1-highmem-32', cpu: 32, memory: 208, price: 1.8944, preemptiblePrice: 0.4000 },
  { name: 'n1-highmem-64', cpu: 64, memory: 416, price: 3.7888, preemptiblePrice: 0.8000 },
  { name: 'n1-highmem-96', cpu: 96, memory: 624, price: 5.6832, preemptiblePrice: 1.2000 },
  { name: 'n1-highcpu-2', cpu: 2, memory: 1.8, price: 0.0709, preemptiblePrice: 0.0150 },
  { name: 'n1-highcpu-4', cpu: 4, memory: 3.6, price: 0.1418, preemptiblePrice: 0.0300 },
  { name: 'n1-highcpu-8', cpu: 8, memory: 7.2, price: 0.2836, preemptiblePrice: 0.0600 },
  { name: 'n1-highcpu-16', cpu: 16, memory: 14.4, price: 0.5672, preemptiblePrice: 0.1200 },
  { name: 'n1-highcpu-32', cpu: 32, memory: 28.8, price: 1.1344, preemptiblePrice: 0.2400 },
  { name: 'n1-highcpu-64', cpu: 64, memory: 57.6, price: 2.2688, preemptiblePrice: 0.4800 },
  { name: 'n1-highcpu-96', cpu: 96, memory: 86.4, price: 3.402, preemptiblePrice: 0.7200 }
]

const machineTypesByName = _.keyBy('name', machineTypes)

const profiles = [
  {
    name: 'moderate',
    label: 'Moderate',
    machineConfig: {
      masterMachineType: 'n1-standard-4'
    }
  },
  {
    name: 'increased',
    label: 'Increased',
    machineConfig: {
      masterMachineType: 'n1-standard-16'
    }
  },
  {
    name: 'high',
    label: 'High',
    machineConfig: {
      masterMachineType: 'n1-standard-64'
    }
  }
]

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

const ClusterIcon = ({ shape, onClick, disabled }) => {
  return h(Interactive, {
    style: { color: onClick && !disabled && Style.colors.secondary },
    as: 'div',
    onClick: disabled ? undefined : onClick
  }, [icon(shape, { size: 20, class: 'is-solid' })])
}

const getUpdateInterval = status => {
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

export default class ClusterManager extends Component {
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
    const { namespace } = this.props
    try {
      const allClusters = await Leo.clustersList()
      const clusters = _.filter({
        googleProject: namespace,
        creator: getBasicProfile().getEmail()
      }, allClusters)
      this.setState({ clusters }, () => this.resetUpdateInterval())
    } catch (error) {
      reportError('Error loading clusters', error)
    }
  }

  resetUpdateInterval() {
    const currentCluster = this.getCurrentCluster()

    clearInterval(this.interval)
    this.interval = setInterval(this.refreshClusters, getUpdateInterval(currentCluster && currentCluster.status))
  }

  componentDidMount() {
    this.refreshClusters()
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  getActiveClusters() {
    const { clusters } = this.state
    return _.remove({ status: 'Deleting' }, clusters)
  }

  getCurrentCluster() {
    return _.last(_.sortBy('createdDate', this.getActiveClusters()))
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
      Leo.cluster(namespace, Utils.generateClusterName()).create({
        labels: {},
        machineConfig: this.getMachineConfig(),
        ...(jupyterUserScriptUri ? { jupyterUserScriptUri } : {})
      }).then(() => {
        this.setState({ open: false })
      })
    )
  }

  destroyClusters(keepIndex) {
    const activeClusters = this.getActiveClusters()
    this.executeAndRefresh(
      Promise.all(_.map(
        ({ googleProject, clusterName }) => Leo.cluster(googleProject, clusterName).delete(),
        _.without([_.nth(keepIndex, activeClusters)], activeClusters)
      ))
    )
  }

  startCluster() {
    const { googleProject, clusterName } = this.getCurrentCluster()
    this.executeAndRefresh(
      Leo.cluster(googleProject, clusterName).start()
    )
  }

  stopCluster() {
    const { googleProject, clusterName } = this.getCurrentCluster()
    this.executeAndRefresh(
      Leo.cluster(googleProject, clusterName).stop()
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
    const { open } = this.state
    const activeClusters = this.getActiveClusters()
    const creating = _.some({ status: 'Creating' }, activeClusters)
    const multiple = !creating && activeClusters.length > 1
    return h(DropdownBox, {
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
    const { clusters, busy, open } = this.state
    if (!clusters) {
      return null
    }
    const currentCluster = this.getCurrentCluster()
    const currentStatus = currentCluster && currentCluster.status
    const renderIcon = () => {
      switch (currentStatus) {
        case 'Stopped':
          return h(ClusterIcon, { shape: 'play', onClick: () => this.startCluster(), disabled: busy })
        case 'Running':
          return h(ClusterIcon, { shape: 'pause', onClick: () => this.stopCluster(), disabled: busy })
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
      renderIcon(),
      h(Interactive, {
        as: 'div',
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
