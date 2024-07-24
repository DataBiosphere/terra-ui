import { CloudContext } from '@terra-ui-packages/leonardo-data-client';
import _ from 'lodash/fp';
import { getAppStatusForDisplay } from 'src/analysis/utils/app-utils';
import {
  defaultDataprocWorkerDiskSize,
  defaultGceBootDiskSize,
  getCurrentAttachedDataDisk,
  getCurrentPersistentDisk,
} from 'src/analysis/utils/disk-utils';
import {
  dataprocCpuPrice,
  ephemeralExternalIpAddressPrice,
  machineTypes,
  regionToPrices,
} from 'src/analysis/utils/gce-machines';
import {
  defaultComputeRegion,
  defaultDataprocMachineType,
  defaultGceMachineType,
  findMachineType,
  getDisplayRuntimeStatus,
  isAzureContext,
} from 'src/analysis/utils/runtime-utils';
import { AppToolLabel, appToolLabels, appTools, RuntimeToolLabel, ToolLabel } from 'src/analysis/utils/tool-utils';
import { diskStatuses, LeoDiskStatus } from 'src/libs/ajax/leonardo/Disks';
import { App, appStatuses } from 'src/libs/ajax/leonardo/models/app-models';
import {
  GoogleRuntimeConfig,
  isAzureConfig,
  isDataprocConfig,
  isGceConfig,
  isGceRuntimeConfig,
  isGceWithPdConfig,
} from 'src/libs/ajax/leonardo/models/runtime-config-models';
import { Runtime, runtimeStatuses } from 'src/libs/ajax/leonardo/models/runtime-models';
import { GooglePdType, googlePdTypes, PersistentDisk } from 'src/libs/ajax/leonardo/providers/LeoDiskProvider';
import { getAzurePricesForRegion, getDiskType } from 'src/libs/azure-utils';
import * as Utils from 'src/libs/utils';
import { cloudProviderTypes } from 'src/workspaces/utils';

// GOOGLE COST METHODS begin

export const dataprocCost = (machineType: string, numInstances: number): number => {
  // console.log('dataprocCost', { machineType, numInstances });
  const { cpu: cpuPrice } = findMachineType(machineType);

  const total = cpuPrice * numInstances * dataprocCpuPrice;
  // console.log('dataprocCost', total);
  return total;
};

export const getHourlyCostForMachineType = (
  machineTypeName: string,
  region: string,
  isPreemptible: boolean
): number => {
  // console.log('getHourlyCostForMachineType', { machineTypeName, region, isPreemptible });
  const { cpu, memory } = _.find({ name: machineTypeName }, machineTypes) || { cpu: 0, memory: 0 };
  const {
    n1HourlyCpuPrice = 0,
    preemptibleN1HourlyCpuPrice = 0,
    n1HourlyGBRamPrice = 0,
    preemptibleN1HourlyGBRamPrice = 0,
  } = _.find({ name: _.toUpper(region) }, regionToPrices) || {};
  const total = isPreemptible
    ? cpu * preemptibleN1HourlyCpuPrice + memory * preemptibleN1HourlyGBRamPrice
    : cpu * n1HourlyCpuPrice + memory * n1HourlyGBRamPrice;
  // console.log('getHourlyCostForMachineType', total);
  return total;
};

export const getGpuCost = (gpuType: string, numGpus: number, region: string): number => {
  // console.log('getGpuCost', { gpuType, numGpus, region });
  const prices = _.find({ name: region }, regionToPrices) || {};
  // From a type like 'nvidia-tesla-t4', look up 't4HourlyPrice' in prices
  const price = prices[`${_.last(_.split('-', gpuType))}HourlyPrice`];
  const total = price * numGpus;
  // console.log('getGpuCost', total);
  return total;
};

// This function deals with runtimes that are paused
// All disks referenced in this function are boot disks (aka the disk google needs to provision by default for OS storage)
// The user pd cost for a runtime is calculated elsewhere
export const runtimeConfigBaseCost = (config: GoogleRuntimeConfig): number => {
  // console.log('runtimeConfigBaseCost', { config });
  if (!config) return 0;
  const computeRegion = config.normalizedRegion;

  const costForDataproc: number = isDataprocConfig(config)
    ? (config.masterDiskSize + config.numberOfWorkers * (config.workerDiskSize ?? defaultDataprocWorkerDiskSize)) *
        getPersistentDiskPriceForRegionHourly(computeRegion, googlePdTypes.standard) +
      dataprocCost(config.masterMachineType, 1) +
      dataprocCost(config.workerMachineType ?? defaultDataprocMachineType, config.numberOfWorkers)
    : 0;

  const costForGceWithoutUserDisk: number = isGceConfig(config)
    ? (config.bootDiskSize ?? defaultGceBootDiskSize) *
      getPersistentDiskPriceForRegionHourly(computeRegion, googlePdTypes.standard)
    : 0;

  const costForGceWithUserDisk: number = isGceWithPdConfig(config)
    ? config.bootDiskSize * getPersistentDiskPriceForRegionHourly(computeRegion, googlePdTypes.standard)
    : 0;
  const total = _.sum([costForDataproc, costForGceWithoutUserDisk, costForGceWithUserDisk]);
  // console.log('runtimeConfigBaseCost', total);
  return total;
};

export const runtimeConfigCost = (config: GoogleRuntimeConfig): number => {
  // console.log('runtimeConfigCost', { config });
  if (!config) return 0;
  const computeRegion = config.normalizedRegion;

  // TODO: Remove nested ternary to align with style guide
  // eslint-disable-next-line no-nested-ternary
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
          getPersistentDiskPriceForRegionHourly(computeRegion, googlePdTypes.standard),
        dataprocCost(config.workerMachineType!, config.numberOfPreemptibleWorkers ?? 0),
        ephemeralExternalIpAddressCost(config.numberOfWorkers, config.numberOfPreemptibleWorkers ?? 0),
      ])
    : 0;

  const gpuCost =
    isGceRuntimeConfig(config) && config.gpuConfig
      ? getGpuCost(config.gpuConfig.gpuType, config.gpuConfig.numOfGpus, computeRegion)
      : 0;

  const baseVmIpCost = ephemeralExternalIpAddressCost(1, 0);

  const itemCosts = [baseMachinePrice, additionalDataprocCost, gpuCost, baseVmIpCost, runtimeConfigBaseCost(config)];
  const total = _.sum(itemCosts);
  // console.log('runtimeConfigCost', total);
  return total;
};

// Per GB following https://cloud.google.com/compute/pricing
export const getPersistentDiskPriceForRegionMonthly = (computeRegion: string, diskType: GooglePdType): number => {
  // console.log('getPersistentDiskPriceForRegionMonthly', { computeRegion, diskType });
  if (!computeRegion || !diskType) return 0;
  const total = _.flow(
    _.find({ name: _.toUpper(computeRegion) }),
    _.get([diskType.regionToPricesName])
  )(regionToPrices);
  // console.log('getPersistentDiskPriceForRegionMonthly', total);
  return total;
};
const numberOfHoursPerMonth = 730;
export const getPersistentDiskPriceForRegionHourly = (computeRegion: string, diskType: GooglePdType): number => {
  // console.log('getPersistentDiskPriceForRegionHourly', { computeRegion, diskType });
  const total = getPersistentDiskPriceForRegionMonthly(computeRegion, diskType) / numberOfHoursPerMonth;
  // console.log('getPersistentDiskPriceForRegionHourly', total);
  return total;
};

export const ephemeralExternalIpAddressCost = (numStandardVms: number, numPreemptibleVms: number): number => {
  // console.log('ephemeralExternalIpAddressCost', { numStandardVms, numPreemptibleVms });
  if (!numStandardVms || !numPreemptibleVms) return 0;
  // Google categorizes a VM as 'standard' if it is not 'pre-emptible'.
  const total =
    numStandardVms * ephemeralExternalIpAddressPrice.standard +
    numPreemptibleVms * ephemeralExternalIpAddressPrice.preemptible;
  // console.log('ephemeralExternalIpAddressCost', total);
  return total;
};

export const getAppCost = (app: App, dataDisk: PersistentDisk): number => {
  // console.log('getAppCost', { app, dataDisk });
  const total = app && dataDisk && app.appType === appTools.GALAXY.label ? getGalaxyCost(app, dataDisk) : 0;
  // console.log('getAppCost', total);
  return total;
};

export const getGalaxyCost = (app: App, dataDisk: PersistentDisk): number => {
  // console.log('getGalaxyCost', { app, dataDisk });
  if (!app || !dataDisk) return 0;
  const total =
    getGalaxyDiskCost({
      size: dataDisk.size, // In GB
      diskType: dataDisk.diskType,
    }) + getGalaxyComputeCost(app);
  // console.log('getGalaxyCost', total);
  return total;
};

/*
 * - Default nodepool VMs always run and incur compute and external IP cost whereas app
 *   nodepool VMs incur compute and external IP cost only when an app is running.
 * - Default nodepool cost is shared across all Kubernetes cluster users. It would
 *   be complicated to calculate that shared cost dynamically. Therefore, we are being
 *   conservative by adding default nodepool cost to all apps on a cluster.
 */
export const getGalaxyComputeCost = (app: App): number => {
  // console.log('getGalaxyComputeCost', { app });
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

  const total = (() => {
    switch (appStatus) {
      case appStatuses.stopped.status:
        return staticCost;
      case appStatuses.deleting.status:
      case appStatuses.error.status:
        return 0.0;
      default:
        return staticCost + dynamicCost;
    }
  })();
  // console.log('getGalaxyComputeCost', total);
  return total;
};

/*
 * - Disk cost is incurred regardless of app status.
 * - Disk cost is total for data (NFS) disk, metadata (postgres) disk, and boot disks (1 boot disk per nodepool)
 * - Size of a data disk is user-customizable. The other disks have fixed sizes.
 */
export const getGalaxyDiskCost = (
  disk:
    | PersistentDisk
    | {
        size: number; // In GB
        diskType: GooglePdType;
      }
): number => {
  // console.log('getGalaxyDiskCost', { disk });
  if (!disk) return 0;
  const { size: dataDiskType, diskType } = disk;
  const metadataDiskSize = 10; // GB
  const defaultNodepoolBootDiskSize = 100; // GB
  const appNodepoolBootDiskSize = 100; // GB

  const total = getPersistentDiskCostHourly(
    {
      status: diskStatuses.ready.leoLabel,
      size: dataDiskType + metadataDiskSize + defaultNodepoolBootDiskSize + appNodepoolBootDiskSize,
      diskType,
      cloudContext: { cloudProvider: cloudProviderTypes.GCP, cloudResource: 'disk' },
    },
    defaultComputeRegion
  );
  // console.log('getGalaxyDiskCost', total);
  return total;
};

// end GOOGLE COST METHODS

// AZURE COST METHODS begin

export const getAzureComputeCostEstimate = ({
  region,
  machineType,
}: {
  region: string | null;
  machineType: string | null;
}): number => {
  // console.log('getAzureComputeCostEstimate', { runtimeConfig });
  if (!region || !machineType) return 0;
  const regionPriceObj = getAzurePricesForRegion(region) || {};
  const total = regionPriceObj[machineType];
  // console.log('getAzureComputeCostEstimate', total);
  return total;
};

export const getAzureDiskCostEstimate = ({
  region,
  persistentDiskSize,
}: {
  region: string;
  persistentDiskSize: number;
}): number => {
  // console.log('getAzureDiskCostEstimate', { region, persistentDiskSize });
  if (!region || !persistentDiskSize) return 0;
  const regionPriceObj = getAzurePricesForRegion(region) || {};
  const diskType = getDiskType(persistentDiskSize ?? persistentDiskSize);
  const total = diskType ? regionPriceObj[diskType] : 0;
  // console.log('getAzureDiskCostEstimate', total);
  return total;
};

// end AZURE COST METHODS

// COMMON METHODS begin

export const getPersistentDiskCostMonthly = (disk: PersistentDisk, computeRegion: string): number => {
  // console.log('getPersistentDiskCostMonthly', { disk, computeRegion });
  if (!disk || !computeRegion) return 0;
  const { cloudContext, diskType, size, status, zone } = disk;
  const total = _.includes(status, [diskStatuses.deleting.leoLabel, diskStatuses.failed.leoLabel])
    ? 0.0
    : Utils.cond(
        [
          cloudContext && isAzureContext(cloudContext),
          () => getAzureDiskCostEstimate({ region: zone, persistentDiskSize: size }),
        ],
        [Utils.DEFAULT, () => size * getPersistentDiskPriceForRegionMonthly(computeRegion, diskType)]
      );
  // console.log('getPersistentDiskCostMonthly', total);
  return total;
};

export const getPersistentDiskCostHourly = (
  disk: PersistentDisk | { size: number; status: LeoDiskStatus; diskType: GooglePdType; cloudContext?: CloudContext },
  computeRegion: string
): number => {
  // console.log('getPersistentDiskCostHourly', { disk, computeRegion });
  if (!disk || !computeRegion) return 0;
  const { size, status, diskType, cloudContext } = disk;
  const total = _.includes(status, [diskStatuses.deleting.leoLabel, diskStatuses.failed.leoLabel])
    ? 0.0
    : Utils.cond(
        [
          !!cloudContext && isAzureContext(cloudContext),
          () => getAzureDiskCostEstimate({ region: computeRegion, persistentDiskSize: size }) / numberOfHoursPerMonth,
        ],
        [Utils.DEFAULT, () => size * getPersistentDiskPriceForRegionHourly(computeRegion, diskType)]
      );
  // console.log('getPersistentDiskCostHourly', total);
  return total;
};

export const getRuntimeCost = (runtime: Runtime): number => {
  // console.log('getRuntimeCost', { runtime });
  if (!runtime) return 0;
  const { runtimeConfig, status } = runtime;
  if (isAzureConfig(runtimeConfig)) {
    const total = Utils.switchCase(
      status,
      [runtimeStatuses.stopped.leoLabel, () => 0.0],
      [runtimeStatuses.error.leoLabel, () => 0.0],
      [
        Utils.DEFAULT,
        () => getAzureComputeCostEstimate({ region: runtimeConfig.region, machineType: runtimeConfig.machineType }),
      ]
    );
    // console.log('getRuntimeCost', total);
    return total;
  }
  if (isGceRuntimeConfig(runtimeConfig) || isDataprocConfig(runtimeConfig)) {
    const total = Utils.switchCase(
      status,
      [runtimeStatuses.stopped.leoLabel, () => runtimeConfigBaseCost(runtimeConfig)],
      [runtimeStatuses.error.leoLabel, () => 0.0],
      [Utils.DEFAULT, () => runtimeConfigCost(runtimeConfig)]
    );
    // console.log('getRuntimeCost', total);
    return total;
  }
  throw new Error(`Unknown runtime config type ${runtimeConfig}`);
};

export const getCostForDisk = (
  app: App | undefined,
  appDataDisks: PersistentDisk[],
  computeRegion: string,
  currentRuntimeToolLabel: RuntimeToolLabel | ToolLabel | undefined,
  persistentDisks: PersistentDisk[],
  runtimes: Runtime[],
  toolLabel: ToolLabel
): number => {
  // console.log('getCostForDisk', {
  //   app,
  //   appDataDisks,
  //   computeRegion,
  //   currentRuntimeToolLabel,
  //   persistentDisks,
  //   runtimes,
  //   toolLabel,
  // });
  let diskCost = 0;
  const curPd: PersistentDisk | undefined =
    persistentDisks && persistentDisks.length > 0 ? getCurrentPersistentDisk(runtimes, persistentDisks) : undefined;

  if (curPd && isAzureDisk(curPd)) {
    return getAzureDiskCostEstimate({ region: computeRegion, persistentDiskSize: curPd.size }) / numberOfHoursPerMonth;
  }
  if (currentRuntimeToolLabel === toolLabel && persistentDisks && persistentDisks.length > 0) {
    const { size = 0, status = diskStatuses.ready.leoLabel, diskType = googlePdTypes.standard } = curPd || {};
    diskCost = getPersistentDiskCostHourly({ size, status, diskType }, computeRegion);
  } else if (app && appDataDisks && toolLabel === appToolLabels.GALAXY) {
    const currentDataDisk = getCurrentAttachedDataDisk(app, appDataDisks);
    // Occasionally currentDataDisk will be undefined on initial render.
    diskCost = currentDataDisk ? getGalaxyDiskCost(currentDataDisk) : 0;
  }
  const total = diskCost;
  // console.log('getCostForDisk', total);
  return total;
};

export const getCostDisplayForTool = (
  app: App | undefined,
  currentRuntime: Runtime | undefined,
  currentRuntimeToolLabel: RuntimeToolLabel | AppToolLabel | undefined,
  toolLabel: ToolLabel | undefined
): string => {
  // console.log('getCostDisplayForTool', { app, currentRuntime, currentRuntimeToolLabel, toolLabel });
  const text = Utils.cond(
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
  // console.log('getCostDisplayForTool', text);
  return text;
};

export const getCostDisplayForDisk = (
  app: App | undefined,
  appDataDisks: PersistentDisk[],
  computeRegion: string,
  currentRuntimeToolLabel: RuntimeToolLabel | ToolLabel | undefined,
  persistentDisks: PersistentDisk[],
  runtimes: Runtime[],
  toolLabel: ToolLabel
): string => {
  // console.log('getCostDisplayForDisk', {
  //   app,
  //   appDataDisks,
  //   computeRegion,
  //   currentRuntimeToolLabel,
  //   persistentDisks,
  //   runtimes,
  //   toolLabel,
  // });
  const diskCost = getCostForDisk(
    app,
    appDataDisks,
    computeRegion,
    currentRuntimeToolLabel,
    persistentDisks,
    runtimes,
    toolLabel
  );
  const text = diskCost ? `Disk ${Utils.formatUSD(diskCost)}/hr` : '';
  // console.log('getCostDisplayForDisk', text);
  return text;
};

const isAzureDisk = (persistentDisk: PersistentDisk) =>
  persistentDisk ? isAzureContext(persistentDisk.cloudContext) : false;

// end COMMON METHODS
