import { jsonBody } from '@terra-ui-packages/data-client-core';
import { AuditInfo, CloudContext, LeoResourceLabels } from '@terra-ui-packages/leonardo-data-client';
import _ from 'lodash/fp';
import * as qs from 'qs';
import { appIdentifier, authOpts, fetchLeo } from 'src/libs/ajax/ajax-common';

export const Disks = (signal?: AbortSignal) => {
  const diskV2Root = 'api/v2/disks';
  const v2Func = () => ({
    delete: (diskId: number): Promise<void> => {
      return fetchLeo(`${diskV2Root}/${diskId}`, _.mergeAll([authOpts(), appIdentifier, { signal, method: 'DELETE' }]));
    },
  });

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
      delete: (): Promise<void> => {
        return fetchLeo(
          `api/google/v1/disks/${project}/${name}`,
          _.mergeAll([authOpts(), appIdentifier, { signal, method: 'DELETE' }])
        );
      },
      update: (size: number): Promise<void> => {
        return fetchLeo(
          `api/google/v1/disks/${project}/${name}`,
          _.mergeAll([authOpts(), jsonBody({ size }), appIdentifier, { signal, method: 'PATCH' }])
        );
      },
      details: async (): Promise<RawGetDiskItem> => {
        const res = await fetchLeo(
          `api/google/v1/disks/${project}/${name}`,
          _.mergeAll([authOpts(), appIdentifier, { signal, method: 'GET' }])
        );
        const disk: RawGetDiskItem = await res.json();
        return disk;
      },
    }),
  });

  return {
    disksV1: v1Func,
    disksV2: v2Func,
  };
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

export type DisksDataClientContract = ReturnType<typeof Disks>;
export type DisksContractV1 = ReturnType<DisksDataClientContract['disksV1']>;
export type DisksContractV2 = ReturnType<DisksDataClientContract['disksV2']>;
export type DiskWrapperContract = ReturnType<DisksContractV1['disk']>;
