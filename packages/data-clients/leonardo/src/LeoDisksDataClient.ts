import { LeoResourceLabels } from './core-models';
import { RawGetDiskItem, RawListDiskItem } from './disk-models';
import { LeoDisksV1DataClient } from './LeoDisksV1DataClient';
import { LeoDisksV2DataClient } from './LeoDisksV2DataClient';

export const makeDisksHelper = (deps: DisksHelperDeps) => (signal?: AbortSignal) => {
  const { v1Api, v2Api } = deps;

  const v1Func = () => ({
    list: async (labels: LeoResourceLabels): Promise<RawListDiskItem[]> => {
      return await v1Api.list(labels, { signal });
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
