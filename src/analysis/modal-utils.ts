import { DiskType, GoogleDiskType } from '@terra-ui-packages/leonardo-data-client';
import { cloudServices } from 'src/analysis/utils/gce-machines';
import {
  defaultDataprocMachineType,
  getDefaultMachineType,
  getImageUrlFromRuntime,
} from 'src/analysis/utils/runtime-utils';
import { getToolLabelFromCloudEnv, ToolLabel } from 'src/analysis/utils/tool-utils';
import { cloudServiceTypes, ComputeType } from 'src/libs/ajax/leonardo/models/runtime-config-models';
import { GetRuntimeItem } from 'src/libs/ajax/leonardo/models/runtime-models';
import { GooglePdType, PersistentDisk } from 'src/libs/ajax/leonardo/providers/LeoDiskProvider';
import * as Utils from 'src/libs/utils';

import { ComputeImage } from './useComputeImages';
import { defaultGceBootDiskSize } from './utils/disk-utils';

export interface IComputeConfig {
  bootDiskSize?: number;
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
  persistentDiskSize?: number;
  persistentDiskType?: DiskType;
}

export interface ExistingModalRuntimeConfig {
  hasGpu: boolean;
  autopauseThreshold: number | undefined;
  computeConfig: IComputeConfig;
  runtime?: NormalizedModalRuntime;
  currentRuntimeDetails?: GetRuntimeItem;
  persistentDisk?: ExistingModalPersistentDiskConfig;
}

export type DesiredModalRuntimeConfig = {
  persistentDisk?: DesiredModalPersistentDiskConfig;
} & Omit<ExistingModalRuntimeConfig, 'persistentDisk'>;

export interface ExistingModalPersistentDiskConfig {
  size: number;
  diskType: GooglePdType;
}
// The desired diverges from the existing because the api request to make a runtime requires `GoogleDiskType`
// However, we decorate the type to `GooglePdType` when we get it from the api
export interface DesiredModalPersistentDiskConfig {
  size: number;
  diskType: GoogleDiskType;
}

export type NormalizedModalRuntime = {
  cloudService: ComputeType | undefined;
  toolDockerImage: string | undefined; // this is a url
  tool?: ToolLabel;
  persistentDiskAttached: boolean;
  region: string;
  jupyterUserScriptUri?: string;
  gpuConfig?: any; // TODO
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
  timeoutInMinutes?: number | null;
};

// Auxiliary functions -- begin
export const isGce = (runtimeType) => runtimeType === runtimeTypes.gceVm;

export const isDataproc = (runtimeType) =>
  runtimeType === runtimeTypes.dataprocSingleNode || runtimeType === runtimeTypes.dataprocCluster;

export const isDataprocCluster = (runtimeType) => runtimeType === runtimeTypes.dataprocCluster;

// TODO: use type
export const runtimeTypes = {
  gceVm: 'Standard VM',
  dataprocSingleNode: 'Spark single node',
  dataprocCluster: 'Spark cluster',
};

export const shouldUsePersistentDisk = (runtimeType, runtimeDetails, upgradeDiskSelected) =>
  isGce(runtimeType) && (!runtimeDetails?.runtimeConfig?.diskSize || upgradeDiskSelected);

export const buildExistingEnvironmentConfig = (
  computeConfig: IComputeConfig,
  currentRuntimeDetails?: GetRuntimeItem,
  currentPersistentDiskDetails?: PersistentDisk,
  isDataproc = false
): ExistingModalRuntimeConfig => {
  const runtimeConfig = currentRuntimeDetails?.runtimeConfig;
  const cloudService = runtimeConfig?.cloudService;
  const numberOfWorkers = runtimeConfig && 'numberOfWorkers' in runtimeConfig ? runtimeConfig.numberOfWorkers : 0;
  const gpuConfig = runtimeConfig && 'gpuConfig' in runtimeConfig ? runtimeConfig.gpuConfig : {};
  const toolLabel = currentRuntimeDetails ? getToolLabelFromCloudEnv(currentRuntimeDetails) : undefined;
  return {
    hasGpu: computeConfig.hasGpu,
    autopauseThreshold: currentRuntimeDetails?.autopauseThreshold,
    computeConfig,
    currentRuntimeDetails,
    runtime: currentRuntimeDetails
      ? {
          cloudService,
          toolDockerImage: getImageUrlFromRuntime(currentRuntimeDetails),
          tool: toolLabel,
          region: computeConfig.computeRegion,
          persistentDiskAttached: !!(runtimeConfig && 'persistentDiskId' in runtimeConfig),
          ...(computeConfig.hasGpu && gpuConfig ? { gpuConfig } : {}),
          ...(currentRuntimeDetails?.jupyterUserScriptUri
            ? {
                jupyterUserScriptUri: currentRuntimeDetails?.jupyterUserScriptUri,
              }
            : {}),
          // TODO: this can use `runtimeTypes` conditionals for more safety
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

export interface DesiredEnvironmentParams {
  desiredRuntimeType: string;
  timeoutInMinutes: number | null;
  deleteDiskSelected: boolean;
  upgradeDiskSelected: boolean;
  jupyterUserScriptUri: string | undefined;
  isCustomSelectedImage: boolean;
  customImageUrl: string;
  selectedImage?: ComputeImage;
}

export const buildDesiredEnvironmentConfig = (
  currentRuntimeModalConfig: DesiredModalRuntimeConfig,
  viewMode: string,
  params: DesiredEnvironmentParams
): DesiredModalRuntimeConfig => {
  const {
    computeConfig,
    currentRuntimeDetails,
    runtime: existingRuntimeModalConfig,
    persistentDisk: currentPersistentDiskDetails,
  } = currentRuntimeModalConfig;
  const {
    desiredRuntimeType,
    timeoutInMinutes,
    deleteDiskSelected,
    upgradeDiskSelected,
    jupyterUserScriptUri,
    isCustomSelectedImage,
    customImageUrl,
    selectedImage,
  } = params;
  const cloudService: ComputeType = isDataproc(desiredRuntimeType) ? cloudServiceTypes.DATAPROC : cloudServiceTypes.GCE;
  const desiredNumberOfWorkers = isDataprocCluster(desiredRuntimeType) ? computeConfig.numberOfWorkers : 0;
  const gpuConfig = {
    gpuConfig: computeConfig.gpuEnabled ? { gpuType: computeConfig.gpuType, numOfGpus: computeConfig.numGpus } : {},
  };
  const toolLabel: ToolLabel | undefined = Utils.cond(
    [!!selectedImage?.toolLabel, () => selectedImage?.toolLabel],
    [!!currentRuntimeDetails, () => currentRuntimeDetails && getToolLabelFromCloudEnv(currentRuntimeDetails)],
    [Utils.DEFAULT, () => undefined]
  );

  return {
    hasGpu: computeConfig.hasGpu,
    autopauseThreshold: computeConfig.autopauseThreshold,
    computeConfig,
    currentRuntimeDetails,
    runtime: Utils.cond<NormalizedModalRuntime | undefined>(
      [
        viewMode !== 'deleteEnvironment',
        () => ({
          cloudService,
          toolDockerImage: isCustomSelectedImage ? customImageUrl : selectedImage?.url,
          tool: toolLabel,
          region: computeConfig.computeRegion,
          persistentDiskAttached: shouldUsePersistentDisk(
            desiredRuntimeType,
            currentRuntimeDetails,
            upgradeDiskSelected
          ),
          ...(computeConfig.gpuEnabled ? gpuConfig : {}),
          ...(jupyterUserScriptUri ? { jupyterUserScriptUri } : {}),
          ...(timeoutInMinutes ? { timeoutInMinutes } : {}),
          ...(cloudService === cloudServiceTypes.GCE
            ? {
                zone: computeConfig.computeZone,
                machineType:
                  computeConfig.masterMachineType ||
                  (!!currentRuntimeDetails &&
                    getDefaultMachineType(false, getToolLabelFromCloudEnv(currentRuntimeDetails))) ||
                  undefined,
                bootDiskSize:
                  !!currentRuntimeDetails &&
                  !!currentRuntimeDetails.runtimeConfig &&
                  'bootDiskSize' in currentRuntimeDetails.runtimeConfig
                    ? currentRuntimeDetails?.runtimeConfig.bootDiskSize
                    : defaultGceBootDiskSize,
                ...(shouldUsePersistentDisk(desiredRuntimeType, currentRuntimeDetails, upgradeDiskSelected)
                  ? {}
                  : {
                      diskSize: computeConfig.masterDiskSize,
                    }),
              }
            : {
                masterMachineType: computeConfig.masterMachineType || defaultDataprocMachineType,
                masterDiskSize: computeConfig.masterDiskSize,
                numberOfWorkers: desiredNumberOfWorkers,
                componentGatewayEnabled: computeConfig.componentGatewayEnabled,
                ...(desiredNumberOfWorkers && {
                  numberOfPreemptibleWorkers: computeConfig.numberOfPreemptibleWorkers,
                  workerMachineType: computeConfig.workerMachineType || defaultDataprocMachineType,
                  workerDiskSize: computeConfig.workerDiskSize,
                }),
              }),
        }),
      ],
      [!deleteDiskSelected || !!existingRuntimeModalConfig?.persistentDiskAttached, () => undefined],
      [Utils.DEFAULT, () => existingRuntimeModalConfig]
    ),
    persistentDisk: Utils.cond(
      [deleteDiskSelected, () => undefined],
      [
        viewMode !== 'deleteEnvironment' &&
          shouldUsePersistentDisk(desiredRuntimeType, currentRuntimeDetails, upgradeDiskSelected),
        () => ({ size: computeConfig.diskSize, diskType: computeConfig.diskType }),
      ],
      [Utils.DEFAULT, () => currentPersistentDiskDetails]
    ),
  };
};
