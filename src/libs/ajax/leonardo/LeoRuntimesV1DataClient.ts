import { AbortOption, FetchFn } from '@terra-ui-packages/data-client-core';
import { RawGetRuntimeItem } from 'src/libs/ajax/leonardo/models/runtime-models';

export interface LeoRuntimesV1DataClient {
  details: (googleProject: string, name: string, options?: AbortOption) => Promise<RawGetRuntimeItem>;
  start: (googleProject: string, name: string, options?: AbortOption) => Promise<void>;
  stop: (googleProject: string, name: string, options?: AbortOption) => Promise<void>;
}

export interface LeoRuntimesV1DataClientDeps {
  /**
   * fetch function that takes care of desired auth/session mechanics, api endpoint root url prefixing,
   * baseline expected request headers, etc.
   */
  fetchAuthedLeo: FetchFn;
}

const runtimesPath = (project: string, name: string) => `api/google/v1/runtimes/${project}/${name}`;

export const makeLeoRuntimesV1DataClient = (deps: LeoRuntimesV1DataClientDeps): LeoRuntimesV1DataClient => {
  const { fetchAuthedLeo } = deps;

  return {
    details: async (googleProject: string, name: string, options: AbortOption = {}): Promise<RawGetRuntimeItem> => {
      const { signal } = options;
      const res: Response = await fetchAuthedLeo(runtimesPath(googleProject, name), { signal });
      const getItem: RawGetRuntimeItem = await res.json();
      return getItem;
    },
    start: async (googleProject: string, name: string, options: AbortOption = {}): Promise<void> => {
      const { signal } = options;
      await fetchAuthedLeo(`${runtimesPath(googleProject, name)}/start`, { signal, method: 'POST' });
    },

    stop: async (googleProject: string, name: string, options: AbortOption = {}): Promise<void> => {
      const { signal } = options;
      await fetchAuthedLeo(`${runtimesPath(googleProject, name)}/stop`, { signal, method: 'POST' });
    },
  };
};
