import { DiskType, GoogleDiskType } from '@terra-ui-packages/leonardo-data-client';
import { cloudServices } from 'src/analysis/utils/gce-machines';
import {
  defaultDataprocMachineType,
  getDefaultMachineType,
  getImageUrlFromRuntime,
} from 'src/analysis/utils/runtime-utils';
import { getToolLabelFromCloudEnv, ToolLabel } from 'src/analysis/utils/tool-utils';
import { ComputeType } from 'src/libs/ajax/leonardo/models/runtime-config-models';
import { GetRuntimeItem } from 'src/libs/ajax/leonardo/models/runtime-models';
import { GooglePdType, PersistentDisk } from 'src/libs/ajax/leonardo/providers/LeoDiskProvider';

export interface IComputeConfig {
  masterMachineType: string;
  masterDiskSize: number;
  numberOfWorkers: number;
  numberOfPreemptibleWorkers: number;
  workerMachineType: string;
  workerDiskSize: number;
  componentGatewayEnabled: boolean;
  gpuEnabled: boolean;
  hasGpu: boolean;
  gpuType: string;
  numGpus: number;
  autopauseThreshold: number;
  computeRegion: string;
  computeZone: string;

  // Used by GCP disk select
  diskSize: number;
  diskType: GoogleDiskType;

  // Used by Azure disk select
  persistentDiskSize: number;
  persistentDiskType: DiskType;
}

export type NormalizedModalRuntimeConfig = {
  hasGpu: boolean;
  autopauseThreshold: number | undefined;
  runtime?: NormalizedModalRuntime;
  persistentDisk?: PersistentDiskConfigInModalRuntimeConfig;
};

export interface PersistentDiskConfigInModalRuntimeConfig {
  size: number;
  diskType: GooglePdType;
}

export type NormalizedModalRuntime = {
  cloudService: ComputeType | undefined;
  toolDockerImage: string | undefined; // this is a url
  tool?: ToolLabel;
  persistentDiskAttached: boolean;
  region: string;
  jupyterUserScriptUri?: string;
  gpuConfig?: any;
  zone?: string;
  machineType?: string;
  bootDiskSize?: number | null;
  diskSize?: number;
  componentGatewayEnabled?: boolean;
  masterMachineType?: string;
  masterDiskSize?: number;
  numberOfWorkers?: number;
  numberOfPreemptibleWorkers?: number | null;
  workerMachineType?: string | null;
  workerDiskSize?: number | null;
};

// TODO: tnis is the best place to start
export const buildExistingEnvironmentConfig = (
  computeConfig: IComputeConfig,
  currentRuntimeDetails?: GetRuntimeItem,
  currentPersistentDiskDetails?: PersistentDisk,
  isDataproc = false
): NormalizedModalRuntimeConfig => {
  const runtimeConfig = currentRuntimeDetails?.runtimeConfig;
  const cloudService = runtimeConfig?.cloudService;
  const numberOfWorkers = runtimeConfig && 'numberOfWorkers' in runtimeConfig ? runtimeConfig.numberOfWorkers : 0;
  const gpuConfig = runtimeConfig && 'gpuConfig' in runtimeConfig ? runtimeConfig.gpuConfig : undefined;
  const toolLabel = currentRuntimeDetails ? getToolLabelFromCloudEnv(currentRuntimeDetails) : undefined;
  return {
    hasGpu: computeConfig.hasGpu,
    autopauseThreshold: currentRuntimeDetails?.autopauseThreshold,
    runtime: currentRuntimeDetails
      ? {
          cloudService,
          toolDockerImage: getImageUrlFromRuntime(currentRuntimeDetails),
          tool: toolLabel,
          region: computeConfig.computeRegion,
          persistentDiskAttached: !!(runtimeConfig && 'persistentDiskId' in runtimeConfig),
          gpuConfig,
          ...(currentRuntimeDetails?.jupyterUserScriptUri
            ? {
                jupyterUserScriptUri: currentRuntimeDetails?.jupyterUserScriptUri,
              }
            : {}),
          // TODO: this can use runtimeconfig conditionals too more safely
          ...(cloudService === cloudServices.GCE
            ? {
                zone: computeConfig.computeZone,
                machineType:
                  runtimeConfig && 'machineType' in runtimeConfig
                    ? runtimeConfig.machineType
                    : getDefaultMachineType(false, getToolLabelFromCloudEnv(currentRuntimeDetails)),
                ...(runtimeConfig && 'bootDiskSize' in runtimeConfig
                  ? { bootDiskSize: runtimeConfig.bootDiskSize }
                  : {}),
                ...(runtimeConfig && 'diskSize' in runtimeConfig ? { diskSize: runtimeConfig.diskSize } : {}),
              }
            : {
                // this branch means its dataproc
                masterMachineType:
                  runtimeConfig && 'masterMachineType' in runtimeConfig
                    ? runtimeConfig.masterMachineType
                    : defaultDataprocMachineType,
                masterDiskSize: runtimeConfig && 'masterDiskSize' in runtimeConfig ? runtimeConfig.masterDiskSize : 100,
                numberOfWorkers,
                componentGatewayEnabled:
                  runtimeConfig && 'componentGatewayEnabled' in runtimeConfig
                    ? runtimeConfig.componentGatewayEnabled
                    : isDataproc,
                ...(numberOfWorkers && {
                  numberOfPreemptibleWorkers:
                    runtimeConfig && 'numberOfPreemptibleWorkers' in runtimeConfig
                      ? runtimeConfig.numberOfPreemptibleWorkers
                      : 0,
                  workerMachineType:
                    runtimeConfig && 'workerMachineType' in runtimeConfig
                      ? runtimeConfig.workerMachineType
                      : defaultDataprocMachineType,
                  workerDiskSize:
                    runtimeConfig && 'workerDiskSize' in runtimeConfig ? runtimeConfig.workerDiskSize : 100,
                }),
              }),
        }
      : undefined,
    persistentDisk: currentPersistentDiskDetails
      ? { size: currentPersistentDiskDetails.size, diskType: currentPersistentDiskDetails.diskType }
      : undefined,
  };
};
