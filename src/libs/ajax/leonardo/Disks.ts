import { AuditInfo, CloudContext, LeoResourceLabels } from '@terra-ui-packages/leonardo-data-client';
import _ from 'lodash/fp';
import * as qs from 'qs';
import { authOpts, withAuthSession } from 'src/auth/auth-options';
import { appIdentifier, fetchLeo, withAppIdentifier } from 'src/libs/ajax/ajax-common';

import { FetchFn } from '../data-client-common';
import { LeoDisksV1DataClient, makeLeoDisksV1DataClient } from './LeoDisksV1DataClient';
import { LeoDisksV2DataClient, makeLeoDisksV2DataClient } from './LeoDisksV2DataClient';

export const makeDisksHelper = (deps: DisksHelperDeps) => (signal?: AbortSignal) => {
  const { v1Api, v2Api } = deps;

  const v1Func = () => ({
    list: async (labels = {}): Promise<RawListDiskItem[]> => {
      const res = await fetchLeo(
        `api/google/v1/disks${qs.stringify(labels, { addQueryPrefix: true })}`,
        _.mergeAll([authOpts(), appIdentifier, { signal }])
      );
      const disks: RawListDiskItem[] = await res.json();
      return disks;
    },
    disk: (project: string, name: string) => ({
      delete: async (): Promise<void> => {
        await v1Api.delete(project, name, { signal });
      },
      update: async (size: number): Promise<void> => {
        await v1Api.update(project, name, size, { signal });
      },
      details: async (): Promise<RawGetDiskItem> => {
        const details = await v1Api.details(project, name, { signal });
        return details;
      },
    }),
  });

  return {
    disksV1: v1Func,
    disksV2: () => v2Api,
  };
};

export type DisksHelperDeps = {
  v1Api: LeoDisksV1DataClient;
  v2Api: LeoDisksV2DataClient;
};

export type AzureDiskType = 'Standard_LRS'; // TODO: Uncomment when enabling SSDs | 'StandardSSD_LRS';

export type GoogleDiskType = 'pd-standard' | 'pd-ssd' | 'pd-balanced';

export type DiskType = GoogleDiskType | AzureDiskType;

export type LeoDiskStatus = 'Creating' | 'Restoring' | 'Ready' | 'Failed' | 'Deleting' | 'Deleted' | 'Error';

export interface DiskStatus {
  leoLabel: LeoDiskStatus;
}

export const diskStatuses: { [label: string]: DiskStatus } = {
  ready: { leoLabel: 'Ready' },
  creating: { leoLabel: 'Creating' },
  restoring: { leoLabel: 'Restoring' },
  failed: { leoLabel: 'Failed' },
  deleting: { leoLabel: 'Deleting' },
  deleted: { leoLabel: 'Deleted' },
  error: { leoLabel: 'Error' },
};

export interface RawListDiskItem {
  id: number;
  cloudContext: CloudContext;
  zone: string;
  name: string;
  status: LeoDiskStatus;
  auditInfo: AuditInfo;
  size: number; // In GB
  diskType: GoogleDiskType;
  blockSize: number;
  labels: LeoResourceLabels;
}

export interface RawGetDiskItem extends RawListDiskItem {
  serviceAccount: string;
  samResource: number;
  formattedBy: string | null;
}

export interface LeoDisksDataClientDeps {
  /**
   * fetch function that takes care of desired auth/session mechanics, api endpoint root url prefixing,
   * baseline expected request headers, etc.
   */
  fetchAuthedLeo: FetchFn;
}

export const Disks = makeDisksHelper({
  v1Api: makeLeoDisksV1DataClient({
    fetchAuthedLeo: withAuthSession(withAppIdentifier(fetchLeo)),
  }),
  v2Api: makeLeoDisksV2DataClient({
    fetchAuthedLeo: withAuthSession(withAppIdentifier(fetchLeo)),
  }),
});

export type DisksDataClientContract = ReturnType<typeof Disks>;
export type DisksContractV1 = ReturnType<DisksDataClientContract['disksV1']>;
export type DisksContractV2 = ReturnType<DisksDataClientContract['disksV2']>;
export type DiskWrapperContract = ReturnType<DisksContractV1['disk']>;
