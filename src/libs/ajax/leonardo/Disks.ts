import _ from 'lodash/fp';
import * as qs from 'qs';
import { mapToPdTypes, updatePdType } from 'src/analysis/utils/disk-utils';
import { appIdentifier, authOpts, fetchLeo, jsonBody } from 'src/libs/ajax/ajax-common';
import {
  PersistentDisk,
  PersistentDiskDetail,
  RawGetDiskItem,
  RawListDiskItem,
} from 'src/libs/ajax/leonardo/models/disk-models';

export const Disks = (signal?: AbortSignal) => {
  const diskV2Root = 'api/v2/disks';
  const v2Func = () => ({
    delete: (diskId: number): Promise<void> => {
      return fetchLeo(`${diskV2Root}/${diskId}`, _.mergeAll([authOpts(), appIdentifier, { signal, method: 'DELETE' }]));
    },
  });

  const v1Func = () => ({
    list: async (labels = {}): Promise<PersistentDisk[]> => {
      const res = await fetchLeo(
        `api/google/v1/disks${qs.stringify(labels, { addQueryPrefix: true })}`,
        _.mergeAll([authOpts(), appIdentifier, { signal }])
      );
      const disks: RawListDiskItem[] = await res.json();
      return mapToPdTypes(disks);
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
      details: async (): Promise<PersistentDiskDetail> => {
        const res = await fetchLeo(
          `api/google/v1/disks/${project}/${name}`,
          _.mergeAll([authOpts(), appIdentifier, { signal, method: 'GET' }])
        );
        const disk: RawGetDiskItem = await res.json();
        return updatePdType(disk);
      },
    }),
  });

  return {
    disksV1: v1Func,
    disksV2: v2Func,
  };
};

export type DisksDataClientContract = ReturnType<typeof Disks>;
export type DisksContractV1 = ReturnType<DisksDataClientContract['disksV1']>;
export type DisksContractV2 = ReturnType<DisksDataClientContract['disksV2']>;
export type DiskWrapperContract = ReturnType<DisksContractV1['disk']>;
