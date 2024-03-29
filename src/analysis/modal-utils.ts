import { cloudServices } from 'src/analysis/utils/gce-machines';
import {
  defaultDataprocMachineType,
  getDefaultMachineType,
  getImageUrlFromRuntime,
} from 'src/analysis/utils/runtime-utils';
import { getToolLabelFromCloudEnv } from 'src/analysis/utils/tool-utils';
import { GoogleDiskType, PersistentDisk, SharedPdType } from 'src/libs/ajax/leonardo/models/disk-models';

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
  persistentDiskType: SharedPdType; // TODO: Switch to DiskType
}

export const buildExistingEnvironmentConfig = (
  computeConfig: IComputeConfig,
  currentRuntimeDetails: any,
  currentPersistentDiskDetails: PersistentDisk,
  isDataproc: boolean
) => {
  const runtimeConfig = currentRuntimeDetails?.runtimeConfig;
  const cloudService = runtimeConfig?.cloudService;
  const numberOfWorkers = runtimeConfig?.numberOfWorkers || 0;
  const hasGpu = computeConfig.hasGpu;
  const gpuConfig = runtimeConfig?.gpuConfig;
  const toolLabel = getToolLabelFromCloudEnv(currentRuntimeDetails);
  return {
    hasGpu,
    autopauseThreshold: currentRuntimeDetails?.autopauseThreshold,
    runtime: currentRuntimeDetails
      ? {
          cloudService,
          toolDockerImage: getImageUrlFromRuntime(currentRuntimeDetails),
          tool: toolLabel,
          ...(currentRuntimeDetails?.jupyterUserScriptUri
            ? {
                jupyterUserScriptUri: currentRuntimeDetails?.jupyterUserScriptUri,
              }
            : {}),
          ...(currentRuntimeDetails?.timeoutInMinutes
            ? {
                timeoutInMinutes: currentRuntimeDetails?.timeoutInMinutes,
              }
            : {}),
          ...(cloudService === cloudServices.GCE
            ? {
                zone: computeConfig.computeZone,
                region: computeConfig.computeRegion,
                machineType: runtimeConfig.machineType || getDefaultMachineType(false, toolLabel),
                ...(hasGpu && gpuConfig ? { gpuConfig } : {}),
                bootDiskSize: runtimeConfig.bootDiskSize,
                ...(runtimeConfig.persistentDiskId
                  ? {
                      persistentDiskAttached: true,
                    }
                  : {
                      diskSize: runtimeConfig.diskSize,
                    }),
              }
            : {
                region: computeConfig.computeRegion,
                masterMachineType: runtimeConfig.masterMachineType || defaultDataprocMachineType,
                masterDiskSize: runtimeConfig.masterDiskSize || 100,
                numberOfWorkers,
                componentGatewayEnabled: runtimeConfig.componentGatewayEnabled || isDataproc,
                ...(numberOfWorkers && {
                  numberOfPreemptibleWorkers: runtimeConfig.numberOfPreemptibleWorkers || 0,
                  workerMachineType: runtimeConfig.workerMachineType || defaultDataprocMachineType,
                  workerDiskSize: runtimeConfig.workerDiskSize || 100,
                }),
              }),
        }
      : undefined,
    persistentDisk: currentPersistentDiskDetails
      ? { size: currentPersistentDiskDetails.size, diskType: currentPersistentDiskDetails.diskType }
      : undefined,
  };
};
