import _ from 'lodash/fp'
import { Fragment } from 'react'
import { h, p, span } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import { machineTypes, storagePrice } from 'src/data/machines'
import * as Utils from 'src/libs/utils'


export const usableStatuses = ['Updating', 'Running']

export const normalizeRuntimeConfig = ({ cloudService, machineType, diskSize, masterMachineType, masterDiskSize, numberOfWorkers, numberOfPreemptibleWorkers, workerMachineType, workerDiskSize }) => {
  return {
    cloudService: cloudService || 'GCE',
    masterMachineType: masterMachineType || machineType || 'n1-standard-4',
    masterDiskSize: masterDiskSize || diskSize || 50,
    numberOfWorkers: numberOfWorkers || 0,
    numberOfPreemptibleWorkers: (numberOfWorkers && numberOfPreemptibleWorkers) || 0,
    workerMachineType: (numberOfWorkers && workerMachineType) || 'n1-standard-4',
    workerDiskSize: (numberOfWorkers && workerDiskSize) || 50
  }
}

const machineStorageCost = config => {
  const { masterDiskSize, numberOfWorkers, workerDiskSize } = normalizeRuntimeConfig(config)
  return (masterDiskSize + numberOfWorkers * workerDiskSize) * storagePrice
}

export const findMachineType = name => {
  return _.find({ name }, machineTypes) || { name, cpu: '?', memory: '?', price: NaN, preemptiblePrice: NaN }
}

export const machineConfigCost = config => {
  const { masterMachineType, numberOfWorkers, numberOfPreemptibleWorkers, workerMachineType } = normalizeRuntimeConfig(config)
  const { price: masterPrice } = findMachineType(masterMachineType)
  const { price: workerPrice, preemptiblePrice } = findMachineType(workerMachineType)
  return _.sum([
    masterPrice,
    (numberOfWorkers - numberOfPreemptibleWorkers) * workerPrice,
    numberOfPreemptibleWorkers * preemptiblePrice,
    machineStorageCost(config)
  ])
}

export const runtimeCost = ({ runtimeConfig, status }) => {
  switch (status) {
    case 'Stopped':
      return machineStorageCost(runtimeConfig)
    case 'Deleting':
    case 'Error':
      return 0.0
    default:
      return machineConfigCost(runtimeConfig)
  }
}

export const trimRuntimesOldestFirst = _.flow(
  _.remove({ status: 'Deleting' }),
  _.sortBy('createdDate')
)

export const currentRuntime = _.flow(trimRuntimesOldestFirst, _.last)


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
