import { AbortOption, FetchFn, jsonBody } from '@terra-ui-packages/data-client-core';
import * as qs from 'qs';

import { LeoResourceLabels } from './core-models';
import { RawGetDiskItem, RawListDiskItem } from './disk-models';

export interface LeoDisksV1DataClient {
  list: (labels: LeoResourceLabels, options?: AbortOption) => Promise<RawListDiskItem[]>;
  delete: (project: string, name: string, options?: AbortOption) => Promise<void>;
  update: (project: string, name: string, size: number, options?: AbortOption) => Promise<void>;
  details: (project: string, name: string, options?: AbortOption) => Promise<RawGetDiskItem>;
}

const diskV1Root = 'api/google/v1/disks';
const diskV1Path = (project: string, name: string) => `${diskV1Root}/${project}/${name}`;

export const makeLeoDisksV1DataClient = (deps: LeoDisksV1DataClientDeps): LeoDisksV1DataClient => {
  const { fetchAuthedLeo } = deps;
  return {
    list: async (labels = {}, options: AbortOption = {}): Promise<RawListDiskItem[]> => {
      const { signal } = options;
      const res = await fetchAuthedLeo(`api/google/v1/disks${qs.stringify(labels, { addQueryPrefix: true })}`, {
        signal,
      });
      const disks: RawListDiskItem[] = await res.json();
      return disks;
    },
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

export interface LeoDisksV1DataClientDeps {
  /**
   * fetch function that takes care of desired auth/session mechanics, api endpoint root url prefixing,
   * baseline expected request headers, etc.
   */
  fetchAuthedLeo: FetchFn;
}
