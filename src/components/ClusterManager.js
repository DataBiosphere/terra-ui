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
import { Ajax, ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'


const noCompute = 'You do not have access to run analyses on this workspace.'

const styles = {
    container: {
        height: '3rem',
        display: 'flex',
        alignItems: 'center',
        flex: 'none',
        marginLeft: 'auto',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        borderTopLeftRadius: 5,
        borderBottomLeftRadius: 5,
        backgroundColor: colors.grayBlue[4]
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
        backgroundColor: colors.orange[6],
        color: colors.orange[0],
        borderTop: `1px solid ${colors.orange[0]}`,
        borderBottom: `1px solid ${colors.orange[0]}`,
        padding: '1rem',
        marginTop: '1rem',
        marginLeft: '-1.25rem',
        marginRight: '-1.25rem'
    },
    divider: {
        marginTop: '1rem',
        marginLeft: '-1.25rem',
        marginRight: '-1.25rem',
        borderBottom: `1px solid ${colors.gray[6]}`
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
            div({ style: {...styles.col1, ...styles.label } }, 'CPUs'),
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
            div({ style: {...styles.col3, ...styles.label } }, 'Disk size'),
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
            div({ style: {...styles.col1, ...styles.label } }, 'Memory'),
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
        style: { color: onClick && !disabled ? colors.green[0] : colors.gray[2], ...style },
        onClick,
        disabled,
        ...props
    }, [icon(shape, { size: 20, className: 'is-solid' })])
}

const MiniLink = ({ href, disabled, tooltip, children, ...props }) => {
    return h(TooltipTrigger, { content: tooltip }, [
        h(Interactive, _.merge({
            as: 'a',
            href: !disabled ? href : undefined,
            style: {
                color: !disabled ? colors.green[0] : colors.gray[2],
                backgroundColor: colors.grayBlue[4],
                cursor: disabled ? 'not-allowed' : 'pointer',
                borderRadius: 4
            }
        }, props), [children])
    ])
}

const getUpdateIntervalMs = (status, isUpdating) => {
    switch (status) {
        case 'Starting':
        case 'Updating':
            return 5000
        case 'Creating':
        case 'Stopping':
            return 15000
        case 'Stopped':
            if (isUpdating) {
                return 5000
            } else {
                return 120000
            }
            //intentional fallthrough
        default:
            return 120000
    }
}

const NewClusterModal = class NewClusterModal extends PureComponent {
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
            ...Utils.normalizeMachineConfig(currentConfig)
        }
    }

    getMachineConfig() {
        const { numberOfWorkers, masterMachineType, masterDiskSize, workerMachineType, workerDiskSize, numberOfPreemptibleWorkers } = this.state
        return {
            numberOfWorkers,
            masterMachineType,
            masterDiskSize,
            workerMachineType,
            workerDiskSize,
            numberOfWorkerLocalSSDs: 0,
            numberOfPreemptibleWorkers
        }
    }

    createCluster() {
        const { namespace, create } = this.props
        const { jupyterUserScriptUri } = this.state
        create(Ajax().Jupyter.cluster(namespace, Utils.generateClusterName()).create({
            machineConfig: this.getMachineConfig(),
            ...(jupyterUserScriptUri ? { jupyterUserScriptUri } : {})
        }))
    }

    shouldCreate() {
        //we short circuit if the current cluster does not exist
        if (!this.props.currentCluster) {
            return true
        }

        const newMachineConfig = this.getMachineConfig()
        const currMachineConfig = this.props.currentCluster.machineConfig

        const shouldRecreateToAddWorkers = currMachineConfig.numberOfWorkers < 2 && currMachineConfig.numberOfWorkers !== newMachineConfig.numberOfWorkers

        //this assumes the config has changed as this method would not be called otherwise
        const nonUpdateableFields = ['workerMachineType', 'workerDiskSize', 'numberOfWorkerLocalSSDs']
        const shouldRecreateDueToUpdateNotSupporting = nonUpdateableFields.map(field => {
            return currMachineConfig[field] !== newMachineConfig[field]
        }).some(isUpdated => isUpdated)

        return shouldRecreateDueToUpdateNotSupporting || shouldRecreateToAddWorkers
    }

    render() {
        const { currentCluster, onCancel } = this.props
        const { profile, masterMachineType, masterDiskSize, workerMachineType, numberOfWorkers, numberOfPreemptibleWorkers, workerDiskSize, jupyterUserScriptUri } = this.state
        const changed = !currentCluster ||
            currentCluster.status === 'Error' ||
            !machineConfigsEqual(this.getMachineConfig(), currentCluster.machineConfig) ||
            jupyterUserScriptUri
        const shouldDisableUpdate = !changed && currentCluster.machineConfig.numberOfWorkers >= 2
        return h(Modal, {
            title: 'Runtime environment',
            onDismiss: onCancel,
            okButton: buttonPrimary({
                disabled: currentCluster ? shouldDisableUpdate : !changed,
                onClick: () => this.shouldCreate() ? this.createCluster() : this.props.update(this.getMachineConfig())
            }, currentCluster ? 'Update' : 'Create')
        }, [
            div({ style: styles.row }, [
                div({ style: {...styles.col1, ...styles.label } }, 'Profile'),
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
                    div({ style: {...styles.col1, ...styles.label } }, 'Startup script'),
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
                ]), !!numberOfWorkers && h(Fragment, [
                    div({ style: styles.row }, [
                        div({ style: {...styles.col1, ...styles.label } }, 'Workers'),
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
                        div({ style: {...styles.col3, ...styles.label } }, 'Preemptible'),
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
            changed && currentCluster ?
            div({ style: styles.warningBox }, [
                ' Updating the resources could take a few minutes to prepare, and may necessitate your cluster being stopped.',
                ' The environment will automatically be started when it is ready.'
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
            updatingStatus: false,
            configToUpdate: {}
        }
    }

    refreshClusters = async() => {
        this.props.refreshClusters().then(() => {
            if (this.state.updatingStatus) {
                this.handleUpdate()
            }
            this.resetUpdateInterval()
        })
    }

    handleUpdate() {
        const { updatingStatus } = this.state
        const currentStatus = this.getCurrentCluster().status
        if (updatingStatus === 'Stopping' && currentStatus === 'Stopped') {
            this.setState({ updatingStatus: 'Updating' })
            this.updateCluster()
        }
    }

    resetUpdateInterval() {
        const currentCluster = this.getCurrentCluster()

        clearInterval(this.interval)
        this.interval = setInterval(this.refreshClusters, getUpdateIntervalMs(currentCluster && currentCluster.status, this.state.updatingStatus))
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

    async executeAndRefreshWithNav(promise) {
        const { namespace, name } = this.props

        this.executeAndRefresh(promise)
        if (/notebooks\/.+/.test(window.location.hash)) {
            Nav.goToPath('workspace-notebooks', { namespace, name })
        }
    }

    updateCluster() {
        const { ajax: { Jupyter } } = this.props
        const { googleProject, clusterName, status } = this.getCurrentCluster() //PR question, are namespace and googleProject the same? any benefit of using one or the other?

        const { updatedConfig } = this.state
        this.executeAndRefresh(Jupyter.cluster(googleProject, clusterName).update({
            machineConfig: updatedConfig
        })).then(() => {
            if (this.state.updatingStatus === 'Updating' && status === 'Stopped') {
                this.setState({ updatingStatus: false })
                this.startCluster()
            }
            this.setState({ updatedConfig: {} })
        })
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
        this.executeAndRefreshWithNav(
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

    stopCluster(shouldNav) {
        const { ajax: { Jupyter } } = this.props
        const { googleProject, clusterName } = this.getCurrentCluster()

        if (shouldNav) {
            this.executeAndRefreshWithNav(
                Jupyter.cluster(googleProject, clusterName).stop()
            )
        } else {
            this.executeAndRefresh(
                Jupyter.cluster(googleProject, clusterName).stop().then(
                    () => window.location.reload()
                )
            )
        }
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

    render() {
        const { namespace, name, clusters, canCompute } = this.props
        const { busy, open, deleting } = this.state
        if (!clusters) {
            return null
        }
        const currentCluster = this.getCurrentCluster()
        const currentStatus = currentCluster && currentCluster.status
        const running = currentStatus === 'Running'
        const spendingClusters = _.remove(({ status }) => _.includes(status, ['Deleting', 'Error']), clusters)
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
                        onClick: () => this.stopCluster(true),
                        disabled: busy || !canCompute,
                        tooltip: canCompute ? 'Stop cluster' : noCompute
                    })
                case 'Starting':
                case 'Stopping':
                case 'Creating':
                case 'Updating':
                    return h(ClusterIcon, { shape: 'sync', disabled: true })
                default:
                    return h(ClusterIcon, {
                        shape: 'play',
                        onClick: () => this.createDefaultCluster(),
                        disabled: busy || !canCompute,
                        tooltip: canCompute ? 'Create cluster' : noCompute
                    })
            }
        }
        const totalCost = _.sum(_.map(({ machineConfig, status }) => {
            return (status === 'Stopped' ? machineStorageCost : machineConfigCost)(machineConfig)
        }, spendingClusters))
        const activeClusters = this.getActiveClustersOldestFirst()
        const creating = _.some({ status: 'Creating' }, activeClusters)
        const updating = _.some({ status: 'Updating' }, activeClusters)
        const multiple = !creating && activeClusters.length > 1
        const isDisabled = !canCompute || creating || multiple || busy

        return div({ style: styles.container }, [
            h(MiniLink, {
                href: Nav.getLink('workspace-terminal-launch', { namespace, name }),
                disabled: !running || !canCompute,
                tooltip: Utils.cond(
                    [!canCompute, () => noCompute], [!running, () => 'Start runtime to open terminal'],
                    () => 'Open terminal'
                ),
                style: { marginRight: '2rem' }
            }, [icon('terminal', { className: 'is-solid', size: 24 })]),
            renderIcon(),
            h(ClusterIcon, {
                shape: 'trash',
                onClick: () => this.setState({ deleting: true }),
                disabled: busy || !canCompute || !_.includes(currentStatus, ['Stopped', 'Running', 'Error', 'Updating']),
                tooltip: 'Delete cluster',
                style: { marginLeft: '0.5rem' }
            }),
            h(PopupTrigger, {
                side: 'bottom',
                open: multiple,
                width: 300,
                content: this.renderDestroyForm()
            }, [
                h(Clickable, {
                    style: styles.button(isDisabled),
                    tooltip: Utils.cond(
                        [!canCompute, () => noCompute], [creating, () => 'Your environment is being created'], [multiple, () => undefined], [updating, () => 'Your environment is being updated'],
                        () => 'Update runtime'
                    ),
                    onClick: () => this.setState({ open: true }),
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
                    icon('cog', { size: 22, className: 'is-solid', style: { color: isDisabled ? colors.gray[2] : colors.green[0] } })
                ])
            ]),
            deleting && h(Modal, {
                title: 'Delete notebook runtime?',
                onDismiss: () => this.setState({ deleting: false }),
                okButton: () => {
                    this.setState({ deleting: false })
                    this.destroyActiveCluster()
                }
            }, ['Deleting the cluster will stop all running notebooks and associated costs. You can recreate it later, which will take several minutes.']),
            open && h(NewClusterModal, {
                namespace,
                currentCluster,
                onCancel: () => this.setState({ open: false }),
                create: promise => {
                    this.setState({ open: false })
                    this.executeAndRefresh(promise)
                },
                update: newMachineConfig => {
                    //if the machine config is changing, we must first stop the cluster to update it
                    if (newMachineConfig.masterMachineType !== currentCluster.machineConfig.masterMachineType && currentStatus === 'Running') {
                        this.setState({ open: false, busy: true, updatedConfig: newMachineConfig, updatingStatus: 'Stopping' }, () => this.stopCluster(false))
                    } else {
                        this.setState({ open: false, updatedConfig: newMachineConfig }, this.updateCluster)
                    }
                }
            })
        ])
    }
})