import { cloudServices } from 'src/data/gce-machines'
import { getToolLabelFromRuntime, PersistentDisk } from 'src/pages/workspaces/workspace/analysis/utils/tool-utils'

import { defaultDataprocMachineType, getDefaultMachineType } from './runtime-utils'


export interface IComputeConfig {
    persistentDiskSize: number
    persistentDiskType: {
      label: string
      displayName: string
      regionToPricesName: string
    }
    masterMachineType: string
    masterDiskSize: number
    numberOfWorkers: number
    numberOfPreemptibleWorkers: number
    workerMachineType: string
    workerDiskSize: number
    componentGatewayEnabled: boolean
    gpuEnabled: boolean
    hasGpu: boolean
    gpuType: string
    numGpus: number
    autopauseThreshold: number
    computeRegion: string
    computeZone: string
  }
export const getExistingEnvironmentConfig = (computeConfig:IComputeConfig, currentRuntimeDetails:any, currentPersistentDiskDetails:PersistentDisk, toolDockerImage:string, isDataproc:boolean) => {
  const runtimeConfig = currentRuntimeDetails?.runtimeConfig
  const cloudService = runtimeConfig?.cloudService
  const numberOfWorkers = runtimeConfig?.numberOfWorkers || 0
  const gpuConfig = runtimeConfig?.gpuConfig
  const toolLabel = getToolLabelFromRuntime(currentRuntimeDetails)
  return {
    hasGpu: computeConfig.hasGpu,
    autopauseThreshold: computeConfig.autopauseThreshold,
    runtime: currentRuntimeDetails ? {
      cloudService,
      toolDockerImage,
      tool: toolLabel,
      ...(currentRuntimeDetails?.jupyterUserScriptUri && { jupyterUserScriptUri: currentRuntimeDetails?.jupyterUserScriptUri }),
      ...(cloudService === cloudServices.GCE ? {
        zone: computeConfig.computeZone,
        machineType: runtimeConfig.machineType || getDefaultMachineType(false, toolLabel),
        ...(computeConfig.hasGpu && gpuConfig ? { gpuConfig } : {}),
        bootDiskSize: runtimeConfig.bootDiskSize,
        ...(runtimeConfig.persistentDiskId ? {
          persistentDiskAttached: true
        } : {
          diskSize: runtimeConfig.diskSize
        })
      } : {
        region: computeConfig.computeRegion,
        masterMachineType: runtimeConfig.masterMachineType || defaultDataprocMachineType,
        masterDiskSize: runtimeConfig.masterDiskSize || 100,
        numberOfWorkers,
        componentGatewayEnabled: runtimeConfig.componentGatewayEnabled || isDataproc,
        ...(numberOfWorkers && {
          numberOfPreemptibleWorkers: runtimeConfig.numberOfPreemptibleWorkers || 0,
          workerMachineType: runtimeConfig.workerMachineType || defaultDataprocMachineType,
          workerDiskSize: runtimeConfig.workerDiskSize || 100
        })
      })
    } : undefined,
    persistentDisk: currentPersistentDiskDetails ? { size: currentPersistentDiskDetails.size, diskType: currentPersistentDiskDetails.diskType } : undefined
  }
}

