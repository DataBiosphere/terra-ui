import _ from 'lodash/fp';
import { allAppTypes, AppToolLabel, appToolLabels, isAppToolLabel, ToolLabel } from 'src/analysis/utils/tool-utils';
import { App, DisplayAppStatus, LeoAppStatus } from 'src/libs/ajax/leonardo/models/app-models';
import { PersistentDisk } from 'src/libs/ajax/leonardo/models/disk-models';
import { getConfig } from 'src/libs/config';
import { getUser } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { CloudProvider, cloudProviderTypes, WorkspaceInfo } from 'src/libs/workspace-utils';

const getCurrentAppExcludingStatuses = (
  appType: AppToolLabel,
  statuses: LeoAppStatus[],
  apps: App[]
): App | undefined =>
  _.flow(
    _.filter({ appType }),
    _.remove((app: App) => _.includes(app.status, statuses)),
    _.sortBy('auditInfo.createdDate'),
    _.last
  )(apps);

export const doesWorkspaceSupportCromwellAppForUser = (
  workspaceInfo: WorkspaceInfo,
  cloudProvider: CloudProvider,
  toolLabel: ToolLabel
): boolean => {
  // deploy to prod happened around 9:45 AM EST
  const workflowsPublicPreviewDate = new Date(Date.parse('Tue Mar 21 2023 10:00:00 GMT-0400')); // 10 AM EST

  // note: for all environments, we want to show Cromwell app modal (both Settings and Open buttons) only for workspace creators
  return Utils.cond(
    // for prod env, the ability to create and view Cromwell app for Azure workspaces is being introduced on March 21st, 2023 as part
    // of the Workflows Public Preview. Azure workspaces before this would only have WDS app created when the workspace is created.
    // Hence, for Azure workspaces that predate this launch date, we don't want to display the Cromwell app icon in Context bar and
    // in Cloud Environment Modal we would like to display message asking users to create new workspace to use Cromwell app.
    // Note: the date we are comparing against is March 21st since that's when the ability to create Cromwell app was merged into Prod.
    [
      toolLabel === appToolLabels.CROMWELL && cloudProvider === cloudProviderTypes.AZURE && getConfig().isProd,
      () =>
        new Date(workspaceInfo.createdDate).valueOf() > workflowsPublicPreviewDate.valueOf() &&
        workspaceInfo.createdBy === getUser()?.email,
    ],
    [
      toolLabel === appToolLabels.CROMWELL && cloudProvider === cloudProviderTypes.AZURE,
      () => workspaceInfo.createdBy === getUser()?.email,
    ],
    [Utils.DEFAULT, () => true]
  );
};

export const getCurrentApp = (appType: ToolLabel, apps: App[]): App | undefined =>
  isAppToolLabel(appType) ? getCurrentAppExcludingStatuses(appType, ['DELETING'], apps) : undefined;

export const getCurrentAppIncludingDeleting = (appType: AppToolLabel, apps: App[]): App | undefined =>
  getCurrentAppExcludingStatuses(appType, [], apps);

// If the disk was attached to an app, return the appType. Otherwise return undefined.
export const getDiskAppType = (disk: PersistentDisk): AppToolLabel | undefined => {
  const saturnApp = disk.labels.saturnApplication;
  // Do a case-insensitive match as disks have been created with both "galaxy" and "GALAXY".
  const appType = _.find((type) => type.toLowerCase() === saturnApp?.toLowerCase(), allAppTypes);
  return appType;
};

export const workspaceHasMultipleApps = (apps: App[], appType: AppToolLabel): boolean => {
  const appsByType = _.filter(
    (currentApp) => currentApp.appType === appType && !_.includes(currentApp.status, ['DELETING', 'PREDELETING']),
    apps
  );
  const appWorkspaces = _.map((currentApp) => currentApp.labels.saturnWorkspaceName, appsByType);
  return _.uniq(appWorkspaces).length < appWorkspaces.length;
};

export const getIsAppBusy = (app: App | undefined): boolean =>
  app?.status !== 'RUNNING' && _.includes('ING', app?.status);

export const getAppStatusForDisplay = (status: LeoAppStatus): DisplayAppStatus =>
  Utils.switchCase(
    _.lowerCase(status),
    ['status_unspecified', () => 'Unknown'],
    ['starting', () => 'Resuming'],
    ['stopping', () => 'Pausing'],
    ['stopped', () => 'Paused'],
    ['prestarting', () => 'Resuming'],
    ['prestopping', () => 'Pausing'],
    ['provisioning', () => 'Creating'],
    [Utils.DEFAULT, () => _.capitalize(status)]
  );

export const getEnvMessageBasedOnStatus = (app: App | undefined): string => {
  const waitMessage = 'This process will take up to a few minutes.';
  const nonStatusSpecificMessage =
    'A cloud environment consists of application configuration, cloud compute and persistent disk(s).';
  return !app
    ? nonStatusSpecificMessage
    : Utils.switchCase(
        app.status,
        ['PROVISIONING', () => 'The cloud compute is provisioning, which may take several minutes.'],
        ['STOPPED', () => 'The cloud compute is paused.'],
        ['PRESTOPPING', () => 'The cloud compute is preparing to pause.'],
        ['STOPPING', () => `The cloud compute is pausing. ${waitMessage}`],
        ['PRESTARTING', () => 'The cloud compute is preparing to resume.'],
        ['STARTING', () => `The cloud compute is resuming. ${waitMessage}`],
        ['RUNNING', () => nonStatusSpecificMessage],
        ['ERROR', () => 'An error has occurred on your cloud environment.']
      );
};
