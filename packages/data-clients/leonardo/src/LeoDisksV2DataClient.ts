import { AbortOption, FetchFn } from '@terra-ui-packages/data-client-core';

export interface LeoDisksV2DataClient {
  delete: (diskId: number, options?: AbortOption) => Promise<void>;
}
const diskV2Root = 'api/v2/disks';

export const makeLeoDisksV2DataClient = (deps: LeoDisksV2DataClientDeps): LeoDisksV2DataClient => {
  const { fetchAuthedLeo } = deps;
  return {
    delete: async (diskId: number, options: AbortOption = {}): Promise<void> => {
      const { signal } = options;
      await fetchAuthedLeo(`${diskV2Root}/${diskId}`, { signal, method: 'DELETE' });
    },
  };
};

export interface LeoDisksV2DataClientDeps {
  /**
   * fetch function that takes care of desired auth/session mechanics, api endpoint root url prefixing,
   * baseline expected request headers, etc.
   */
  fetchAuthedLeo: FetchFn;
}
