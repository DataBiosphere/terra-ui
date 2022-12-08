import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h, input, label } from 'react-hyperscript-helpers'
import { IdContainer } from 'src/components/common'
import {
  cloudServices, dataprocCpuPrice, ephemeralExternalIpAddressPrice, gpuTypes, machineTypes, regionToPrices, zonesToGpus
} from 'src/data/machines'
import colors from 'src/libs/colors'
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { allAppTypes, appTools, toolLabels } from 'src/pages/workspaces/workspace/analysis/tool-utils'


export const computeStyles = {
  label: { fontWeight: 600, whiteSpace: 'pre' },
  value: { fontWeight: 400, whiteSpace: 'pre' },
  titleBar: { marginBottom: '1rem' },
  whiteBoxContainer: { padding: '1rem', borderRadius: 3, backgroundColor: 'white' },
  drawerContent: { display: 'flex', flexDirection: 'column', flex: 1, padding: '1.5rem' },
  headerText: { fontSize: 16, fontWeight: 600 },
  warningView: { backgroundColor: colors.warning(0.1) }
}

export const pdTypes = {
  standard: {
    label: 'pd-standard',
    displayName: 'Standard',
    regionToPricesName: 'monthlyStandardDiskPrice'
  },
  balanced: {
    label: 'pd-balanced',
    displayName: 'Balanced',
    regionToPricesName: 'monthlyBalancedDiskPrice'
  },
  ssd: {
    label: 'pd-ssd',
    displayName: 'Solid state drive (SSD)',
    regionToPricesName: 'monthlySSDDiskPrice'
  },
  fromString: str => Utils.switchCase(str,
    [pdTypes.standard.label, () => pdTypes.standard],
    [pdTypes.balanced.label, () => pdTypes.balanced],
    [pdTypes.ssd.label, () => pdTypes.ssd],
    [Utils.DEFAULT, () => console.error(`Invalid disk type: Should not be calling pdTypes.fromString for ${str}`)]
  )
}
export const updatePdType = disk => disk && _.update('diskType', pdTypes.fromString, disk)
export const mapToPdTypes = _.map(updatePdType)

// Dataproc clusters don't have persistent disks.
export const defaultDataprocMasterDiskSize = 150
export const defaultDataprocWorkerDiskSize = 150
// Since Leonardo started supporting persistent disks (PDs) for GCE VMs, boot disk size for a GCE VM
// with a PD has been non-user-customizable. Terra UI uses the value below for cost estimate calculations only.
export const defaultGceBootDiskSize = 120
export const defaultGcePersistentDiskSize = 50
export const defaultPersistentDiskType = pdTypes.standard

export const defaultGceMachineType = 'n1-standard-1'
export const defaultDataprocMachineType = 'n1-standard-4'
export const defaultRStudioMachineType = 'n1-standard-4'
export const defaultNumDataprocWorkers = 2
export const defaultNumDataprocPreemptibleWorkers = 0

export const defaultGpuType = 'nvidia-tesla-t4'
export const defaultNumGpus = 1

export const defaultLocation = 'US-CENTRAL1'

export const defaultComputeZone = 'US-CENTRAL1-A'
export const defaultComputeRegion = 'US-CENTRAL1'

export const defaultAutopauseThreshold = 30
// Leonardo considers autopause disabled when the threshold is set to 0
export const autopauseDisabledValue = 0

export const isAutopauseEnabled = threshold => threshold > autopauseDisabledValue
export const getAutopauseThreshold = isEnabled => isEnabled ? defaultAutopauseThreshold : autopauseDisabledValue

export const usableStatuses = ['Updating', 'Running']

export const getDefaultMachineType = (isDataproc, tool) => Utils.cond(
  [isDataproc, () => defaultDataprocMachineType],
  [tool === toolLabels.RStudio, () => defaultRStudioMachineType],
  [Utils.DEFAULT, () => defaultGceMachineType])

// GCP zones look like 'US-CENTRAL1-A'. To get the region, remove the last two characters.
export const getRegionFromZone = zone => zone.slice(0, -2)

export const normalizeComputeRegion = (region, zone) => Utils.cond(
  // The config that is returned by Leonardo is in lowercase, but GCP returns regions in uppercase.
  // PF-692 will have Leonardo return locations in uppercase.
  [!!region, () => region.toUpperCase()],
  [!!zone, () => getRegionFromZone(zone).toUpperCase()],
  [Utils.DEFAULT, () => defaultComputeRegion]
)

export const normalizeRuntimeConfig = ({
  cloudService, machineType, diskSize, masterMachineType, masterDiskSize, numberOfWorkers,
  numberOfPreemptibleWorkers, workerMachineType, workerDiskSize, bootDiskSize, region, zone
}) => {
  const isDataproc = cloudService === cloudServices.DATAPROC

  return {
    cloudService: cloudService || cloudServices.GCE,
    masterMachineType: masterMachineType || machineType || getDefaultMachineType(isDataproc),
    masterDiskSize: masterDiskSize || diskSize || (isDataproc ? defaultDataprocMasterDiskSize : defaultGceBootDiskSize),
    numberOfWorkers: (isDataproc && numberOfWorkers) || 0,
    numberOfPreemptibleWorkers: (isDataproc && numberOfWorkers && numberOfPreemptibleWorkers) || 0,
    workerMachineType: (isDataproc && numberOfWorkers && workerMachineType) || defaultDataprocMachineType,
    workerDiskSize: (isDataproc && numberOfWorkers && workerDiskSize) || defaultDataprocWorkerDiskSize,
    // One caveat with using DEFAULT_BOOT_DISK_SIZE here is this over-estimates old GCE runtimes without PD by 1 cent
    // because those runtimes do not have a separate boot disk. But those old GCE runtimes are more than 1 year old if they exist.
    // Hence, we're okay with this caveat.
    bootDiskSize: bootDiskSize || defaultGceBootDiskSize,
    computeRegion: normalizeComputeRegion(region, zone)
  }
}

export const findMachineType = name => {
  return _.find({ name }, machineTypes) || { name, cpu: '?', memory: '?', price: NaN, preemptiblePrice: NaN }
}

export const getValidGpuTypesForZone = zone => {
  return _.flow(_.find({ name: zone }), _.get(['validTypes']))(zonesToGpus)
}

export const getValidGpuOptions = (numCpus, mem, zone) => {
  const validGpuOptionsForZone = getValidGpuTypesForZone(zone)
  const validGpuOptions = _.filter(({ maxNumCpus, maxMem, type }) => numCpus <= maxNumCpus && mem <= maxMem && validGpuOptionsForZone.includes(type),
    gpuTypes)
  return validGpuOptions || { name: '?', type: '?', numGpus: '?', maxNumCpus: '?', maxMem: '?', price: NaN, preemptiblePrice: NaN }
}

const dataprocCost = (machineType, numInstances) => {
  const { cpu: cpuPrice } = findMachineType(machineType)

  return cpuPrice * numInstances * dataprocCpuPrice
}

const getHourlyCostForMachineType = (machineTypeName, region, isPreemptible) => {
  const { cpu, memory } = _.find({ name: machineTypeName }, machineTypes) || {}
  const { n1HourlyCpuPrice, preemptibleN1HourlyCpuPrice, n1HourlyGBRamPrice, preemptibleN1HourlyGBRamPrice } = _.find({ name: _.toUpper(region) },
    regionToPrices) || {}
  return isPreemptible ?
    (cpu * preemptibleN1HourlyCpuPrice) + (memory * preemptibleN1HourlyGBRamPrice) :
    (cpu * n1HourlyCpuPrice) + (memory * n1HourlyGBRamPrice)
}

const getGpuCost = (gpuType, numGpus, region) => {
  const prices = _.find({ name: region }, regionToPrices)
  // From a type like 'nvidia-tesla-t4', look up 't4HourlyPrice' in prices
  const price = prices[`${_.last(_.split('-', gpuType))}HourlyPrice`]
  return price * numGpus
}

export const runtimeConfigBaseCost = config => {
  const {
    cloudService, masterMachineType, masterDiskSize, numberOfWorkers, workerMachineType, workerDiskSize, bootDiskSize, computeRegion
  } = normalizeRuntimeConfig(config)

  const isDataproc = cloudService === cloudServices.DATAPROC

  return _.sum([
    (masterDiskSize + numberOfWorkers * workerDiskSize) * getPersistentDiskPriceForRegionHourly(computeRegion, pdTypes.standard),
    isDataproc ?
      (dataprocCost(masterMachineType, 1) + dataprocCost(workerMachineType, numberOfWorkers)) :
      (bootDiskSize * getPersistentDiskPriceForRegionHourly(computeRegion, pdTypes.standard))
  ])
}

export const runtimeConfigCost = config => {
  const {
    cloudService, masterMachineType, numberOfWorkers, numberOfPreemptibleWorkers, workerMachineType, workerDiskSize, computeRegion
  } = normalizeRuntimeConfig(
    config)
  const masterPrice = getHourlyCostForMachineType(masterMachineType, computeRegion, false)
  const workerPrice = getHourlyCostForMachineType(workerMachineType, computeRegion, false)
  const preemptiblePrice = getHourlyCostForMachineType(workerMachineType, computeRegion, true)
  const numberOfStandardVms = 1 + numberOfWorkers // 1 is for the master VM
  const gpuConfig = config?.gpuConfig
  const gpuEnabled = cloudService === cloudServices.GCE && !!gpuConfig

  return _.sum([
    masterPrice,
    numberOfWorkers * workerPrice,
    numberOfPreemptibleWorkers * preemptiblePrice,
    numberOfPreemptibleWorkers * workerDiskSize * getPersistentDiskPriceForRegionHourly(computeRegion, pdTypes.standard),
    cloudService === cloudServices.DATAPROC && dataprocCost(workerMachineType, numberOfPreemptibleWorkers),
    gpuEnabled && getGpuCost(gpuConfig.gpuType, gpuConfig.numOfGpus, computeRegion),
    ephemeralExternalIpAddressCost({ numStandardVms: numberOfStandardVms, numPreemptibleVms: numberOfPreemptibleWorkers }),
    runtimeConfigBaseCost(config)
  ])
}

// Per GB following https://cloud.google.com/compute/pricing
const getPersistentDiskPriceForRegionMonthly = (computeRegion, diskType) => {
  return _.flow(_.find({ name: _.toUpper(computeRegion) }), _.get([diskType.regionToPricesName]))(regionToPrices)
}
const numberOfHoursPerMonth = 730
const getPersistentDiskPriceForRegionHourly = (computeRegion, diskType) => getPersistentDiskPriceForRegionMonthly(computeRegion, diskType) / numberOfHoursPerMonth

export const getPersistentDiskCostMonthly = (currentPersistentDiskDetails, computeRegion) => {
  const price = getPersistentDiskPriceForRegionMonthly(computeRegion, currentPersistentDiskDetails?.diskType)
  return _.includes(currentPersistentDiskDetails?.status, ['Deleting', 'Failed']) ? 0.0 : currentPersistentDiskDetails?.size * price
}
export const getPersistentDiskCostHourly = ({ size, status, diskType }, computeRegion) => {
  const price = getPersistentDiskPriceForRegionHourly(computeRegion, diskType)
  return _.includes(status, ['Deleting', 'Failed']) ? 0.0 : size * price
}

const ephemeralExternalIpAddressCost = ({ numStandardVms, numPreemptibleVms }) => {
  // Google categorizes a VM as 'standard' if it is not 'pre-emptible'.
  return numStandardVms * ephemeralExternalIpAddressPrice.standard + numPreemptibleVms * ephemeralExternalIpAddressPrice.preemptible
}

export const getRuntimeCost = ({ runtimeConfig, status }) => Utils.switchCase(status,
  [
    'Stopped',
    () => runtimeConfigBaseCost(runtimeConfig)
  ],
  ['Error', () => 0.0],
  [Utils.DEFAULT, () => runtimeConfigCost(runtimeConfig)]
)


export const isApp = cloudEnvironment => !!cloudEnvironment?.appName

export const getAppCost = (app, dataDisk) => app.appType === appTools.Galaxy.appType ? getGalaxyCost(app, dataDisk) : 0

export const getGalaxyCost = (app, dataDisk) => {
  return getGalaxyDiskCost(dataDisk) + getGalaxyComputeCost(app)
}

/*
 * - Default nodepool VMs always run and incur compute and external IP cost whereas app
 *   nodepool VMs incur compute and external IP cost only when an app is running.
 * - Default nodepool cost is shared across all Kubernetes cluster users. It would
 *   be complicated to calculate that shared cost dynamically. Therefore, we are being
 *   conservative by adding default nodepool cost to all apps on a cluster.
 */
export const getGalaxyComputeCost = app => {
  const appStatus = app?.status?.toUpperCase()
  // Galaxy uses defaultComputeRegion because we're not yet enabling other locations for Galaxy apps.
  const defaultNodepoolComputeCost = getHourlyCostForMachineType(defaultGceMachineType, defaultComputeRegion, false)
  const defaultNodepoolIpAddressCost = ephemeralExternalIpAddressCost({ numStandardVms: 1, numPreemptibleVms: 0 })

  const staticCost = defaultNodepoolComputeCost + defaultNodepoolIpAddressCost
  const dynamicCost = app.kubernetesRuntimeConfig.numNodes *
    getHourlyCostForMachineType(app.kubernetesRuntimeConfig.machineType, defaultComputeRegion, false) +
    ephemeralExternalIpAddressCost({ numStandardVms: app.kubernetesRuntimeConfig.numNodes, numPreemptibleVms: 0 })

  switch (appStatus) {
    case 'STOPPED':
      return staticCost
    case 'DELETING':
    case 'ERROR':
      return 0.0
    default:
      return staticCost + dynamicCost
  }
}

/*
 * - Disk cost is incurred regardless of app status.
 * - Disk cost is total for data (NFS) disk, metadata (postgres) disk, and boot disks (1 boot disk per nodepool)
 * - Size of a data disk is user-customizable. The other disks have fixed sizes.
 */
export const getGalaxyDiskCost = ({ size: dataDiskType, diskType }) => {
  const metadataDiskSize = 10 // GB
  const defaultNodepoolBootDiskSize = 100 // GB
  const appNodepoolBootDiskSize = 100 // GB

  return getPersistentDiskCostHourly({
    status: 'Running',
    size: dataDiskType + metadataDiskSize + defaultNodepoolBootDiskSize + appNodepoolBootDiskSize,
    diskType
  }, defaultComputeRegion)
}

export const trimRuntimesOldestFirst = _.flow(
  _.remove({ status: 'Deleting' }),
  _.sortBy('auditInfo.createdDate')
)

// Status note: undefined means still loading and no runtime
export const getCurrentRuntime = runtimes => {
  const currentRuntime = !runtimes ? undefined : (_.flow(trimRuntimesOldestFirst, _.last)(runtimes) || undefined)
  return isFeaturePreviewEnabled('jupyterlab-gcp') ? !currentRuntime ? undefined : _.set('labels.tool', 'JupyterLab', currentRuntime) : currentRuntime
}

const getCurrentAppExcludingStatuses = (appType, statuses) => _.flow(
  _.filter({ appType }),
  _.remove(({ status }) => _.includes(status, statuses)),
  _.sortBy('auditInfo.createdDate'),
  _.last
)

export const getCurrentApp = appType => getCurrentAppExcludingStatuses(appType, ['DELETING', 'PREDELETING'])
export const getCurrentAppIncludingDeleting = appType => getCurrentAppExcludingStatuses(appType, [])

export const getCurrentAttachedDataDisk = (app, appDataDisks) => {
  return updatePdType(_.find({ name: app?.diskName }, appDataDisks))
}

// If the disk was attached to an app, return the appType. Otherwise return undefined.
export const getDiskAppType = disk => {
  const saturnApp = disk.labels.saturnApplication
  // Do a case-insensitive match as disks have been created with both "galaxy" and "GALAXY".
  const appType = _.find(type => type.toLowerCase() === saturnApp?.toLowerCase(), allAppTypes)
  return appType
}

export const workspaceHasMultipleDisks = (disks, diskAppType) => {
  const appTypeDisks = _.filter(disk => getDiskAppType(disk) === diskAppType && disk.status !== 'Deleting', disks)
  const diskWorkspaces = _.map(currentDisk => currentDisk.labels.saturnWorkspaceName, appTypeDisks)
  return _.uniq(diskWorkspaces).length < diskWorkspaces.length
}

export const workspaceHasMultipleApps = (apps, appType) => {
  const appsByType = _.filter(currentApp => currentApp.appType === appType && !_.includes(currentApp.status, ['DELETING', 'PREDELETING']), apps)
  const appWorkspaces = _.map(currentApp => currentApp.labels.saturnWorkspaceName, appsByType)
  return _.uniq(appWorkspaces).length < appWorkspaces.length
}

export const appIsSettingUp = app => {
  return app && (app.status === 'PROVISIONING' || app.status === 'PRECREATING')
}

/**
 * A function to get the current app data disk from the list of appDataDisks and apps
 * for the passed in appType for the passed in workspace name.
 *
 * @param {string} appType App type to retrieve app data disk for
 * @param {string} apps List of apps in the current workspace
 * @param {appDataDisk[]} appDataDisks List of appDataDisks in the workspace
 * @param {string} workspaceName Name of the workspace
 * @returns The appDataDisk from appDataDisks attached to the appType
 */
export const getCurrentAppDataDisk = (appType, apps, appDataDisks, workspaceName) => {
  // a user's PD can either be attached to their current app, detaching from a deleting app or unattached
  const currentApp = getCurrentAppIncludingDeleting(appType)(apps)
  const currentDiskName = currentApp?.diskName
  const attachedDiskNames = _.without([undefined], _.map(app => app.diskName, apps))
  // If the disk is attached to an app (or being detached from a deleting app), return that disk. Otherwise,
  // return the newest unattached disk that was provisioned by the desired appType.

  return updatePdType(!!currentDiskName ?
    _.find({ name: currentDiskName }, appDataDisks) :
    _.flow(
      _.filter(disk => getDiskAppType(disk) === appType && disk.status !== 'Deleting' && !_.includes(disk.name, attachedDiskNames) &&
        disk.labels.saturnWorkspaceName === workspaceName),
      _.sortBy('auditInfo.createdDate'),
      _.last
    )(appDataDisks))
}

/**
 * Given the list of runtimes, returns the persistent disk attached to
 * the current runtime.
 * @param {runtime[]} runtimes List of runtimes.
 * @param {persistentDisk[]} persistentDisks List of persistent disks.
 * @returns persistentDisk attached to the currentRuntime.
 */
//TODO: can this just take current runtime>runtimes?
// what is the significance of of the filter on ` !_.includes(id, attachedIds)`?
export const getCurrentPersistentDisk = (runtimes, persistentDisks) => {
  const currentRuntime = getCurrentRuntime(runtimes)
  const id = currentRuntime?.runtimeConfig.persistentDiskId
  const attachedIds = _.without([undefined], _.map(runtime => runtime.runtimeConfig.persistentDiskId, runtimes))

  return id ?
    _.find({ id }, persistentDisks) :
    _.last(_.sortBy('auditInfo.createdDate', _.filter(({ id, status }) => status !== 'Deleting' && !_.includes(id, attachedIds), persistentDisks)))
}

export const isCurrentGalaxyDiskDetaching = apps => {
  const currentGalaxyApp = getCurrentAppIncludingDeleting(appTools.Galaxy.appType)(apps)
  return currentGalaxyApp && _.includes(currentGalaxyApp.status, ['DELETING', 'PREDELETING'])
}

export const getGalaxyCostTextChildren = (app, appDataDisks) => {
  const dataDisk = getCurrentAttachedDataDisk(app, appDataDisks)
  return app ?
    [getComputeStatusForDisplay(app.status), dataDisk ? ` ${Utils.formatUSD(getGalaxyCost(app, dataDisk))}/hr` : ''] : ['']
}

// TODO: multiple runtime: this is a good example of how the code should look when multiple runtimes are allowed, over a tool-centric approach
export const getCostDisplayForTool = (app, currentRuntime, currentRuntimeTool, toolLabel) => {
  return Utils.cond(
    [toolLabel === toolLabels.Galaxy, () => app ? `${getComputeStatusForDisplay(app.status)} ${Utils.formatUSD(getGalaxyComputeCost(app))}/hr` : ''],
    [toolLabel === toolLabels.Cromwell, () => ''], // We will determine what to put here later
    [toolLabel === toolLabels.JupyterLab, () => ''], //TODO: Azure cost calculation
    [getRuntimeForTool(toolLabel, currentRuntime, currentRuntimeTool), () => `${getComputeStatusForDisplay(currentRuntime.status)} ${Utils.formatUSD(getRuntimeCost(currentRuntime))}/hr`],
    [Utils.DEFAULT, () => {
      return ''
    }]
  )
}

export const getCostDisplayForDisk = (app, appDataDisks, computeRegion, currentRuntimeTool, persistentDisks, runtimes, toolLabel) => {
  const diskCost = getCostForDisk(app, appDataDisks, computeRegion, currentRuntimeTool, persistentDisks, runtimes, toolLabel)
  return diskCost ? `Disk ${Utils.formatUSD(diskCost)}/hr` : ''
}

export const getCostForDisk = (app, appDataDisks, computeRegion, currentRuntimeTool, persistentDisks, runtimes, toolLabel) => {
  let diskCost = ''
  if (currentRuntimeTool === toolLabel && persistentDisks && persistentDisks.length > 0) {
    const curPd = getCurrentPersistentDisk(runtimes, persistentDisks)
    const { size = 0, status = 'Running', diskType = pdTypes.standard } = curPd || {}
    diskCost = getPersistentDiskCostHourly({ size, status, diskType }, computeRegion)
  } else if (app && appDataDisks && (toolLabel === 'Galaxy')) {
    const currentDataDisk = getCurrentAttachedDataDisk(app, appDataDisks)
    //Occasionally currentDataDisk will be undefined on initial render.
    diskCost = currentDataDisk ? getGalaxyDiskCost(currentDataDisk) : ''
  }
  return diskCost
}


// TODO: multiple runtime: build component around this logic for a multiple runtime approach. see getCostForTool for example usage
export const getRuntimeForTool = (toolLabel, currentRuntime, currentRuntimeTool) => Utils.cond([toolLabel === currentRuntimeTool, () => currentRuntime],
  [Utils.DEFAULT, () => undefined])

export const getAnalysesDisplayList = _.flow(
  _.map(
    _.flow(
      _.get('name'),
      _.split('/'),
      _.nth(1)
    )
  ),
  _.without([undefined]),
  _.join(', ')
)

/**
 * 'Deletable' and 'Pausable' statuses are defined in a resource's respective model in Leonardo repo:
 * https://github.com/DataBiosphere/leonardo/blob/3339ae218b4258f704702475be1431b48a5e2932/core/src/main/scala/org/broadinstitute/dsde/workbench/leonardo/runtimeModels.scala
 * https://github.com/DataBiosphere/leonardo/blob/706a7504420ea4bec686d4f761455e8502b2ddf1/core/src/main/scala/org/broadinstitute/dsde/workbench/leonardo/kubernetesModels.scala
 * https://github.com/DataBiosphere/leonardo/blob/e60c71a9e78b53196c2848cd22a752e22a2cf6f5/core/src/main/scala/org/broadinstitute/dsde/workbench/leonardo/diskModels.scala
 */
export const isResourceDeletable = _.curry((resourceType, resource) => _.includes(_.lowerCase(resource?.status), Utils.switchCase(resourceType,
  ['runtime', () => ['unknown', 'running', 'updating', 'error', 'stopping', 'stopped', 'starting']],
  ['app', () => ['unspecified', 'running', 'error']],
  ['disk', () => ['failed', 'ready']],
  [Utils.DEFAULT, () => console.error(`Cannot determine deletability; resource type ${resourceType} must be one of runtime, app or disk.`)]
)))
export const isComputePausable = _.curry((computeType, compute) => _.includes(_.lowerCase(compute?.status), Utils.switchCase(computeType,
  ['runtime', () => ['unknown', 'running', 'updating', 'starting']],
  ['app', () => ['running', 'starting']],
  [Utils.DEFAULT, () => console.error(`Cannot determine pausability; compute type ${computeType} must be runtime or app.`)]
)))

export const getConvertedRuntimeStatus = runtime => {
  return runtime && (runtime.patchInProgress ? 'LeoReconfiguring' : runtime.status) // NOTE: preserves null vs undefined
}

export const getComputeStatusForDisplay = status => Utils.switchCase(_.lowerCase(status),
  ['leo reconfiguring', () => 'Updating'],
  ['starting', () => 'Resuming'],
  ['stopping', () => 'Pausing'],
  ['stopped', () => 'Paused'],
  ['prestarting', () => 'Resuming'],
  ['prestopping', () => 'Pausing'],
  [Utils.DEFAULT, () => _.capitalize(status)])

export const displayNameForGpuType = type => {
  return Utils.switchCase(type,
    ['nvidia-tesla-k80', () => 'NVIDIA Tesla K80'],
    ['nvidia-tesla-p4', () => 'NVIDIA Tesla P4'],
    ['nvidia-tesla-v100', () => 'NVIDIA Tesla V100'],
    ['nvidia-tesla-p100', () => 'NVIDIA Tesla P100'],
    [Utils.DEFAULT, () => 'NVIDIA Tesla T4']
  )
}

export const RadioBlock = ({ labelText, children, name, checked, onChange, style = {} }) => {
  return div({
    style: {
      backgroundColor: colors.warning(0.2),
      borderRadius: 3, border: `1px solid ${checked ? colors.accent() : 'transparent'}`,
      boxShadow: checked ? Style.standardShadow : undefined,
      display: 'flex', alignItems: 'baseline', padding: '.75rem',
      ...style
    }
  }, [
    h(IdContainer, [id => h(Fragment, [
      input({ type: 'radio', name, checked, onChange, id }),
      div({ style: { marginLeft: '.75rem' } }, [
        label({ style: { fontWeight: 600, fontSize: 16 }, htmlFor: id }, [labelText]),
        children
      ])
    ])])
  ])
}

export const getIsAppBusy = app => app?.status !== 'RUNNING' && _.includes('ING', app?.status)
export const getIsRuntimeBusy = runtime => {
  const { Creating: creating, Updating: updating, LeoReconfiguring: reconfiguring, Stopping: stopping, Starting: starting } = _.countBy(getConvertedRuntimeStatus, [runtime])
  return creating || updating || reconfiguring || stopping || starting
}

// NOTE: the label property is being compared to Ajax response values, so the label cannot be changed without
// impacting code.
export const cloudProviders = {
  azure: { label: 'AZURE', iconTitle: 'Microsoft Azure' },
  gcp: { label: 'GCP', iconTitle: 'Google Cloud Platform' }
}

export const isGcpContext = ({ cloudProvider }) => cloudProvider === cloudProviders.gcp.label
export const isAzureContext = ({ cloudProvider }) => cloudProvider === cloudProviders.azure.label

//TODO: fields isAppStatus? LeoLabel? isRuntimeStatus?
export const runtimeStatuses = {
  running: { label: 'Running', leoLabel: 'Running', canChangeCompute: true },
  deleted: { label: 'Deleted', leoLabel: 'Deleted' },
  deleting: { label: 'Deleting', leoLabel: 'Deleting' },
  creating: { label: 'Creating', leoLabel: 'Creating' },
  updating: { label: 'Updating', leoLabel: 'Updating' },
  starting: { label: 'Starting', leoLabel: 'Starting' },
  stopping: { label: 'Stopping', leoLabel: 'Stopping' },
  stopped: { label: 'Stopped', leoLabel: 'Stopped', canChangeCompute: true },
  error: { label: 'Error', leoLabel: 'Error', canChangeCompute: true }
}


