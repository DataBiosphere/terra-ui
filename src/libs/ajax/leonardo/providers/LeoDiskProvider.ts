import { isGcpContext } from 'src/analysis/utils/runtime-utils';
import { AbortOption } from 'src/libs/ajax/data-provider-common';
import { PersistentDisk, PersistentDiskDetail } from 'src/libs/ajax/leonardo/models/disk-models';

import { Disks } from '../Disks';

export type DiskBasics = Pick<PersistentDisk, 'cloudContext' | 'name' | 'id'>;

export interface LeoDiskProvider {
  list: (listArgs: Record<string, string>, options?: AbortOption) => Promise<PersistentDisk[]>;
  delete: (disk: DiskBasics, options?: AbortOption) => Promise<void>;
  update: (disk: DiskBasics, newSize: number, options?: AbortOption) => Promise<void>;
  details: (disk: DiskBasics, options?: AbortOption) => Promise<PersistentDiskDetail>;
}

export const leoDiskProvider: LeoDiskProvider = {
  list: (listArgs: Record<string, string>, options: AbortOption = {}): Promise<PersistentDisk[]> => {
    const { signal } = options;

    return Disks(signal).disksV1().list(listArgs);
  },
  delete: (disk: DiskBasics, options: AbortOption = {}): Promise<void> => {
    const { cloudContext, name, id } = disk;
    const { signal } = options;

    if (isGcpContext(cloudContext)) {
      const googleProject = cloudContext.cloudResource;
      return Disks(signal).disksV1().disk(googleProject, name).delete();
    }
    return Disks(signal).disksV2().delete(id);
  },
  details: async (disk: DiskBasics, options: AbortOption = {}): Promise<PersistentDiskDetail> => {
    const { signal } = options;
    const { cloudContext, name } = disk;

    if (isGcpContext(cloudContext)) {
      const googleProject = cloudContext.cloudResource;
      const decoratedDisk: PersistentDiskDetail = await Disks(signal).disksV1().disk(googleProject, name).details();
      // TODO: IA-4883, uncomment when the provider does the sanitization
      // return updatePdType(undecoratedDisk);
      return decoratedDisk;
    }
    throw new Error(`Getting disk details is currently only supported for google disks. Disk: ${disk}`);
  },
  // TODO: validation discussion
  update: (disk: DiskBasics, newSize: number, options: AbortOption = {}): Promise<void> => {
    const { signal } = options;
    const { cloudContext, name } = disk;

    if (isGcpContext(cloudContext)) {
      const googleProject = cloudContext.cloudResource;
      return Disks(signal).disksV1().disk(googleProject, name).update(newSize);
    }
    throw new Error(`Updating disk details is currently only supported for google disks. Disk: ${disk}`);
  },
};
