import _ from 'lodash/fp'
import { App, AppStatus, DisplayAppStatus } from 'src/libs/ajax/leonardo/models/app-models'
import { PersistentDisk } from 'src/libs/ajax/leonardo/models/disk-models'
import { getConfig } from 'src/libs/config'
import * as Utils from 'src/libs/utils'
import { CloudProvider, cloudProviderTypes } from 'src/libs/workspace-utils'
import {
  allAppTypes,
  AppToolLabel,
  appToolLabels,
  ToolLabel
} from 'src/pages/workspaces/workspace/analysis/utils/tool-utils'


const getCurrentAppExcludingStatuses = (appType: AppToolLabel, statuses: AppStatus[], apps: App[]): App | undefined => _.flow(
  _.filter({ appType }),
  _.remove((app: App) => _.includes(app.status, statuses)),
  _.sortBy('auditInfo.createdDate'),
  _.last
)(apps)

// In prod, the ability to create and view Cromwell app for Azure workspaces is being introduced on March 21st, 2023 as part
// of the Workflows Public Preview. Azure workspaces before this would only have WDS app created when the workspace is created.
// Hence, for Azure workspaces that predate this launch date, we don't want to display the Cromwell app icon in Context bar and
// in Cloud Environment Modal we would like to display message asking users to create new workspace to use Cromwell app.
// Note: the date we are comparing against is March 21st since that's when the ability to create Cromwell app was merged into Prod.
export const doesWorkspaceSupportCromwellApp = (workspaceCreatedDate: string, cloudProvider: CloudProvider, toolLabel: ToolLabel): boolean => {
  // deploy to prod happened around 9:45 AM EST
  const workflowsPublicPreviewDate = new Date(Date.parse('Tue Mar 21 2023 10:00:00 GMT-0400')) // 10 AM EST

  return Utils.cond(
    [toolLabel === appToolLabels.CROMWELL && cloudProvider === cloudProviderTypes.AZURE && getConfig().isProd, () => new Date(workspaceCreatedDate).valueOf() > workflowsPublicPreviewDate.valueOf()],
    [Utils.DEFAULT, () => true]
  )
}

export const getAppStatusForDisplay = (status: AppStatus): DisplayAppStatus => Utils.switchCase(status,
  ['STARTING', () => 'Resuming'],
  ['STOPPING', () => 'Pausing'],
  ['STOPPED', () => 'Paused'],
  ['PROVISIONING', () => 'Creating'],
  [Utils.DEFAULT, () => _.capitalize(status)])

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
