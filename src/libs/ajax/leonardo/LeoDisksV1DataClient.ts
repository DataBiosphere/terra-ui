import { jsonBody } from '@terra-ui-packages/data-client-core';
import { AbortOption } from 'src/libs/ajax/data-client-common';

import { LeoDisksDataClientDeps, RawGetDiskItem } from './Disks';

export interface LeoDisksV1DataClient {
  delete: (project: string, name: string, options?: AbortOption) => Promise<void>;
  update: (project: string, name: string, size: number, options?: AbortOption) => Promise<void>;
  details: (project: string, name: string, options?: AbortOption) => Promise<RawGetDiskItem>;
}

const diskV1Root = 'api/google/v1/disks';
const diskV1Path = (project: string, name: string) => `${diskV1Root}/${project}/${name}`;

export const makeLeoDisksV1DataClient = (deps: LeoDisksDataClientDeps): LeoDisksV1DataClient => {
  const { fetchAuthedLeo } = deps;
  return {
    delete: async (project: string, name: string, options: AbortOption = {}): Promise<void> => {
      const { signal } = options;
      await fetchAuthedLeo(diskV1Path(project, name), { signal, method: 'DELETE' });
    },
    update: async (project: string, name: string, size: number, options: AbortOption = {}): Promise<void> => {
      const { signal } = options;
      await fetchAuthedLeo(diskV1Path(project, name), { signal, method: 'PATCH', ...jsonBody({ size }) });
    },
    details: async (project: string, name: string, options: AbortOption = {}): Promise<RawGetDiskItem> => {
      const { signal } = options;
      const res = await fetchAuthedLeo(diskV1Path(project, name), { signal, method: 'GET' });
      const disk: RawGetDiskItem = await res.json();
      return disk;
    },
  };
};
