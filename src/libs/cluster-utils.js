import _ from 'lodash/fp'
import { cloudServices, dataprocCpuPrice, machineTypes, monthlyStoragePrice, storagePrice } from 'src/data/machines'


export const DEFAULT_DISK_SIZE = 50

export const usableStatuses = ['Updating', 'Running']

export const normalizeRuntimeConfig = ({ cloudService, machineType, diskSize, masterMachineType, masterDiskSize, numberOfWorkers, numberOfPreemptibleWorkers, workerMachineType, workerDiskSize, bootDiskSize }) => {
  const isDataproc = cloudService === cloudServices.DATAPROC

  return {
    cloudService: cloudService || cloudServices.GCE,
    masterMachineType: masterMachineType || machineType || 'n1-standard-4',
    masterDiskSize: masterDiskSize || diskSize || 50,
    numberOfWorkers: (isDataproc && numberOfWorkers) || 0,
    numberOfPreemptibleWorkers: (isDataproc && numberOfWorkers && numberOfPreemptibleWorkers) || 0,
    workerMachineType: (isDataproc && numberOfWorkers && workerMachineType) || 'n1-standard-4',
    workerDiskSize: (isDataproc && numberOfWorkers && workerDiskSize) || 50,
    bootDiskSize: bootDiskSize || 0

  }
}

export const runtimeConfigBaseCost = config => {
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

export const runtimeConfigCost = config => {
  const { masterMachineType, numberOfWorkers, numberOfPreemptibleWorkers, workerMachineType } = normalizeRuntimeConfig(config)
  const { price: masterPrice } = findMachineType(masterMachineType)
  const { price: workerPrice, preemptiblePrice } = findMachineType(workerMachineType)
  return _.sum([
    masterPrice,
    (numberOfWorkers - numberOfPreemptibleWorkers) * workerPrice,
    numberOfPreemptibleWorkers * preemptiblePrice,
    runtimeConfigBaseCost(config)
  ])
}

const generateDiskCostFunction = price => ({ size, status }) => {
  return _.includes(status, ['Deleting', 'Failed']) ? 0.0 : size * price
}
export const persistentDiskCost = generateDiskCostFunction(storagePrice)
export const persistentDiskCostMonthly = generateDiskCostFunction(monthlyStoragePrice)

export const clusterCost = ({ runtimeConfig, status }) => {
  switch (status) {
    case 'Stopped':
      return runtimeConfigBaseCost(runtimeConfig)
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

export const trimAppsOldestFirst = _.flow(
  _.remove({ status: 'DELETING' }),
  _.sortBy('auditInfo.createdDate'))

export const currentApp = _.flow(trimAppsOldestFirst, _.last)

export const appIsProvisioning = app => {
  return app && app.status === 'PROVISIONING'
}

export const appIsDeleting = app => {
  return app && app.status === 'DELETING'
}

export const collapsedClusterStatus = cluster => {
  return cluster && (cluster.patchInProgress ? 'LeoReconfiguring' : cluster.status) // NOTE: preserves null vs undefined
}
