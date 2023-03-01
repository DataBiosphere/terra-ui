// TODO: type with disks
import _ from 'lodash/fp'
import * as Utils from 'src/libs/utils'
import { getCurrentAppIncludingDeleting, getDiskAppType } from 'src/pages/workspaces/workspace/analysis/utils/app-utils'
import { getCurrentRuntime } from 'src/pages/workspaces/workspace/analysis/utils/runtime-utils'
import { appTools } from 'src/pages/workspaces/workspace/analysis/utils/tool-utils'


export const pdTypes = {
  standard: {
    label: 'pd-standard',
    displayName: 'Standard',
    regionToPricesName: 'monthlyStandardDiskPrice'
  },
  balanced: {
    label: 'pd-balanced',
    displayName: 'Balanced',
    regionToPricesName: 'monthlyBalancedDiskPrice'
  },
  ssd: {
    label: 'pd-ssd',
    displayName: 'Solid state drive (SSD)',
    regionToPricesName: 'monthlySSDDiskPrice'
  },
  fromString: str => Utils.switchCase(str,
    [pdTypes.standard.label, () => pdTypes.standard],
    [pdTypes.balanced.label, () => pdTypes.balanced],
    [pdTypes.ssd.label, () => pdTypes.ssd],
    [Utils.DEFAULT, () => console.error(`Invalid disk type: Should not be calling pdTypes.fromString for ${str}`)]
  )
}
export const updatePdType = disk => disk && _.update('diskType', pdTypes.fromString, disk)
export const mapToPdTypes = _.map(updatePdType)
// Dataproc clusters don't have persistent disks.
export const defaultDataprocMasterDiskSize = 150
export const defaultDataprocWorkerDiskSize = 150
// Since Leonardo started supporting persistent disks (PDs) for GCE VMs, boot disk size for a GCE VM
// with a PD has been non-user-customizable. Terra UI uses the value below for cost estimate calculations only.
export const defaultGceBootDiskSize = 120
export const defaultGcePersistentDiskSize = 50
export const defaultPersistentDiskType = pdTypes.standard
export const getCurrentAttachedDataDisk = (app, appDataDisks) => {
  return updatePdType(_.find({ name: app?.diskName }, appDataDisks))
}
export const workspaceHasMultipleDisks = (disks, diskAppType) => {
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
export const getCurrentAppDataDisk = (appType, apps, appDataDisks, workspaceName) => {
  // a user's PD can either be attached to their current app, detaching from a deleting app or unattached
  const currentApp = getCurrentAppIncludingDeleting(appType, apps)
  const currentDiskName = currentApp?.diskName
  const attachedDiskNames = _.without([undefined], _.map(app => app.diskName, apps))
  // If the disk is attached to an app (or being detached from a deleting app), return that disk. Otherwise,
  // return the newest unattached disk that was provisioned by the desired appType.

  return updatePdType(!!currentDiskName ?
    _.find({ name: currentDiskName }, appDataDisks) :
    _.flow(
      _.filter(disk => getDiskAppType(disk) === appType && disk.status !== 'Deleting' && !_.includes(disk.name, attachedDiskNames) &&
        disk.labels.saturnWorkspaceName === workspaceName),
      _.sortBy('auditInfo.createdDate'),
      _.last
    )(appDataDisks))
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
export const getCurrentPersistentDisk = (runtimes, persistentDisks) => {
  const currentRuntime = getCurrentRuntime(runtimes)
  const id = currentRuntime?.runtimeConfig.persistentDiskId
  const attachedIds = _.without([undefined], _.map(runtime => runtime.runtimeConfig.persistentDiskId, runtimes))

  return id ?
    _.find({ id }, persistentDisks) :
    _.last(_.sortBy('auditInfo.createdDate', _.filter(({ id, status }) => status !== 'Deleting' && !_.includes(id, attachedIds), persistentDisks)))
}
export const isCurrentGalaxyDiskDetaching = apps => {
  const currentGalaxyApp = getCurrentAppIncludingDeleting(appTools.GALAXY.label, apps)
  return currentGalaxyApp && _.includes(currentGalaxyApp.status, ['DELETING', 'PREDELETING'])
}
