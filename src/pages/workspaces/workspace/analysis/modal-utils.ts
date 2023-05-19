import _ from 'lodash/fp';
import { cloudServices } from 'src/data/gce-machines';
import { PdType, PersistentDisk } from 'src/libs/ajax/leonardo/models/disk-models';
import {
  defaultDataprocMachineType,
  getDefaultMachineType,
} from 'src/pages/workspaces/workspace/analysis/utils/runtime-utils';
import { getToolLabelFromCloudEnv } from 'src/pages/workspaces/workspace/analysis/utils/tool-utils';

export interface IComputeConfig {
  diskSize: number;
  diskType: PdType;
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
  const gpuConfig = runtimeConfig?.gpuConfig;
  const toolLabel = getToolLabelFromCloudEnv(currentRuntimeDetails);
  return {
    hasGpu: computeConfig.hasGpu,
    autopauseThreshold: computeConfig.autopauseThreshold,
    runtime: currentRuntimeDetails
      ? {
          cloudService,
          toolDockerImage: getImageUrl(currentRuntimeDetails),
          tool: toolLabel,
          ...(currentRuntimeDetails?.jupyterUserScriptUri && {
            jupyterUserScriptUri: currentRuntimeDetails?.jupyterUserScriptUri,
          }),
          ...(cloudService === cloudServices.GCE
            ? {
                zone: computeConfig.computeZone,
                machineType: runtimeConfig.machineType || getDefaultMachineType(false, toolLabel),
                ...(computeConfig.hasGpu && gpuConfig ? { gpuConfig } : {}),
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

export const getImageUrl = (runtimeDetails) => {
  return _.find(({ imageType }) => _.includes(imageType, ['Jupyter', 'RStudio']), runtimeDetails?.runtimeImages)
    ?.imageUrl;
};
