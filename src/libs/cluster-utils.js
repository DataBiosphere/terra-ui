import _ from 'lodash/fp'
import { Fragment } from 'react'
import { h, p, span } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import { machineTypes, storagePrice } from 'src/data/clusters'
import * as Utils from 'src/libs/utils'


export const usableStatuses = ['Updating', 'Running']

export const normalizeMachineConfig = ({ masterMachineType, masterDiskSize, numberOfWorkers, numberOfPreemptibleWorkers, workerMachineType, workerDiskSize }) => {
  return {
    masterMachineType: masterMachineType || 'n1-standard-4',
    masterDiskSize: masterDiskSize || 50,
    numberOfWorkers: numberOfWorkers || 0,
    numberOfPreemptibleWorkers: (numberOfWorkers && numberOfPreemptibleWorkers) || 0,
    workerMachineType: (numberOfWorkers && workerMachineType) || 'n1-standard-4',
    workerDiskSize: (numberOfWorkers && workerDiskSize) || 50
  }
}

const machineStorageCost = config => {
  const { masterDiskSize, numberOfWorkers, workerDiskSize } = normalizeMachineConfig(config)
  return (masterDiskSize + numberOfWorkers * workerDiskSize) * storagePrice
}

export const machineConfigCost = config => {
  const { masterMachineType, numberOfWorkers, numberOfPreemptibleWorkers, workerMachineType } = normalizeMachineConfig(config)
  const { price: masterPrice } = _.find({ name: masterMachineType }, machineTypes)
  const { price: workerPrice, preemptiblePrice } = _.find({ name: workerMachineType }, machineTypes)
  return _.sum([
    masterPrice,
    (numberOfWorkers - numberOfPreemptibleWorkers) * workerPrice,
    numberOfPreemptibleWorkers * preemptiblePrice,
    machineStorageCost(config)
  ])
}

export const clusterCost = ({ machineConfig, status }) => {
  switch (status) {
    case 'Stopped':
      return machineStorageCost(machineConfig)
    case 'Deleting':
    case 'Error':
      return 0.0
    default:
      return machineConfigCost(machineConfig)
  }
}

export const trimClustersOldestFirst = _.flow(
  _.remove({ status: 'Deleting' }),
  _.sortBy('createdDate')
)

export const currentCluster = _.flow(trimClustersOldestFirst, _.last)


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
