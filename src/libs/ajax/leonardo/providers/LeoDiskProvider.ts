import { isGcpContext } from 'src/analysis/utils/runtime-utils';
import { Ajax } from 'src/libs/ajax';
import { AbortOption } from 'src/libs/ajax/data-provider-common';
import { PersistentDisk } from 'src/libs/ajax/leonardo/models/disk-models';

export type DiskBasics = Pick<PersistentDisk, 'cloudContext' | 'name' | 'id'>;

export interface LeoDiskProvider {
  list: (listArgs: Record<string, string>, options?: AbortOption) => Promise<PersistentDisk[]>;
  delete: (disk: DiskBasics, options?: AbortOption) => Promise<void>;
}

export const leoDiskProvider: LeoDiskProvider = {
  list: (listArgs: Record<string, string>, options: AbortOption = {}): Promise<PersistentDisk[]> => {
    const { signal } = options;

    return Ajax(signal).Disks.disksV1().list(listArgs);
  },
  delete: (disk: DiskBasics, options: AbortOption = {}): Promise<void> => {
    const { cloudContext, name, id } = disk;
    const { signal } = options;

    if (isGcpContext(cloudContext)) {
      const googleProject = cloudContext.cloudResource;
      return Ajax(signal).Disks.disksV1().disk(googleProject, name).delete();
    }
    return Ajax(signal).Disks.disksV2().delete(id);
  },
};
