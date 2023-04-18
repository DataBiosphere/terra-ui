import _ from 'lodash/fp'
import { gpuTypes, machineTypes, zonesToGpus } from 'src/data/gce-machines'
import { CloudContext } from 'src/libs/ajax/leonardo/models/core-models'
import {
  GoogleRuntimeConfig, isDataprocConfig, isGceConfig, isGceWithPdConfig
} from 'src/libs/ajax/leonardo/models/runtime-config-models'
import {
  DisplayRuntimeStatus,
  LeoRuntimeStatus,
  Runtime
} from 'src/libs/ajax/leonardo/models/runtime-models'
import { NominalType } from 'src/libs/type-utils/type-helpers'
import * as Utils from 'src/libs/utils'
import { CloudProvider } from 'src/libs/workspace-utils'
import { RuntimeToolLabel, runtimeToolLabels, ToolLabel } from 'src/pages/workspaces/workspace/analysis/utils/tool-utils'


export const runtimeTypes = {
  gceVm: 'Standard VM',
  dataprocSingleNode: 'Spark single node',
  dataprocCluster: 'Spark cluster'
}

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

export const usableStatuses: LeoRuntimeStatus[] = ['Updating', 'Running']

export const getDefaultMachineType = (isDataproc: boolean, tool: ToolLabel): string => Utils.cond(
  [isDataproc, () => defaultDataprocMachineType],
  [tool === runtimeToolLabels.RStudio, () => defaultRStudioMachineType],
  [Utils.DEFAULT, () => defaultGceMachineType])

// GCP zones look like 'US-CENTRAL1-A'. To get the region, remove the last two characters.
export const getRegionFromZone = (zone: string) => zone.slice(0, -2)

export type NormalizedComputeRegion = NominalType<string, 'ComputeRegion'>

// TODO: test when zone and region have types
export const getNormalizedComputeRegion = (config: GoogleRuntimeConfig): NormalizedComputeRegion => {
  if (isGceConfig(config) || isGceWithPdConfig(config)) {
    return getRegionFromZone(config.zone).toUpperCase() as NormalizedComputeRegion
  } else if (isDataprocConfig(config)) {
    return config.region.toUpperCase() as NormalizedComputeRegion
  } else {
    return defaultComputeRegion as NormalizedComputeRegion
  }
}

export const findMachineType = (name: string) => {
  return _.find({ name }, machineTypes) || { name, cpu: 0, memory: 0, price: 0, preemptiblePrice: 0 }
}

export const getValidGpuTypesForZone = (zone: string) => {
  return _.flow(_.find({ name: zone }), _.get(['validTypes']))(zonesToGpus)
}

export const getValidGpuOptions = (numCpus: number, mem: number, zone: string) => {
  const validGpuOptionsForZone = getValidGpuTypesForZone(zone)
  const validGpuOptions = _.filter(({ maxNumCpus, maxMem, type }) => numCpus <= maxNumCpus && mem <= maxMem && validGpuOptionsForZone.includes(type),
    gpuTypes)
  return validGpuOptions || { name: '?', type: '?', numGpus: '?', maxNumCpus: '?', maxMem: '?', price: NaN, preemptiblePrice: NaN }
}

export const trimRuntimesOldestFirst = (runtimes: Runtime[]): Runtime[] => {
  const runtimesWithoutDeleting: Runtime[] = _.remove({ status: 'Deleting' }, runtimes)
  const sortedRuntimes: Runtime[] = _.sortBy('auditInfo.createdDate', runtimesWithoutDeleting)
  return sortedRuntimes
}

// Status note: undefined means still loading and no runtime
export const getCurrentRuntime = (runtimes: Runtime[]): Runtime | undefined => !runtimes ? undefined : (_.flow(trimRuntimesOldestFirst, _.last)(runtimes) || undefined)

// TODO: This function needs to be removed once we have testing in place in all places its used
// DO NOT USE THIS
export const getRuntimeForTool = (toolLabel: ToolLabel, currentRuntime: Runtime, currentRuntimeTool: RuntimeToolLabel): Runtime | undefined => Utils.cond([toolLabel === currentRuntimeTool, () => currentRuntime],
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


export const getConvertedRuntimeStatus = (runtime: Runtime): string => {
  return runtime && (runtime.patchInProgress ? 'LeoReconfiguring' : runtime.status) // NOTE: preserves null vs undefined
}

export const getComputeStatusForDisplay = (status: LeoRuntimeStatus): DisplayRuntimeStatus => Utils.switchCase(_.lowerCase(status),
  ['leoreconfiguring', () => 'Updating'],
  ['starting', () => 'Resuming'],
  ['stopping', () => 'Pausing'],
  ['stopped', () => 'Paused'],
  ['prestarting', () => 'Resuming'],
  ['prestopping', () => 'Pausing'],
  [Utils.DEFAULT, () => _.capitalize(status)])

export const displayNameForGpuType = (type: string): string => {
  return Utils.switchCase(type,
    ['nvidia-tesla-k80', () => 'NVIDIA Tesla K80'],
    ['nvidia-tesla-p4', () => 'NVIDIA Tesla P4'],
    ['nvidia-tesla-v100', () => 'NVIDIA Tesla V100'],
    ['nvidia-tesla-p100', () => 'NVIDIA Tesla P100'],
    [Utils.DEFAULT, () => 'NVIDIA Tesla T4']
  )
}

export const getIsRuntimeBusy = (runtime: Runtime): boolean => {
  const { Creating: creating, Updating: updating, LeoReconfiguring: reconfiguring, Stopping: stopping, Starting: starting } = _.countBy(getConvertedRuntimeStatus, [runtime])
  return _.sum([creating, updating, reconfiguring, stopping, starting]) > 0
}

// NOTE: the label property is being compared to Ajax response values, so the label cannot be changed without
// impacting code.
export const cloudProviders: { [label: string]: { label: CloudProvider } } = {
  azure: { label: 'AZURE' },
  gcp: { label: 'GCP' }
}

export const isGcpContext = (cloudContext: CloudContext): boolean => cloudContext.cloudProvider === cloudProviders.gcp.label
export const isAzureContext = (cloudContext: CloudContext): boolean => cloudContext.cloudProvider === cloudProviders.azure.label

export const getCreatorForRuntime = (runtime: Runtime): string => runtime?.auditInfo?.creator
