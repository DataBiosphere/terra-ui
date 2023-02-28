import _ from 'lodash/fp'
import { allAppTypes } from 'src/pages/workspaces/workspace/analysis/tool-utils'


export const isApp = cloudEnvironment => !!cloudEnvironment?.appName
const getCurrentAppExcludingStatuses = (appType, statuses) => _.flow(
  _.filter({ appType }),
  _.remove(({ status }) => _.includes(status, statuses)),
  _.sortBy('auditInfo.createdDate'),
  _.last
)
export const getCurrentApp = appType => getCurrentAppExcludingStatuses(appType, ['DELETING', 'PREDELETING'])
export const getCurrentAppIncludingDeleting = appType => getCurrentAppExcludingStatuses(appType, [])
// If the disk was attached to an app, return the appType. Otherwise return undefined.
export const getDiskAppType = disk => {
  const saturnApp = disk.labels.saturnApplication
  // Do a case-insensitive match as disks have been created with both "galaxy" and "GALAXY".
  const appType = _.find(type => type.toLowerCase() === saturnApp?.toLowerCase(), allAppTypes)
  return appType
}
export const workspaceHasMultipleApps = (apps, appType) => {
  const appsByType = _.filter(currentApp => currentApp.appType === appType && !_.includes(currentApp.status, ['DELETING', 'PREDELETING']), apps)
  const appWorkspaces = _.map(currentApp => currentApp.labels.saturnWorkspaceName, appsByType)
  return _.uniq(appWorkspaces).length < appWorkspaces.length
}
export const appIsSettingUp = app => {
  return app && (app.status === 'PROVISIONING' || app.status === 'PRECREATING')
}
export const getIsAppBusy = app => app?.status !== 'RUNNING' && _.includes('ING', app?.status)
