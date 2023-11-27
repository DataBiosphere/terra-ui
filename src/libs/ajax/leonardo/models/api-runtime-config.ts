import { ComputeType, GpuConfig } from 'src/libs/ajax/leonardo/models/runtime-config-models';

export interface ApiRuntimeConfig {
  cloudService: ComputeType;
}

export interface RawGceConfig extends ApiRuntimeConfig {
  machineType: string;
  diskSize: number;
  bootDiskSize: number | null; // This is optional for supporting old runtimes which only have 1 disk. All new runtime will have a boot disk
  zone: string;
  gpuConfig: GpuConfig | null;
}

export interface RawGceWithPdConfig extends ApiRuntimeConfig {
  machineType: string;
  persistentDiskId: number;
  bootDiskSize: number;
  zone: string;
  gpuConfig: GpuConfig | null;
}

export interface RawDataprocConfig extends ApiRuntimeConfig {
  numberOfWorkers: number;
  autopauseThreshold: number | null; // TODO: Add to base config
  masterMachineType: string;
  masterDiskSize: number;
  workerMachineType: string | null;
  workerDiskSize: number | null;
  numberOfWorkerLocalSSDs: number | null;
  numberOfPreemptibleWorkers: number | null;
  // properties: Record<string, string> TODO: Where is this used?
  region: string;
  componentGatewayEnabled: boolean;
  workerPrivateAccess: boolean;
}

export interface RawAzureConfig extends ApiRuntimeConfig {
  machineType: string;
  persistentDiskId: number;
  region: string | null;
}

export type RawRuntimeConfig = RawAzureConfig | RawGceWithPdConfig | RawGceConfig | RawDataprocConfig;
