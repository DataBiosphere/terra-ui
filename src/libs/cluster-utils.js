import _ from 'lodash/fp'
import { cloudServices, dataprocCpuPrice, machineTypes, monthlyStoragePrice, storagePrice } from 'src/data/machines'


// TODO (PD): look for other places this might make sense
export const DEFAULT_DISK_SIZE = 50

export const usableStatuses = ['Updating', 'Running']

export const normalizeRuntimeConfig = ({ cloudService, machineType, diskSize, masterMachineType, masterDiskSize, numberOfWorkers, numberOfPreemptibleWorkers, workerMachineType, workerDiskSize, bootDiskSize }) => {
  const isDataproc = cloudService === cloudServices.DATAPROC

  return {
    cloudService: cloudService || cloudServices.GCE,
    // TODO PD: consider renaming masterMachineType to better represent its value
    masterMachineType: masterMachineType || machineType || 'n1-standard-4',
    masterDiskSize: masterDiskSize || diskSize || 50,
    numberOfWorkers: (isDataproc && numberOfWorkers) || 0,
    numberOfPreemptibleWorkers: (isDataproc && numberOfWorkers && numberOfPreemptibleWorkers) || 0,
    workerMachineType: (isDataproc && numberOfWorkers && workerMachineType) || 'n1-standard-4',
    workerDiskSize: (isDataproc && numberOfWorkers && workerDiskSize) || 50,
    bootDiskSize: bootDiskSize || 0

  }
}

export const ongoingCost = config => {
  const { cloudService, masterMachineType, masterDiskSize, numberOfWorkers, workerMachineType, workerDiskSize, bootDiskSize } = normalizeRuntimeConfig(
    config)
  const { cpu: masterCpu } = findMachineType(masterMachineType)
  const { cpu: workerCpu } = findMachineType(workerMachineType)

  return _.sum([
    (masterDiskSize + numberOfWorkers * workerDiskSize) * storagePrice,
    cloudService === cloudServices.DATAPROC && (masterCpu + workerCpu * numberOfWorkers) * dataprocCpuPrice,
    bootDiskSize * storagePrice
  ])
}

export const findMachineType = name => {
  return _.find({ name }, machineTypes) || { name, cpu: '?', memory: '?', price: NaN, preemptiblePrice: NaN }
}

// TODO PD: return cost breakdown
export const runtimeConfigCost = config => {
  // TODO PD (low priority): Should rewrite the cost calculation to not use normalize
  const { masterMachineType, numberOfWorkers, numberOfPreemptibleWorkers, workerMachineType } = normalizeRuntimeConfig(config)
  const { price: masterPrice } = findMachineType(masterMachineType)
  const { price: workerPrice, preemptiblePrice } = findMachineType(workerMachineType)
  return _.sum([
    masterPrice,
    (numberOfWorkers - numberOfPreemptibleWorkers) * workerPrice,
    numberOfPreemptibleWorkers * preemptiblePrice,
    ongoingCost(config)
  ])
}

// TODO PD: evaluate if this is the right way to handle this
export const runtimeCostBreakdown = config => {
  return {
    running: runtimeConfigCost(config),
    stopped: ongoingCost(config)
  }
}

export const persistentDiskCostMonthly = config => {
  return config.size * monthlyStoragePrice
}

// TODO PD: investigate bug 'cannot read property size of undefined' when in dataproc
// TODO PD: examine what value is passed for config (ie what if there's no PD?)
export const persistentDiskCost = config => {
  return config.size * storagePrice
}

export const clusterCost = ({ runtimeConfig, status }) => {
  switch (status) {
    case 'Stopped':
      return ongoingCost(runtimeConfig)
    case 'Deleting':
    case 'Error':
      return 0.0
    default:
      return runtimeConfigCost(runtimeConfig)
  }
}

export const trimClustersOldestFirst = _.flow(
  _.remove({ status: 'Deleting' }),
  _.sortBy('auditInfo.createdDate')
)

export const currentCluster = clusters => {
  // Status note: undefined means still loading, null means no cluster
  return !clusters ? undefined : (_.flow(trimClustersOldestFirst, _.last)(clusters) || null)
}

export const collapsedClusterStatus = cluster => {
  return cluster && (cluster.patchInProgress ? 'LeoReconfiguring' : cluster.status) // NOTE: preserves null vs undefined
}
