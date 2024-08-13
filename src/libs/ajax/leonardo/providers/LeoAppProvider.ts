import { AbortOption } from '@terra-ui-packages/data-client-core';
import { AppWithWorkspace } from 'src/analysis/Environments/Environments.models';
import { Ajax } from 'src/libs/ajax';
import { GetAppItem, ListAppItem } from 'src/libs/ajax/leonardo/models/app-models';

export type AppBasics = Pick<ListAppItem, 'appName' | 'workspaceId'> & {
  cloudContext: Pick<AppWithWorkspace['cloudContext'], 'cloudProvider' | 'cloudResource'>;
};

export type DeleteAppOptions = AbortOption & {
  deleteDisk?: boolean;
};

export interface LeoAppProvider {
  listWithoutProject: (listArgs: Record<string, string>, options?: AbortOption) => Promise<ListAppItem[]>;
  delete: (app: AppBasics, options?: DeleteAppOptions) => Promise<void>;
  pause: (app: AppBasics, options?: AbortOption) => Promise<void>;
  get: (app: AppBasics, options?: AbortOption) => Promise<GetAppItem>;
}

export const leoAppProvider: LeoAppProvider = {
  listWithoutProject: (listArgs: Record<string, string>, options: AbortOption = {}): Promise<ListAppItem[]> => {
    const { signal } = options;

    return Ajax(signal).Apps.listWithoutProject(listArgs);
  },
  delete: (app: AppBasics, options: DeleteAppOptions = {}): Promise<void> => {
    const { cloudProvider, cloudResource } = app.cloudContext;
    const { deleteDisk, signal } = options;

    const { appName, workspaceId } = app;
    if (cloudProvider === 'GCP') {
      return Ajax(signal).Apps.app(cloudResource, appName).delete(!!deleteDisk);
    }
    if (cloudProvider === 'AZURE' && !!workspaceId) {
      return Ajax(signal).Apps.deleteAppV2(appName, workspaceId);
    }
    throw new Error(
      `Deleting apps is currently only supported for azure or google apps. Azure apps must have a workspace id. App: ${app.appName} workspaceId: ${workspaceId}`
    );
  },
  pause: (app: AppBasics, options: AbortOption = {}): Promise<void> => {
    const { cloudResource, cloudProvider } = app.cloudContext;
    const { signal } = options;

    if (cloudProvider === 'AZURE') {
      throw new Error('Pausing apps is not supported for azure');
    }

    return Ajax(signal).Apps.app(cloudResource, app.appName).pause();
  },
  get: (app: AppBasics, options: AbortOption = {}): Promise<GetAppItem> => {
    const { cloudResource, cloudProvider } = app.cloudContext;
    const { signal } = options;
    const { workspaceId } = app;

    if (cloudProvider === 'GCP') {
      return Ajax(signal).Apps.app(cloudResource, app.appName).details();
    }
    if (cloudProvider === 'AZURE' && !!workspaceId) {
      return Ajax(signal).Apps.getAppV2(app.appName, workspaceId);
    }

    throw new Error(
      `Getting apps is currently only supported for azure or google apps. Azure apps must have a workspace id. App: ${app.appName} workspaceId: ${workspaceId}`
    );
  },
};
