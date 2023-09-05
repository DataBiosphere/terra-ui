import { Ajax } from 'src/libs/ajax';
import { ListAppResponse } from 'src/libs/ajax/leonardo/models/app-models';

export interface LeoAppProvider {
  listWithoutProject: (args: Record<string, string>, signal?: AbortSignal) => Promise<ListAppResponse[]>;
  delete: (resourceName: string, appName: string, deleteDisk?: boolean, signal?: AbortSignal) => Promise<void>;
  pause: (resourceName: string, appName: string, signal?: AbortSignal) => Promise<void>;
}

export const leoAppProvider: LeoAppProvider = {
  listWithoutProject: (args: Record<string, string>, signal?: AbortSignal): Promise<ListAppResponse[]> => {
    return Ajax(signal).Apps.listWithoutProject(args);
  },
  delete: (resourceName: string, appName: string, deleteDisk?: boolean, signal?: AbortSignal): Promise<void> => {
    return Ajax(signal).Apps.app(resourceName, appName).delete(deleteDisk);
  },
  pause: (resourceName: string, appName: string, signal?: AbortSignal): Promise<void> => {
    return Ajax(signal).Apps.app(resourceName, appName).pause();
  },
};
