import { AbortOption, FetchFn } from 'src/libs/ajax/data-client-common';
import { RawGetRuntimeItem } from 'src/libs/ajax/leonardo/models/runtime-models';

export interface LeoRuntimesV1DataClient {
  details: (project: string, name: string, options?: AbortOption) => Promise<RawGetRuntimeItem>;
  start: (project: string, name: string, options?: AbortOption) => Promise<void>;
  stop: (project: string, name: string, options?: AbortOption) => Promise<void>;
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
    details: async (project: string, name: string, options: AbortOption = {}): Promise<RawGetRuntimeItem> => {
      const { signal } = options;
      const res: Response = await fetchAuthedLeo(runtimesPath(project, name), { signal });
      const getItem: RawGetRuntimeItem = await res.json();
      return getItem;
    },
    start: async (project: string, name: string, options: AbortOption = {}): Promise<void> => {
      const { signal } = options;
      await fetchAuthedLeo(`${runtimesPath(project, name)}/start`, { signal, method: 'POST' });
    },

    stop: async (project: string, name: string, options: AbortOption = {}): Promise<void> => {
      const { signal } = options;
      await fetchAuthedLeo(`${runtimesPath(project, name)}/stop`, { signal, method: 'POST' });
    },
  };
};
