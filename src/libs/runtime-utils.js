import _ from 'lodash/fp'
import { cloudServices, dataprocCpuPrice, ephemeralExternalIpAddressPrice, machineTypes, monthlyStoragePrice, storagePrice } from 'src/data/machines'


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
  const numberOfStandardVms = 1 + numberOfWorkers // 1 is for the master VM

  return _.sum([
    masterPrice,
    numberOfWorkers * workerPrice,
    numberOfPreemptibleWorkers * preemptiblePrice,
    numberOfPreemptibleWorkers * workerDiskSize * storagePrice,
    cloudService === cloudServices.DATAPROC && dataprocCost(workerMachineType, numberOfPreemptibleWorkers),
    ephemeralExternalIpAddressCost({ numStandardVms: numberOfStandardVms, numPreemptibleVms: numberOfPreemptibleWorkers }),
    runtimeConfigBaseCost(config)
  ])
}

const generateDiskCostFunction = price => ({ size, status }) => {
  return _.includes(status, ['Deleting', 'Failed']) ? 0.0 : size * price
}
export const persistentDiskCost = generateDiskCostFunction(storagePrice)
export const persistentDiskCostMonthly = generateDiskCostFunction(monthlyStoragePrice)

const ephemeralExternalIpAddressCost = ({ numStandardVms, numPreemptibleVms }) => {
  // Google categorizes a VM as 'standard' if it is not 'pre-emptible'.
  return numStandardVms * ephemeralExternalIpAddressPrice.standard + numPreemptibleVms * ephemeralExternalIpAddressPrice.preemptible
}

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

/*
 * - Disk cost is incurred regardless of app status.
 * - Default nodepool VMs always run and incur compute and external IP cost whereas app
 *   nodepool VMs incur compute and external IP cost only when an app is running.
 * - Default nodepool cost is shared across all Kubernetes cluster users. It would
 *   be complicated to calculate that shared cost dynamically. Therefore, we are being
 *   conservative by adding default nodepool cost to all apps on a cluster.
 * - Disk cost is for 250GB of NFS disk, 10GB of postgres disk, and 200GB of boot disks (1 boot disk per nodepool)
 */
export const getGalaxyCost = app => {
  const appStatus = app?.status?.toUpperCase()
  const defaultNodepoolComputeCost = machineCost('n1-standard-1')
  const defaultNodepoolIpAddressCost = ephemeralExternalIpAddressCost({ numStandardVms: 1, numPreemptibleVms: 0 })

  // TODO: Retrieve disk sizes from the app instead of hardcoding them
  const diskCost = persistentDiskCost({ size: 250 + 10 + 100 + 100, status: 'Running' })

  const staticCost = defaultNodepoolComputeCost + defaultNodepoolIpAddressCost + diskCost
  const dynamicCost = app.kubernetesRuntimeConfig.numNodes * machineCost(app.kubernetesRuntimeConfig.machineType) + ephemeralExternalIpAddressCost({ numStandardVms: app.kubernetesRuntimeConfig.numNodes, numPreemptibleVms: 0 })

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
