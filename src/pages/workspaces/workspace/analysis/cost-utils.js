import _ from 'lodash/fp'
import {
  cloudServices, dataprocCpuPrice, ephemeralExternalIpAddressPrice, machineTypes, regionToPrices
} from 'src/data/gce-machines'
import { azureRegionToPrices, getDiskType } from 'src/libs/azure-utils'
import * as Utils from 'src/libs/utils'
import {
  defaultComputeRegion, defaultGceMachineType, findMachineType, getComputeStatusForDisplay, getCurrentAttachedDataDisk, getCurrentPersistentDisk,
  getRuntimeForTool, normalizeRuntimeConfig, pdTypes
} from 'src/pages/workspaces/workspace/analysis/runtime-utils'
import { appTools, toolLabels } from 'src/pages/workspaces/workspace/analysis/tool-utils'

// GOOGLE COST METHODS begin

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

// end GOOGLE COST METHODS

// AZURE COST METHODS begin

export const getAzureComputeCostEstimate = ({ region, machineType }) => {
  // TODO [IA-3348] make helper in azure-utils
  const regionPriceObj = _.find(priceObj => priceObj.name === region, azureRegionToPrices)
  const cost = regionPriceObj[machineType]
  return cost
}

export const getAzureDiskCostEstimate = ({ region, diskSize }) => {
  // TODO [IA-3348] make helper in azure-utils
  const regionPriceObj = _.find(priceObj => priceObj.name === region, azureRegionToPrices)
  const diskType = getDiskType(diskSize)
  const cost = regionPriceObj[diskType]
  return cost
}

// end AZURE COST METHODS
