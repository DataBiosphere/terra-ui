import _ from 'lodash/fp';
import { dataprocCpuPrice, ephemeralExternalIpAddressPrice, machineTypes, regionToPrices } from 'src/data/gce-machines';
import { App, appStatuses } from 'src/libs/ajax/leonardo/models/app-models';
import { CloudContext } from 'src/libs/ajax/leonardo/models/core-models';
import {
  DecoratedPersistentDisk,
  diskStatuses,
  isUndecoratedPersistentDisk,
  LeoDiskStatus,
  PdType,
  pdTypes,
  PersistentDisk,
} from 'src/libs/ajax/leonardo/models/disk-models';
import {
  AzureConfig,
  GoogleRuntimeConfig,
  isAzureConfig,
  isDataprocConfig,
  isGceConfig,
  isGceRuntimeConfig,
  isGceWithPdConfig,
} from 'src/libs/ajax/leonardo/models/runtime-config-models';
import { Runtime, runtimeStatuses } from 'src/libs/ajax/leonardo/models/runtime-models';
import { getAzurePricesForRegion, getDiskType } from 'src/libs/azure-utils';
import * as Utils from 'src/libs/utils';
import { cloudProviderTypes } from 'src/libs/workspace-utils';
import { getAppStatusForDisplay } from 'src/pages/workspaces/workspace/analysis/utils/app-utils';
import {
  defaultDataprocWorkerDiskSize,
  defaultGceBootDiskSize,
  getCurrentAttachedDataDisk,
  getCurrentPersistentDisk,
  updatePdType,
} from 'src/pages/workspaces/workspace/analysis/utils/disk-utils';
import {
  defaultComputeRegion,
  defaultDataprocMachineType,
  defaultGceMachineType,
  findMachineType,
  getDisplayRuntimeStatus,
  getNormalizedComputeRegion,
  isAzureContext,
} from 'src/pages/workspaces/workspace/analysis/utils/runtime-utils';
import {
  appToolLabels,
  appTools,
  RuntimeToolLabel,
  runtimeToolLabels,
  ToolLabel,
} from 'src/pages/workspaces/workspace/analysis/utils/tool-utils';

// GOOGLE COST METHODS begin

export const dataprocCost = (machineType: string, numInstances: number): number => {
  const { cpu: cpuPrice } = findMachineType(machineType);

  return cpuPrice * numInstances * dataprocCpuPrice;
};

export const getHourlyCostForMachineType = (
  machineTypeName: string,
  region: string,
  isPreemptible: boolean
): number => {
  const { cpu, memory } = _.find({ name: machineTypeName }, machineTypes) || { cpu: 0, memory: 0 };
  const {
    n1HourlyCpuPrice = 0,
    preemptibleN1HourlyCpuPrice = 0,
    n1HourlyGBRamPrice = 0,
    preemptibleN1HourlyGBRamPrice = 0,
  } = _.find({ name: _.toUpper(region) }, regionToPrices) || {};
  return isPreemptible
    ? cpu * preemptibleN1HourlyCpuPrice + memory * preemptibleN1HourlyGBRamPrice
    : cpu * n1HourlyCpuPrice + memory * n1HourlyGBRamPrice;
};

export const getGpuCost = (gpuType: string, numGpus: number, region: string): number => {
  const prices = _.find({ name: region }, regionToPrices) || {};
  // From a type like 'nvidia-tesla-t4', look up 't4HourlyPrice' in prices
  const price = prices[`${_.last(_.split('-', gpuType))}HourlyPrice`];
  return price * numGpus;
};

// This function deals with runtimes that are paused
// All disks referenced in this function are boot disks (aka the disk google needs to provision by default for OS storage)
// The user pd cost for a runtime is calculated elsewhere
export const runtimeConfigBaseCost = (config: GoogleRuntimeConfig): number => {
  if (!config) return 0;
  const computeRegion = getNormalizedComputeRegion(config);

  const costForDataproc: number = isDataprocConfig(config)
    ? (config.masterDiskSize + config.numberOfWorkers * (config.workerDiskSize ?? defaultDataprocWorkerDiskSize)) *
        getPersistentDiskPriceForRegionHourly(computeRegion, pdTypes.standard) +
      dataprocCost(config.masterMachineType, 1) +
      dataprocCost(config.workerMachineType ?? defaultDataprocMachineType, config.numberOfWorkers)
    : 0;

  const costForGceWithoutUserDisk: number = isGceConfig(config)
    ? (config.bootDiskSize ?? defaultGceBootDiskSize) *
      getPersistentDiskPriceForRegionHourly(computeRegion, pdTypes.standard)
    : 0;

  const costForGceWithUserDisk: number = isGceWithPdConfig(config)
    ? config.bootDiskSize * getPersistentDiskPriceForRegionHourly(computeRegion, pdTypes.standard)
    : 0;
  return _.sum([costForDataproc, costForGceWithoutUserDisk, costForGceWithUserDisk]);
};

export const runtimeConfigCost = (config: GoogleRuntimeConfig): number => {
  if (!config) return 0;
  const computeRegion = getNormalizedComputeRegion(config);

  const machineType: string = isGceRuntimeConfig(config)
    ? config.machineType
    : isDataprocConfig(config)
    ? config.masterMachineType
    : defaultGceMachineType;

  const baseMachinePrice: number = getHourlyCostForMachineType(machineType, computeRegion, false);

  const additionalDataprocCost: number = isDataprocConfig(config)
    ? _.sum([
        config.numberOfWorkers > 0
          ? config.numberOfWorkers *
            getHourlyCostForMachineType(config.workerMachineType ?? defaultDataprocMachineType, computeRegion, false)
          : 0,
        (config.numberOfPreemptibleWorkers ?? 0) *
          getHourlyCostForMachineType(config.workerMachineType ?? defaultDataprocMachineType, computeRegion, true),
        (config.numberOfPreemptibleWorkers ?? 0) *
          (config.workerDiskSize ?? 0) *
          getPersistentDiskPriceForRegionHourly(computeRegion, pdTypes.standard),
        dataprocCost(config.workerMachineType!, config.numberOfPreemptibleWorkers ?? 0),
        ephemeralExternalIpAddressCost(config.numberOfWorkers, config.numberOfPreemptibleWorkers ?? 0),
      ])
    : 0;

  const gpuCost =
    isGceRuntimeConfig(config) && config.gpuConfig
      ? getGpuCost(config.gpuConfig.gpuType, config.gpuConfig.numOfGpus, computeRegion)
      : 0;

  const baseVmIpCost = ephemeralExternalIpAddressCost(1, 0);

  return _.sum([baseMachinePrice, additionalDataprocCost, gpuCost, baseVmIpCost, runtimeConfigBaseCost(config)]);
};

// Per GB following https://cloud.google.com/compute/pricing
export const getPersistentDiskPriceForRegionMonthly = (computeRegion: string, diskType: PdType): number => {
  if (!computeRegion || !diskType) return 0;
  return _.flow(_.find({ name: _.toUpper(computeRegion) }), _.get([diskType.regionToPricesName]))(regionToPrices);
};
const numberOfHoursPerMonth = 730;
export const getPersistentDiskPriceForRegionHourly = (computeRegion: string, diskType: PdType): number =>
  getPersistentDiskPriceForRegionMonthly(computeRegion, diskType) / numberOfHoursPerMonth;

export const ephemeralExternalIpAddressCost = (numStandardVms: number, numPreemptibleVms: number): number => {
  if (!numStandardVms || !numPreemptibleVms) return 0;
  // Google categorizes a VM as 'standard' if it is not 'pre-emptible'.
  return (
    numStandardVms * ephemeralExternalIpAddressPrice.standard +
    numPreemptibleVms * ephemeralExternalIpAddressPrice.preemptible
  );
};

export const getAppCost = (app: App, dataDisk: DecoratedPersistentDisk): number =>
  app && dataDisk && app.appType === appTools.GALAXY.label ? getGalaxyCost(app, dataDisk) : 0;

export const getGalaxyCost = (app: App, dataDisk: DecoratedPersistentDisk): number => {
  if (!app || !dataDisk) return 0;
  return (
    getGalaxyDiskCost({
      size: dataDisk.size, // In GB
      diskType: dataDisk.diskType,
    }) + getGalaxyComputeCost(app)
  );
};

/*
 * - Default nodepool VMs always run and incur compute and external IP cost whereas app
 *   nodepool VMs incur compute and external IP cost only when an app is running.
 * - Default nodepool cost is shared across all Kubernetes cluster users. It would
 *   be complicated to calculate that shared cost dynamically. Therefore, we are being
 *   conservative by adding default nodepool cost to all apps on a cluster.
 */
export const getGalaxyComputeCost = (app: App): number => {
  if (!app) return 0;
  const appStatus = app?.status;
  // Galaxy uses defaultComputeRegion because we're not yet enabling other locations for Galaxy apps.
  const defaultNodepoolComputeCost = getHourlyCostForMachineType(defaultGceMachineType, defaultComputeRegion, false);
  const defaultNodepoolIpAddressCost = ephemeralExternalIpAddressCost(1, 0);

  const staticCost = defaultNodepoolComputeCost + defaultNodepoolIpAddressCost;
  const dynamicCost =
    app.kubernetesRuntimeConfig.numNodes *
      getHourlyCostForMachineType(app.kubernetesRuntimeConfig.machineType, defaultComputeRegion, false) +
    ephemeralExternalIpAddressCost(app.kubernetesRuntimeConfig.numNodes, 0);

  switch (appStatus) {
    case appStatuses.stopped.status:
      return staticCost;
    case appStatuses.deleting.status:
    case appStatuses.error.status:
      return 0.0;
    default:
      return staticCost + dynamicCost;
  }
};

/*
 * - Disk cost is incurred regardless of app status.
 * - Disk cost is total for data (NFS) disk, metadata (postgres) disk, and boot disks (1 boot disk per nodepool)
 * - Size of a data disk is user-customizable. The other disks have fixed sizes.
 */
export const getGalaxyDiskCost = (
  disk:
    | DecoratedPersistentDisk
    | {
        size: number; // In GB
        diskType: PdType;
      }
): number => {
  if (!disk) return 0;
  const { size: dataDiskType, diskType } = disk;
  const metadataDiskSize = 10; // GB
  const defaultNodepoolBootDiskSize = 100; // GB
  const appNodepoolBootDiskSize = 100; // GB

  return getPersistentDiskCostHourly(
    {
      status: diskStatuses.ready.leoLabel,
      size: dataDiskType + metadataDiskSize + defaultNodepoolBootDiskSize + appNodepoolBootDiskSize,
      diskType,
      cloudContext: { cloudProvider: cloudProviderTypes.GCP, cloudResource: 'disk' },
    },
    defaultComputeRegion
  );
};

// end GOOGLE COST METHODS

// AZURE COST METHODS begin

export const getAzureComputeCostEstimate = (runtimeConfig: AzureConfig): number => {
  if (!runtimeConfig) return 0;
  const { region, machineType } = runtimeConfig;
  const regionPriceObj = getAzurePricesForRegion(region) || {};
  const cost = regionPriceObj[machineType];
  return cost;
};

export const getAzureDiskCostEstimate = ({ region, diskSize }: { region: string; diskSize: number }): number => {
  if (!region || !diskSize) return 0;
  const regionPriceObj = getAzurePricesForRegion(region) || {};
  const diskType = getDiskType(diskSize ?? diskSize);
  const cost = regionPriceObj[diskType];
  return cost;
};

// end AZURE COST METHODS

// COMMON METHODS begin

export const getPersistentDiskCostMonthly = (disk: DecoratedPersistentDisk, computeRegion: string): number => {
  if (!disk || !computeRegion) return 0;
  const { cloudContext, diskType, size, status, zone } = disk;
  let price = 0.0;
  price = _.includes(status, [diskStatuses.deleting.leoLabel, diskStatuses.failed.leoLabel])
    ? 0.0
    : Utils.cond(
        [
          cloudContext && isAzureContext(cloudContext),
          () => getAzureDiskCostEstimate({ region: zone, diskSize: size }),
        ],
        [Utils.DEFAULT, () => size * getPersistentDiskPriceForRegionMonthly(computeRegion, diskType)]
      );
  return price;
};
export const getPersistentDiskCostHourly = (
  disk:
    | DecoratedPersistentDisk
    | { size: number; status: LeoDiskStatus; diskType: PdType; cloudContext?: CloudContext },
  computeRegion: string
): number => {
  if (!disk || !computeRegion) return 0;
  const { size, status, diskType, cloudContext } = disk;
  let price = 0.0;
  price = _.includes(status, [diskStatuses.deleting.leoLabel, diskStatuses.failed.leoLabel])
    ? 0.0
    : Utils.cond(
        [
          cloudContext && isAzureContext(cloudContext),
          () => getAzureDiskCostEstimate({ region: computeRegion, diskSize: size }) / numberOfHoursPerMonth,
        ],
        [Utils.DEFAULT, () => size * getPersistentDiskPriceForRegionHourly(computeRegion, diskType)]
      );
  return price;
};

export const getRuntimeCost = (runtime: Runtime): number => {
  if (!runtime) return 0;
  const { runtimeConfig, status } = runtime;
  if (isAzureConfig(runtimeConfig)) {
    return Utils.switchCase(
      status,
      [runtimeStatuses.stopped.leoLabel, () => 0.0],
      [runtimeStatuses.error.leoLabel, () => 0.0],
      [Utils.DEFAULT, () => getAzureComputeCostEstimate(runtimeConfig)]
    );
  }
  if (isGceRuntimeConfig(runtimeConfig) || isDataprocConfig(runtimeConfig)) {
    return Utils.switchCase(
      status,
      [runtimeStatuses.stopped.leoLabel, () => runtimeConfigBaseCost(runtimeConfig)],
      [runtimeStatuses.error.leoLabel, () => 0.0],
      [Utils.DEFAULT, () => runtimeConfigCost(runtimeConfig)]
    );
  }
  throw new Error(`Unknown runtime config type ${runtimeConfig}`);
};

export const getCostForDisk = (
  app: App | undefined,
  appDataDisks: PersistentDisk[],
  computeRegion: string,
  currentRuntimeToolLabel: RuntimeToolLabel,
  persistentDisks: PersistentDisk[],
  runtimes: Runtime[],
  toolLabel: ToolLabel
): number => {
  let diskCost = 0;
  const rawPd = persistentDisks && persistentDisks.length && getCurrentPersistentDisk(runtimes, persistentDisks);
  const curPd =
    rawPd &&
    rawPd.diskType &&
    (isUndecoratedPersistentDisk(rawPd)
      ? updatePdType(rawPd)
      : updatePdType({ ...rawPd, diskType: rawPd.diskType.label }));

  if (curPd && isAzureDisk(curPd)) {
    return getAzureDiskCostEstimate({ region: computeRegion, diskSize: curPd.size }) / numberOfHoursPerMonth;
  }
  if (currentRuntimeToolLabel === toolLabel && persistentDisks && persistentDisks.length) {
    const { size = 0, status = diskStatuses.ready.leoLabel, diskType = pdTypes.standard } = curPd || {};
    diskCost = getPersistentDiskCostHourly({ size, status, diskType }, computeRegion);
  } else if (app && appDataDisks && toolLabel === appToolLabels.GALAXY) {
    const currentDataDisk = getCurrentAttachedDataDisk(app, appDataDisks);
    // Occasionally currentDataDisk will be undefined on initial render.
    diskCost = currentDataDisk ? getGalaxyDiskCost(currentDataDisk) : 0;
  }
  return diskCost;
};

export const getCostDisplayForTool = (
  app: App | undefined,
  currentRuntime: Runtime | undefined,
  currentRuntimeToolLabel: RuntimeToolLabel | undefined,
  toolLabel: ToolLabel | undefined
): string => {
  return Utils.cond(
    [
      toolLabel === appToolLabels.GALAXY,
      () => (app ? `${getAppStatusForDisplay(app.status)} ${Utils.formatUSD(getGalaxyComputeCost(app))}/hr` : ''),
    ],
    [toolLabel === appToolLabels.CROMWELL, () => ''], // We will determine what to put here later
    [
      toolLabel === currentRuntimeToolLabel,
      () =>
        currentRuntime
          ? `${getDisplayRuntimeStatus(currentRuntime.status)} ${Utils.formatUSD(getRuntimeCost(currentRuntime))}/hr`
          : '',
    ],
    [Utils.DEFAULT, () => '']
  );
};

export const getCostDisplayForDisk = (
  app: App | undefined,
  appDataDisks: PersistentDisk[],
  computeRegion: string,
  currentRuntimeToolLabel: RuntimeToolLabel,
  persistentDisks: PersistentDisk[],
  runtimes: Runtime[],
  toolLabel: ToolLabel
): string => {
  const diskCost = getCostForDisk(
    app,
    appDataDisks,
    computeRegion,
    currentRuntimeToolLabel,
    persistentDisks,
    runtimes,
    toolLabel
  );
  return diskCost ? `Disk ${Utils.formatUSD(diskCost)}/hr` : '';
};

const isAzureDisk = (persistentDisk: PersistentDisk | DecoratedPersistentDisk) =>
  persistentDisk ? isAzureContext(persistentDisk.cloudContext) : false;

// end COMMON METHODS
