import _ from 'lodash/fp'
import { Fragment } from 'react'
import { h, p, span } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import { dataprocCpuPrice, machineTypes, storagePrice } from 'src/data/machines'
import * as Utils from 'src/libs/utils'


export const usableStatuses = ['Updating', 'Running']

export const normalizeRuntimeConfig = ({ cloudService, machineType, diskSize, masterMachineType, masterDiskSize, numberOfWorkers, numberOfPreemptibleWorkers, workerMachineType, workerDiskSize }) => {
  const isDataproc = cloudService === 'DATAPROC'

  return {
    cloudService: cloudService || 'GCE',
    masterMachineType: masterMachineType || machineType || 'n1-standard-4',
    masterDiskSize: masterDiskSize || diskSize || 50,
    numberOfWorkers: (isDataproc && numberOfWorkers) || 0,
    numberOfPreemptibleWorkers: (isDataproc && numberOfWorkers && numberOfPreemptibleWorkers) || 0,
    workerMachineType: (isDataproc && numberOfWorkers && workerMachineType) || 'n1-standard-4',
    workerDiskSize: (isDataproc && numberOfWorkers && workerDiskSize) || 50
  }
}

export const formatRuntimeConfig = config => {
  const { cloudService, masterMachineType, masterDiskSize } = config
  return cloudService === 'GCE' ? {
    cloudService,
    machineType: masterMachineType,
    diskSize: masterDiskSize
  } : config
}

const ongoingCost = config => {
  const { cloudService, masterMachineType, masterDiskSize, numberOfWorkers, workerMachineType, workerDiskSize } = normalizeRuntimeConfig(config)
  const { cpu: masterCpu } = findMachineType(masterMachineType)
  const { cpu: workerCpu } = findMachineType(workerMachineType)


  return _.sum([
    (masterDiskSize + numberOfWorkers * workerDiskSize) * storagePrice,
    cloudService === 'DATAPROC' && (masterCpu + workerCpu * numberOfWorkers) * dataprocCpuPrice
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
    ongoingCost(config)
  ])
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
  _.sortBy('createdDate')
)

export const currentCluster = _.flow(trimClustersOldestFirst, _.last)

export const collapsedClusterStatus = cluster => {
  return cluster && (cluster.patchInProgress ? 'LeoReconfiguring' : cluster.status) // NOTE: preserves null vs undefined
}

export const deleteText = () => {
  return h(Fragment, [p({ style: { margin: '0px', lineHeight: '1.5rem' } }, [
    'Deleting your runtime will also ',
    span({ style: { fontWeight: 600 } }, ['delete any files on the associated hard disk ']),
    '(e.g. input data or analysis outputs) and installed packages. To permanently save these files, ',
    h(Link, {
      href: 'https://support.terra.bio/hc/en-us/articles/360026639112',
      ...Utils.newTabLinkProps
    }, ['move them to the workspace bucket.'])
  ]),
  p({ style: { margin: '14px 0px 0px', lineHeight: '1.5rem' } },
    ['Deleting your runtime will stop all running notebooks and associated costs. You can recreate your runtime later, ' +
      'which will take several minutes.'])])
}
