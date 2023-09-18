import { Ajax } from 'src/libs/ajax';
import { AbortOption } from 'src/libs/ajax/data-provider-common';
import { App, ListAppResponse } from 'src/libs/ajax/leonardo/models/app-models';

export type AppBasics = Pick<App, 'appName'> & {
  cloudContext: Pick<App['cloudContext'], 'cloudProvider' | 'cloudResource'>;
};

export type DeleteAppOptions = AbortOption & {
  deleteDisk?: boolean;
};

export interface LeoAppProvider {
  listWithoutProject: (listArgs: Record<string, string>, options?: AbortOption) => Promise<ListAppResponse[]>;
  delete: (app: AppBasics, options?: DeleteAppOptions) => Promise<void>;
  pause: (app: AppBasics, options?: AbortOption) => Promise<void>;
}

export const leoAppProvider: LeoAppProvider = {
  listWithoutProject: (listArgs: Record<string, string>, options: AbortOption = {}): Promise<ListAppResponse[]> => {
    const { signal } = options;

    return Ajax(signal).Apps.listWithoutProject(listArgs);
  },
  delete: (app: AppBasics, options: DeleteAppOptions = {}): Promise<void> => {
    const { cloudProvider, cloudResource } = app.cloudContext;
    const { deleteDisk, signal } = options;

    if (cloudProvider === 'GCP') {
      const { appName } = app;
      return Ajax(signal).Apps.app(cloudResource, appName).delete(!!deleteDisk);
    }
    throw new Error('Deleting apps is currently only supported on GCP');
  },
  pause: (app: AppBasics, options: AbortOption = {}): Promise<void> => {
    const { cloudResource } = app.cloudContext;
    const { signal } = options;

    return Ajax(signal).Apps.app(cloudResource, app.appName).pause();
  },
};
