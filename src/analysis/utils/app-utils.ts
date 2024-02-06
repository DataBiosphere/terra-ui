import _ from 'lodash/fp';
import { allAppTypes, AppToolLabel, appToolLabels, isAppToolLabel, ToolLabel } from 'src/analysis/utils/tool-utils';
import { App, DisplayAppStatus, LeoAppStatus } from 'src/libs/ajax/leonardo/models/app-models';
import { PersistentDisk } from 'src/libs/ajax/leonardo/models/disk-models';
import { getTerraUser } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { CloudProvider, cloudProviderTypes, WorkspaceInfo } from 'src/workspaces/utils';
import { v4 as uuid } from 'uuid';

const getCurrentAppExcludingStatuses = (
  appType: AppToolLabel,
  statuses: LeoAppStatus[],
  apps: App[] | undefined
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
  // note: for all environments, we want to show Cromwell app modal (both Settings and Open buttons) only for workspace creators
  return Utils.cond(
    [
      toolLabel === appToolLabels.CROMWELL && cloudProvider === cloudProviderTypes.AZURE,
      () => workspaceInfo.createdBy === getTerraUser()?.email,
    ],
    [Utils.DEFAULT, () => true]
  );
};

export const getCurrentApp = (appType: ToolLabel, apps: App[] | undefined): App | undefined =>
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
  Utils.switchCase<string, DisplayAppStatus>(
    _.lowerCase(status),
    ['status_unspecified', () => 'Unknown'],
    ['starting', () => 'Resuming'],
    ['stopping', () => 'Pausing'],
    ['stopped', () => 'Paused'],
    ['prestarting', () => 'Resuming'],
    ['prestopping', () => 'Pausing'],
    ['provisioning', () => 'Creating'],
    // TODO: Type safety could be improved here and the cast removed by mapping between the two types
    // using an object typed Record<LeoAppStatus, DisplayAppStatus> instead of switchCase.
    [Utils.DEFAULT, () => _.capitalize(status) as DisplayAppStatus]
  );

export const getEnvMessageBasedOnStatus = (app: App | undefined): string | undefined => {
  const waitMessage = 'This process will take up to a few minutes.';
  const nonStatusSpecificMessage =
    'A cloud environment consists of application configuration, cloud compute and persistent disk(s).';

  if (!app) {
    return nonStatusSpecificMessage;
  }

  const statusMessages: Partial<Record<LeoAppStatus, string>> = {
    PROVISIONING: 'The cloud compute is provisioning, which may take several minutes.',
    STOPPED: 'The cloud compute is paused.',
    STOPPING: `The cloud compute is pausing. ${waitMessage}`,
    STARTING: `The cloud compute is resuming. ${waitMessage}`,
    RUNNING: nonStatusSpecificMessage,
    ERROR: 'An error has occurred on your cloud environment.',
  };
  return statusMessages[app.status];
};

export const generateAppName = () => `terra-app-${uuid()}`;
