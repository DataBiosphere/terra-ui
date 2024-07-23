import { AbortOption } from '../data-client-common';
import { LeoDisksDataClientDeps } from './Disks';

export interface LeoDisksV2DataClient {
  delete: (diskId: number, options?: AbortOption) => Promise<void>;
}
const diskV2Root = 'api/v2/disks';

export const makeLeoDisksV2DataClient = (deps: LeoDisksDataClientDeps): LeoDisksV2DataClient => {
  const { fetchAuthedLeo } = deps;
  return {
    delete: async (diskId: number, options: AbortOption = {}): Promise<void> => {
      const { signal } = options;
      await fetchAuthedLeo(`${diskV2Root}/${diskId}`, { signal, method: 'DELETE' });
    },
  };
};
