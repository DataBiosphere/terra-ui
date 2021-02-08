import _ from 'lodash/fp'
import { cloudServices, dataprocCpuPrice, machineTypes, monthlyStoragePrice, storagePrice } from 'src/data/machines'


export const DEFAULT_DISK_SIZE = 50

export const usableStatuses = ['Updating', 'Running']

export const normalizeRuntimeConfig = ({
  cloudService, machineType, diskSize, masterMachineType, masterDiskSize, numberOfWorkers,
  numberOfPreemptibleWorkers, workerMachineType, workerDiskSize, bootDiskSize
}) => {
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

export const findMachineType = name => {
  return _.find({ name }, machineTypes) || { name, cpu: '?', memory: '?', price: NaN, preemptiblePrice: NaN }
}

const dataprocCost = (machineType, numInstances) => {
  const { cpu: cpuPrice } = findMachineType(machineType)

  return cpuPrice * numInstances * dataprocCpuPrice
}

export const runtimeConfigBaseCost = config => {
  const {
    cloudService, masterMachineType, masterDiskSize, numberOfWorkers, workerMachineType, workerDiskSize, bootDiskSize
  } = normalizeRuntimeConfig(
    config)

  return _.sum([
    (masterDiskSize + numberOfWorkers * workerDiskSize) * storagePrice,
    cloudService === cloudServices.DATAPROC && (dataprocCost(masterMachineType, 1) + dataprocCost(workerMachineType, numberOfWorkers)),
    bootDiskSize * storagePrice
  ])
}

export const runtimeConfigCost = config => {
  const { cloudService, masterMachineType, numberOfWorkers, numberOfPreemptibleWorkers, workerMachineType, workerDiskSize } = normalizeRuntimeConfig(
    config)
  const { price: masterPrice } = findMachineType(masterMachineType)
  const { price: workerPrice, preemptiblePrice } = findMachineType(workerMachineType)
  return _.sum([
    masterPrice,
    numberOfWorkers * workerPrice,
    numberOfPreemptibleWorkers * preemptiblePrice,
    numberOfPreemptibleWorkers * workerDiskSize * storagePrice,
    cloudService === cloudServices.DATAPROC && dataprocCost(workerMachineType, numberOfPreemptibleWorkers),
    runtimeConfigBaseCost(config)
  ])
}

const generateDiskCostFunction = price => ({ size, status }) => {
  return _.includes(status, ['Deleting', 'Failed']) ? 0.0 : size * price
}
export const persistentDiskCost = generateDiskCostFunction(storagePrice)
export const persistentDiskCostMonthly = generateDiskCostFunction(monthlyStoragePrice)

export const runtimeCost = ({ runtimeConfig, status }) => {
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

export const getGalaxyCost = app => {
  // numNodes * price per node + diskCost + defaultNodepoolCost
  const defaultNodepoolCost = machineCost('n1-standard-1')
  const appCost = app.kubernetesRuntimeConfig.numNodes * machineCost(app.kubernetesRuntimeConfig.machineType) +
    persistentDiskCost({ size: 250 + 10 + 100 + 100, status: 'Running' })
  return appCost + defaultNodepoolCost
  // diskCost: 250Gb for the NFS disk, 10Gb for the postgres disk, and 200Gb for boot disks (1 boot disk per nodepool)
  // to do: retrieve the disk sizes from the app not just hardcode them
}

export const trimRuntimesOldestFirst = _.flow(
  _.remove({ status: 'Deleting' }),
  _.sortBy('auditInfo.createdDate')
)

export const currentRuntime = runtimes => {
  // Status note: undefined means still loading, null means no runtime
  return !runtimes ? undefined : (_.flow(trimRuntimesOldestFirst, _.last)(runtimes) || null)
}

export const trimAppsOldestFirst = _.flow(
  _.remove({ status: 'DELETING' }),
  _.remove({ status: 'PREDELETING' }),
  _.sortBy('auditInfo.createdDate'))

// TODO: factor status into cost
export const machineCost = machineType => {
  return _.find(knownMachineType => knownMachineType.name === machineType, machineTypes).price
}

export const currentApp = _.flow(trimAppsOldestFirst, _.last)

export const appIsSettingUp = app => {
  return app && (app.status === 'PROVISIONING' || app.status === 'PRECREATING')
}

export const collapsedRuntimeStatus = runtime => {
  return runtime && (runtime.patchInProgress ? 'LeoReconfiguring' : runtime.status) // NOTE: preserves null vs undefined
}
