import _ from 'lodash/fp'
import { App, AppStatus } from 'src/libs/ajax/leonardo/models/app-models'
import { PersistentDisk } from 'src/libs/ajax/leonardo/models/disk-models'
import { allAppTypes, AppToolLabel } from 'src/pages/workspaces/workspace/analysis/utils/tool-utils'


const getCurrentAppExcludingStatuses = (appType: AppToolLabel, statuses: AppStatus[], apps: App[]): App | undefined => _.flow(
  _.filter({ appType }),
  _.remove((app: App) => _.includes(app.status, statuses)),
  _.sortBy('auditInfo.createdDate'),
  _.last
)(apps)

export const getCurrentApp = (appType: AppToolLabel, apps: App[]): App | undefined => getCurrentAppExcludingStatuses(appType, ['DELETING'], apps)
export const getCurrentAppIncludingDeleting = (appType: AppToolLabel, apps: App[]): App | undefined => getCurrentAppExcludingStatuses(appType, [], apps)

// If the disk was attached to an app, return the appType. Otherwise return undefined.
export const getDiskAppType = (disk: PersistentDisk): AppToolLabel | undefined => {
  const saturnApp = disk.labels.saturnApplication
  // Do a case-insensitive match as disks have been created with both "galaxy" and "GALAXY".
  const appType = _.find(type => type.toLowerCase() === saturnApp?.toLowerCase(), allAppTypes)
  return appType
}

export const workspaceHasMultipleApps = (apps: App[], appType: AppToolLabel): boolean => {
  const appsByType = _.filter(currentApp => currentApp.appType === appType && !_.includes(currentApp.status, ['DELETING', 'PREDELETING']), apps)
  const appWorkspaces = _.map(currentApp => currentApp.labels.saturnWorkspaceName, appsByType)
  return _.uniq(appWorkspaces).length < appWorkspaces.length
}

export const getIsAppBusy = (app: App | undefined): boolean => app?.status !== 'RUNNING' && _.includes('ING', app?.status)
