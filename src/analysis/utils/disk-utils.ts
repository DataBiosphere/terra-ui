// TODO: type with disks
import _ from 'lodash/fp';
import { getCurrentAppIncludingDeleting, getDiskAppType } from 'src/analysis/utils/app-utils';
import { getCurrentRuntime } from 'src/analysis/utils/runtime-utils';
import { AppToolLabel, appTools } from 'src/analysis/utils/tool-utils';
import { App } from 'src/libs/ajax/leonardo/models/app-models';
import {
  DecoratedPersistentDisk,
  diskStatuses,
  GoogleDiskType,
  GooglePdType,
  googlePdTypes,
  PersistentDisk,
} from 'src/libs/ajax/leonardo/models/disk-models';
import { Runtime } from 'src/libs/ajax/leonardo/models/runtime-models';
import * as Utils from 'src/libs/utils';

export const pdTypeFromDiskType = (type: GoogleDiskType): GooglePdType =>
  Utils.switchCase(
    type,
    [googlePdTypes.standard.value, () => googlePdTypes.standard],
    [googlePdTypes.balanced.value, () => googlePdTypes.balanced],
    [googlePdTypes.ssd.value, () => googlePdTypes.ssd],
    [
      Utils.DEFAULT,
      () => {
        console.error(`Invalid disk type: Should not be calling googlePdTypes.fromString for ${JSON.stringify(type)}`);
        return undefined;
      },
    ]
    /**
     * TODO: Remove cast
     * "Log error and return undefined" for unexpected cases looks to be a pattern.
     * However, the possible undefined isn't handled because the return type does not include undefined).
     * Type safety could be improved by throwing an error for unexpected inputs.
     * That would ensure that the return type is GooglePdType instead of GooglePdType | undefined.
     */
  ) as GooglePdType; // TODO: Remove cast

export const updatePdType = (disk: PersistentDisk): DecoratedPersistentDisk => ({
  ...disk,
  diskType: pdTypeFromDiskType(disk.diskType),
});
export const mapToPdTypes = (disks: PersistentDisk[]): DecoratedPersistentDisk[] => _.map(updatePdType, disks);

export const undecoratePd = (disk: DecoratedPersistentDisk): PersistentDisk => ({
  ...disk,
  diskType: disk.diskType.value,
});

export const mapToUndecoratedPds = (disks: DecoratedPersistentDisk[]): PersistentDisk[] => _.map(undecoratePd, disks);

// Dataproc clusters don't have persistent disks.
export const defaultDataprocMasterDiskSize = 150;
export const defaultDataprocWorkerDiskSize = 150;
// Since Leonardo started supporting persistent disks (PDs) for GCE VMs, boot disk size for a GCE VM
// with a PD has been non-user-customizable. Terra UI uses the value below for cost estimate calculations only.
export const defaultGceBootDiskSize = 120;
export const defaultGcePersistentDiskSize = 50;
export const defaultPersistentDiskType = googlePdTypes.standard;
export const getCurrentAttachedDataDisk = (
  app: App,
  appDataDisks: PersistentDisk[]
): DecoratedPersistentDisk | undefined => {
  const currentDisk: PersistentDisk | undefined =
    !!app && app.diskName === null ? undefined : appDataDisks.find(({ name }) => app.diskName === name);
  return currentDisk ? updatePdType(currentDisk) : currentDisk;
};

export const workspaceHasMultipleDisks = (disks: DecoratedPersistentDisk[], diskAppType: AppToolLabel): boolean => {
  const appTypeDisks = _.filter((disk) => getDiskAppType(disk) === diskAppType && disk.status !== 'Deleting', disks);
  const diskWorkspaces = _.map((currentDisk) => currentDisk.labels.saturnWorkspaceName, appTypeDisks);
  return _.uniq(diskWorkspaces).length < diskWorkspaces.length;
};
/**
 * A function to get the current app data disk from the list of appDataDisks and apps
 * for the passed in appType for the passed in workspace name.
 *
 * @param {string} appType App type to retrieve app data disk for
 * @param {App[]} apps List of apps in the current workspace
 * @param {AppDataDisk[]} appDataDisks List of appDataDisks in the workspace
 * @param {string} workspaceName Name of the workspace
 * @returns The appDataDisk from appDataDisks attached to the appType
 */
export const getCurrentAppDataDisk = (
  appType: AppToolLabel,
  apps: App[],
  appDataDisks: PersistentDisk[],
  workspaceName: string
): DecoratedPersistentDisk | undefined => {
  // a user's PD can either be attached to their current app, detaching from a deleting app or unattached
  const currentApp = getCurrentAppIncludingDeleting(appType, apps);
  const currentDiskName = currentApp?.diskName;
  const attachedDiskNames = _.without(
    [undefined],
    _.map((app) => app.diskName, apps)
  );
  // If the disk is attached to an app (or being detached from a deleting app), return that disk. Otherwise,
  // return the newest unattached disk that was provisioned by the desired appType.

  const filteredDisks: PersistentDisk[] = _.filter(
    (disk: PersistentDisk) =>
      getDiskAppType(disk) === appType &&
      disk.status !== 'Deleting' &&
      !_.includes(disk.name, attachedDiskNames) &&
      disk.labels.saturnWorkspaceName === workspaceName,
    appDataDisks
  );
  const sortedDisks: PersistentDisk[] = _.sortBy('auditInfo.createdDate', filteredDisks);

  const newestUnattachedDisk: PersistentDisk | undefined = _.last(sortedDisks);
  const attachedDisk: PersistentDisk | undefined = currentDiskName
    ? _.find({ name: currentDiskName }, appDataDisks)
    : undefined;

  return Utils.cond(
    [!!attachedDisk, () => !!attachedDisk && updatePdType(attachedDisk)],
    [!!newestUnattachedDisk, () => !!newestUnattachedDisk && updatePdType(newestUnattachedDisk)],
    [Utils.DEFAULT, () => undefined]
  );
};
/**
 * Given the list of runtimes, returns the persistent disk attached to
 * the current runtime.
 * @param {runtime[]} runtimes List of runtimes.
 * @param {persistentDisk[]} persistentDisks List of persistent disks.
 * @returns persistentDisk attached to the currentRuntime.
 */
// TODO: can this just take current runtime>runtimes?
// what is the significance of of the filter on ` !_.includes(id, attachedIds)`?
export const getCurrentPersistentDisk = (
  runtimes: Runtime[],
  persistentDisks: PersistentDisk[]
): PersistentDisk | undefined => {
  const currentRuntime = getCurrentRuntime(runtimes);
  const id: number | undefined = _.get('persistentDiskId', currentRuntime?.runtimeConfig);
  const attachedIds: number[] = _.without(
    [undefined],
    _.map((runtime) => _.get('persistentDiskId', runtime.runtimeConfig), runtimes)
  );

  return id
    ? _.find({ id }, persistentDisks)
    : _.last(
        _.sortBy(
          'auditInfo.createdDate',
          _.filter(({ id, status }) => status !== 'Deleting' && !_.includes(id, attachedIds), persistentDisks)
        )
      );
};

export const getReadyPersistentDisk = (persistentDisks: PersistentDisk[]): PersistentDisk | undefined => {
  // returns PD if one exists and is in ready status
  return persistentDisks.find((disk) => disk.status === diskStatuses.ready.leoLabel);
};

export const isCurrentGalaxyDiskDetaching = (apps: App[]): boolean => {
  const currentGalaxyApp = getCurrentAppIncludingDeleting(appTools.GALAXY.label, apps);
  return !!currentGalaxyApp && _.includes(currentGalaxyApp.status, ['DELETING', 'PREDELETING']);
};
