import _ from 'lodash/fp'
import {
  dataprocCpuPrice, ephemeralExternalIpAddressPrice, machineTypes, regionToPrices
} from 'src/data/gce-machines'
import { App } from 'src/libs/ajax/leonardo/models/app-models'
import {
  GoogleRuntimeConfig,
  isDataprocConfig,
  isGceConfig,
  isGceRuntimeConfig,
  isGceWithPdConfig
} from 'src/libs/ajax/leonardo/models/runtime-config-models'
import { getAzurePricesForRegion, getDiskType } from 'src/libs/azure-utils'
import * as Utils from 'src/libs/utils'
import {
  defaultDataprocWorkerDiskSize, defaultGceBootDiskSize,
  getCurrentAttachedDataDisk,
  getCurrentPersistentDisk,
  pdTypes
} from 'src/pages/workspaces/workspace/analysis/utils/disk-utils'
import {
  defaultComputeRegion,
  defaultGceMachineType,
  findMachineType,
  getComputeStatusForDisplay, getNormalizedComputeRegion,
  getRuntimeForTool,
  isAzureContext,
} from 'src/pages/workspaces/workspace/analysis/utils/runtime-utils'
import { appToolLabels, appTools, runtimeToolLabels } from 'src/pages/workspaces/workspace/analysis/utils/tool-utils'

// GOOGLE COST METHODS begin

export const dataprocCost = (machineType, numInstances) => {
  const { cpu: cpuPrice } = findMachineType(machineType)

  return cpuPrice * numInstances * dataprocCpuPrice
}

export const getHourlyCostForMachineType = (machineTypeName, region, isPreemptible) => {
  const { cpu, memory } = _.find({ name: machineTypeName }, machineTypes) || { cpu: 0, memory: 0 }
  const { n1HourlyCpuPrice = 0, preemptibleN1HourlyCpuPrice = 0, n1HourlyGBRamPrice = 0, preemptibleN1HourlyGBRamPrice = 0 } = _.find({ name: _.toUpper(region) },
    regionToPrices) || {}
  return isPreemptible ?
    (cpu * preemptibleN1HourlyCpuPrice) + (memory * preemptibleN1HourlyGBRamPrice) :
    (cpu * n1HourlyCpuPrice) + (memory * n1HourlyGBRamPrice)
}

export const getGpuCost = (gpuType, numGpus, region) => {
  const prices = _.find({ name: region }, regionToPrices) || {}
  // From a type like 'nvidia-tesla-t4', look up 't4HourlyPrice' in prices
  const price = prices[`${_.last(_.split('-', gpuType))}HourlyPrice`]
  return price * numGpus
}

export const getDefaultIfUndefined = (input: number | undefined, alternative: number): number => input ? input : alternative

// This function deals with runtimes that are paused
// All disks referenced in this function are boot disks (aka the disk google needs to provision by default for OS storage)
// The user pd cost for a runtime is calculated elsewhere
export const runtimeConfigBaseCost = (config: GoogleRuntimeConfig): number => {
  const computeRegion = getNormalizedComputeRegion(config)

  const costForDataproc: number = isDataprocConfig(config) ?
    (config.masterDiskSize + config.numberOfWorkers *
      getDefaultIfUndefined(config.workerDiskSize, defaultDataprocWorkerDiskSize)) *
    getPersistentDiskPriceForRegionHourly(computeRegion, pdTypes.standard) +
    dataprocCost(config.masterMachineType, 1) + dataprocCost(config.workerMachineType, config.numberOfWorkers) :
    0

  const costForGceWithoutUserDisk: number = isGceConfig(config) ?
    getDefaultIfUndefined(config.bootDiskSize, defaultGceBootDiskSize) * getPersistentDiskPriceForRegionHourly(computeRegion, pdTypes.standard) :
    0

  const costForGceWithUserDisk: number = isGceWithPdConfig(config) ?
    (config.bootDiskSize) * getPersistentDiskPriceForRegionHourly(computeRegion, pdTypes.standard) : 0
  return _.sum([costForDataproc, costForGceWithoutUserDisk, costForGceWithUserDisk])
}

export const getGoogleRuntimeConfigCost = (config: GoogleRuntimeConfig): number => {
  const computeRegion = getNormalizedComputeRegion(config)

  const machineType: string = isGceRuntimeConfig(config) ? config.machineType :
    isDataprocConfig(config) ? config.masterMachineType : defaultGceMachineType

  const baseMachinePrice: number = getHourlyCostForMachineType(machineType, computeRegion, false)

  const additionalDataprocCost: number = isDataprocConfig(config) ? _.sum([
    config.numberOfWorkers * getHourlyCostForMachineType(config.workerMachineType, computeRegion, false),
    getDefaultIfUndefined(config.numberOfPreemptibleWorkers, 0) * getHourlyCostForMachineType(config.workerMachineType, computeRegion, true),
    getDefaultIfUndefined(config.numberOfPreemptibleWorkers, 0) * getDefaultIfUndefined(config.workerDiskSize, 0) * getPersistentDiskPriceForRegionHourly(computeRegion, pdTypes.standard),
    dataprocCost(config.workerMachineType, getDefaultIfUndefined(config.numberOfPreemptibleWorkers, 0)),
    ephemeralExternalIpAddressCost({ numStandardVms: config.numberOfWorkers, numPreemptibleVms: getDefaultIfUndefined(config.numberOfPreemptibleWorkers, 0) })
  ]) : 0

  const gpuCost = isGceRuntimeConfig(config) && !_.isNil(config.gpuConfig) ? getGpuCost(config.gpuConfig.gpuType, config.gpuConfig.numOfGpus, computeRegion) : 0

  const baseVmIpCost = ephemeralExternalIpAddressCost({ numStandardVms: 1, numPreemptibleVms: 0 })

  return _.sum([
    baseMachinePrice,
    additionalDataprocCost,
    gpuCost,
    baseVmIpCost,
    runtimeConfigBaseCost(config)
  ])
}

// Per GB following https://cloud.google.com/compute/pricing
export const getPersistentDiskPriceForRegionMonthly = (computeRegion, diskType) => {
  return _.flow(_.find({ name: _.toUpper(computeRegion) }), _.get([diskType.regionToPricesName]))(regionToPrices)
}
const numberOfHoursPerMonth = 730
export const getPersistentDiskPriceForRegionHourly = (computeRegion, diskType) => getPersistentDiskPriceForRegionMonthly(computeRegion, diskType) / numberOfHoursPerMonth

export const ephemeralExternalIpAddressCost = ({ numStandardVms, numPreemptibleVms }) => {
  // Google categorizes a VM as 'standard' if it is not 'pre-emptible'.
  return numStandardVms * ephemeralExternalIpAddressPrice.standard + numPreemptibleVms * ephemeralExternalIpAddressPrice.preemptible
}

export const getAppCost = (app, dataDisk) => app.appType === appTools.GALAXY.label ? getGalaxyCost(app, dataDisk) : 0

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

// end GOOGLE COST METHODS

// AZURE COST METHODS begin

export const getAzureComputeCostEstimate = ({ region, machineType }) => {
  const regionPriceObj = getAzurePricesForRegion(region) || {}
  const cost = regionPriceObj[machineType]
  return cost
}

export const getAzureDiskCostEstimate = ({ region, diskSize }) => {
  const regionPriceObj = getAzurePricesForRegion(region) || {}
  const diskType = getDiskType(diskSize)
  const cost = regionPriceObj[diskType]
  return cost
}

// end AZURE COST METHODS

// COMMON METHODS begin

export const getPersistentDiskCostMonthly = ({ cloudContext = {}, diskType, size, status, zone }, computeRegion) => {
  const price = Utils.cond(
    // @ts-expect-error
    [isAzureContext(cloudContext), () => getAzureDiskCostEstimate({ diskSize: size, region: zone })],
    [Utils.DEFAULT, () => size * getPersistentDiskPriceForRegionMonthly(computeRegion, diskType)]
  )
  return _.includes(status, ['Deleting', 'Failed']) ? 0.0 : price
}
export const getPersistentDiskCostHourly = ({ size, status, diskType, cloudContext = {} }, computeRegion) => {
  const price = Utils.cond(
    // @ts-expect-error
    [isAzureContext(cloudContext), () => getAzureDiskCostEstimate({ diskSize: size, region: computeRegion }) / numberOfHoursPerMonth],
    [Utils.DEFAULT, () => size * getPersistentDiskPriceForRegionHourly(computeRegion, diskType)],
  )
  return _.includes(status, ['Deleting', 'Failed']) ? 0.0 : price
}

export const getRuntimeCost = ({ runtimeConfig, status, cloudContext = {} }) => {
  // @ts-expect-error
  if (isAzureContext(cloudContext)) {
    return Utils.switchCase(status,
      ['Stopped', () => 0.0],
      ['Error', () => 0.0],
      [Utils.DEFAULT, () => getAzureComputeCostEstimate(runtimeConfig)]
    )
  }
  return Utils.switchCase(status,
    [
      'Stopped',
      () => runtimeConfigBaseCost(runtimeConfig)
    ],
    ['Error', () => 0.0],
    [Utils.DEFAULT, () => getGoogleRuntimeConfigCost(runtimeConfig)]
  )
}

export const getCostForDisk = (app, appDataDisks, computeRegion, currentRuntimeTool, persistentDisks, runtimes, toolLabel) => {
  let diskCost = ''
  const curPd = persistentDisks && persistentDisks.length && getCurrentPersistentDisk(runtimes, persistentDisks)
  if (curPd && isAzureDisk(curPd)) {
    return getAzureDiskCostEstimate({ region: computeRegion, diskSize: curPd.size }) / numberOfHoursPerMonth
  }
  if (currentRuntimeTool === toolLabel && persistentDisks && persistentDisks.length) {
    const { size = 0, status = 'Running', diskType = pdTypes.standard } = curPd || {}
    diskCost = getPersistentDiskCostHourly({ size, status, diskType }, computeRegion)
  } else if (app && appDataDisks && (toolLabel === appToolLabels.GALAXY)) {
    const currentDataDisk = getCurrentAttachedDataDisk(app, appDataDisks)
    //Occasionally currentDataDisk will be undefined on initial render.
    diskCost = currentDataDisk ? getGalaxyDiskCost(currentDataDisk) : ''
  }
  return diskCost
}

export const getCostDisplayForTool = (app, currentRuntime, currentRuntimeTool, toolLabel) => {
  return Utils.cond(
    [toolLabel === appToolLabels.GALAXY, () => app ? `${getComputeStatusForDisplay(app.status)} ${Utils.formatUSD(getGalaxyComputeCost(app))}/hr` : ''],
    [toolLabel === appToolLabels.CROMWELL, () => ''], // We will determine what to put here later
    [toolLabel === runtimeToolLabels.JupyterLab, () => currentRuntime ? `${getComputeStatusForDisplay(currentRuntime.status)} ${Utils.formatUSD(getRuntimeCost(currentRuntime))}/hr` : ''],
    [getRuntimeForTool(toolLabel, currentRuntime, currentRuntimeTool), () => `${getComputeStatusForDisplay(currentRuntime.status)} ${Utils.formatUSD(getRuntimeCost(currentRuntime))}/hr`],
    [Utils.DEFAULT, () => {
      return ''
    }]
  )
}

export const getCostDisplayForDisk = (app: App, appDataDisks, computeRegion, currentRuntimeTool, persistentDisks, runtimes, toolLabel) => {
  const diskCost = getCostForDisk(app, appDataDisks, computeRegion, currentRuntimeTool, persistentDisks, runtimes, toolLabel)
  return diskCost ? `Disk ${Utils.formatUSD(diskCost)}/hr` : ''
}

const isAzureDisk = persistentDisk => {
  return persistentDisk ? isAzureContext(persistentDisk.cloudContext) : false
}
// end COMMON METHODS
