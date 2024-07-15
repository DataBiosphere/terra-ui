import { NominalType } from '@terra-ui-packages/core-utils';
import { RawRuntimeConfig } from 'src/libs/ajax/leonardo/models/api-runtime-config';

import { AzureDiskType, DiskType } from '../Disks';

export interface GpuConfig {
  gpuType: string;
  numOfGpus: number;
}

export type ComputeType = 'GCE' | 'DATAPROC' | 'AZURE_VM';
export const cloudServiceTypes: Record<ComputeType, ComputeType> = {
  GCE: 'GCE',
  DATAPROC: 'DATAPROC',
  AZURE_VM: 'AZURE_VM',
};

export interface BaseRuntimeConfig {
  cloudService: ComputeType;
  normalizedRegion: NormalizedComputeRegion;
}

export interface GceConfig extends BaseRuntimeConfig {
  machineType: string;
  diskSize: number;
  bootDiskSize: number | null; // This is optional for supporting old runtimes which only have 1 disk. All new runtime will have a boot disk
  zone: string;
  gpuConfig: GpuConfig | null;
}
export interface GceWithPdConfig extends BaseRuntimeConfig {
  machineType: string;
  persistentDiskId: number;
  bootDiskSize: number;
  zone: string;
  gpuConfig: GpuConfig | null;
}

export interface DataprocConfig extends BaseRuntimeConfig {
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

export interface AzureConfig extends BaseRuntimeConfig {
  machineType: string;
  persistentDiskId: number;
  region: string | null;
}

export type GoogleRuntimeConfig = GceConfig | GceWithPdConfig | DataprocConfig;
export type RuntimeConfig = AzureConfig | GoogleRuntimeConfig;

// TODO: should really add a kind in the backend, WIP
export const isDataprocConfig = (config: RuntimeConfig | RawRuntimeConfig): config is DataprocConfig => {
  return config.cloudService === 'DATAPROC';
};
export const isGceRuntimeConfig = (config: RuntimeConfig | RawRuntimeConfig): config is GceWithPdConfig | GceConfig => {
  return config.cloudService === 'GCE';
};
export const isGceWithPdConfig = (config: RuntimeConfig | RawRuntimeConfig): config is GceWithPdConfig => {
  const castConfig = config as GceWithPdConfig;
  return (
    config.cloudService === 'GCE' && castConfig.persistentDiskId !== undefined && castConfig.bootDiskSize !== undefined
  );
};
export const isGceConfig = (config: RuntimeConfig | RawRuntimeConfig): config is GceConfig => {
  const castConfig = config as GceConfig;
  return config.cloudService === 'GCE' && castConfig.diskSize !== undefined;
};

export const isAzureConfig = (config: RuntimeConfig | RawRuntimeConfig): config is AzureConfig =>
  config.cloudService === 'AZURE_VM';

export const isAzureDiskType = (config: RuntimeConfig, diskType: DiskType): diskType is AzureDiskType =>
  config.cloudService === 'AZURE_VM';

export type NormalizedComputeRegion = NominalType<string, 'ComputeRegion'>;

// GCP zones look like 'US-CENTRAL1-A'. To get the region, remove the last two characters.
export const getRegionFromZone = (zone: string) => zone.slice(0, -2);
