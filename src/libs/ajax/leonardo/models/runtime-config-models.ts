export interface GpuConfig {
  gpuType: string
  numOfGpus: number
}

export type ComputeType = 'GCE' | 'DATAPROC' | 'AZURE_VM'
export const cloudServiceTypes: Record<ComputeType, ComputeType> = {
  GCE: 'GCE',
  DATAPROC: 'DATAPROC',
  AZURE_VM: 'AZURE_VM'
}

export interface BaseRuntimeConfig {
  cloudService: ComputeType
}

export interface GceConfig extends BaseRuntimeConfig {
  machineType: string
  diskSize: number
  bootDiskSize?: number //This is optional for supporting old runtimes which only have 1 disk. All new runtime will have a boot disk
  zone: string
  gpuConfig?: GpuConfig
}

export interface GceWithPdConfig extends BaseRuntimeConfig {
  machineType: string
  persistentDiskId: number
  bootDiskSize: number
  zone: string
  gpuConfig?: GpuConfig
}

export interface DataprocConfig extends BaseRuntimeConfig {
  numberOfWorkers: number
  autopauseThreshold: number //TODO: Add to base config
  masterMachineType: string
  masterDiskSize: number
  workerMachineType?: string
  workerDiskSize?: number
  numberOfWorkerLocalSSDs?: number
  numberOfPreemptibleWorkers?: number
  // properties: Record<string, string> TODO: Where is this used?
  region: string
  componentGatewayEnabled: boolean
  workerPrivateAccess: boolean
}

export interface AzureConfig extends BaseRuntimeConfig {
  machineType: string
  persistentDiskId: number
  region: string
}

export type GoogleRuntimeConfig = GceConfig | GceWithPdConfig | DataprocConfig
export type RuntimeConfig = AzureConfig | GoogleRuntimeConfig

//TODO: should really add a kind in the backend, WIP
export const isDataprocConfig = (config: RuntimeConfig): config is DataprocConfig => {
  return config.cloudService === 'DATAPROC'
}
export const isGceRuntimeConfig = (config: RuntimeConfig): config is GceWithPdConfig | GceConfig => {
  return config.cloudService === 'GCE'
}
export const isGceWithPdConfig = (config: RuntimeConfig): config is GceWithPdConfig => {
  const castConfig = config as GceWithPdConfig
  return config.cloudService === 'GCE' && castConfig.persistentDiskId !== undefined && castConfig.bootDiskSize !== undefined
}
export const isGceConfig = (config: RuntimeConfig): config is GceConfig => {
  const castConfig = config as GceConfig
  return config.cloudService === 'GCE' && castConfig.diskSize !== undefined
}
export const isAzureConfig = (config: RuntimeConfig): config is AzureConfig => {
  return config.cloudService === 'AZURE_VM'
}
