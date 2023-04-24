// TODO: type with disks
import _ from 'lodash/fp'
import { App } from 'src/libs/ajax/leonardo/models/app-models'
import {
  DecoratedPersistentDisk,
  diskStatuses,
  GoogleDiskType,
  PdType,
  pdTypes,
  PersistentDisk
} from 'src/libs/ajax/leonardo/models/disk-models'
import { Runtime } from 'src/libs/ajax/leonardo/models/runtime-models'
import * as Utils from 'src/libs/utils'
import { getCurrentAppIncludingDeleting, getDiskAppType } from 'src/pages/workspaces/workspace/analysis/utils/app-utils'
import { getCurrentRuntime } from 'src/pages/workspaces/workspace/analysis/utils/runtime-utils'
import { AppToolLabel, appTools } from 'src/pages/workspaces/workspace/analysis/utils/tool-utils'


export const pdTypeFromDiskType = (type: GoogleDiskType): PdType => Utils.switchCase(type,
  [pdTypes.standard.label, () => pdTypes.standard],
  [pdTypes.balanced.label, () => pdTypes.balanced],
  [pdTypes.ssd.label, () => pdTypes.ssd],
  [Utils.DEFAULT, () => console.error(`Invalid disk type: Should not be calling pdTypes.fromString for ${type}`)]
)
export const updatePdType = (disk: PersistentDisk): DecoratedPersistentDisk => ({ ...disk, diskType: pdTypeFromDiskType(disk.diskType) })
export const mapToPdTypes = (disks: PersistentDisk[]): DecoratedPersistentDisk[] => _.map(updatePdType, disks)
// Dataproc clusters don't have persistent disks.
export const defaultDataprocMasterDiskSize = 150
export const defaultDataprocWorkerDiskSize = 150
// Since Leonardo started supporting persistent disks (PDs) for GCE VMs, boot disk size for a GCE VM
// with a PD has been non-user-customizable. Terra UI uses the value below for cost estimate calculations only.
export const defaultGceBootDiskSize = 120
export const defaultGcePersistentDiskSize = 50
export const defaultPersistentDiskType = pdTypes.standard
export const getCurrentAttachedDataDisk = (app: App, appDataDisks: PersistentDisk[]): DecoratedPersistentDisk | undefined => {
  const currentDisk: PersistentDisk | undefined = _.find({ name: app?.diskName }, appDataDisks)
  return !!currentDisk ? updatePdType(currentDisk) : currentDisk
}

export const workspaceHasMultipleDisks = (disks: PersistentDisk[], diskAppType: AppToolLabel): boolean => {
  const appTypeDisks = _.filter(disk => getDiskAppType(disk) === diskAppType && disk.status !== 'Deleting', disks)
  const diskWorkspaces = _.map(currentDisk => currentDisk.labels.saturnWorkspaceName, appTypeDisks)
  return _.uniq(diskWorkspaces).length < diskWorkspaces.length
}
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
export const getCurrentAppDataDisk = (appType: AppToolLabel, apps: App[], appDataDisks: PersistentDisk[], workspaceName: string): DecoratedPersistentDisk | undefined => {
  // a user's PD can either be attached to their current app, detaching from a deleting app or unattached
  const currentApp = getCurrentAppIncludingDeleting(appType, apps)
  const currentDiskName = currentApp?.diskName
  const attachedDiskNames = _.without([undefined], _.map(app => app.diskName, apps))
  // If the disk is attached to an app (or being detached from a deleting app), return that disk. Otherwise,
  // return the newest unattached disk that was provisioned by the desired appType.

  const filteredDisks: PersistentDisk[] = _.filter((disk: PersistentDisk) => getDiskAppType(disk) === appType && disk.status !== 'Deleting' && !_.includes(disk.name, attachedDiskNames) &&
      disk.labels.saturnWorkspaceName === workspaceName, appDataDisks)
  const sortedDisks: PersistentDisk[] = _.sortBy('auditInfo.createdDate', filteredDisks)

  const newestUnattachedDisk: PersistentDisk | undefined = _.last(sortedDisks)
  const attachedDisk: PersistentDisk | undefined = !!currentDiskName ? _.find({ name: currentDiskName }, appDataDisks) : undefined

  return Utils.cond(
    [!!attachedDisk, () => !!attachedDisk && updatePdType(attachedDisk)],
    [!!newestUnattachedDisk, () => !!newestUnattachedDisk && updatePdType(newestUnattachedDisk)],
    [Utils.DEFAULT, () => undefined]
  )
}
/**
 * Given the list of runtimes, returns the persistent disk attached to
 * the current runtime.
 * @param {runtime[]} runtimes List of runtimes.
 * @param {persistentDisk[]} persistentDisks List of persistent disks.
 * @returns persistentDisk attached to the currentRuntime.
 */
//TODO: can this just take current runtime>runtimes?
// what is the significance of of the filter on ` !_.includes(id, attachedIds)`?
export const getCurrentPersistentDisk = (runtimes: Runtime[], persistentDisks: PersistentDisk[]): PersistentDisk | undefined => {
  const currentRuntime = getCurrentRuntime(runtimes)
  const id: number | undefined = _.get('persistentDiskId', currentRuntime?.runtimeConfig)
  const attachedIds: number[] = _.without([undefined], _.map(runtime => _.get('persistentDiskId', runtime.runtimeConfig), runtimes))

  return id ?
    _.find({ id }, persistentDisks) :
    _.last(_.sortBy('auditInfo.createdDate', _.filter(({ id, status }) => status !== 'Deleting' && !_.includes(id, attachedIds), persistentDisks)))
}

export const getReadyPersistentDisk = (persistentDisks: PersistentDisk[]): PersistentDisk | undefined => {
  // returns persistent disk if one exists and is in ready status
  const disk = persistentDisks ? persistentDisks[0] : undefined
  return disk ? (disk.status === diskStatuses.ready.leoLabel ? disk : undefined) : undefined
}

export const isCurrentGalaxyDiskDetaching = (apps: App[]): boolean => {
  const currentGalaxyApp = getCurrentAppIncludingDeleting(appTools.GALAXY.label, apps)
  return !!currentGalaxyApp && _.includes(currentGalaxyApp.status, ['DELETING', 'PREDELETING'])
}
