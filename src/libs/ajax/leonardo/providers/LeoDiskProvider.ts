import _ from 'lodash/fp';
import { isGcpContext } from 'src/analysis/utils/runtime-utils';
import { AbortOption } from 'src/libs/ajax/data-provider-common';
import { GoogleDiskType, GooglePdType, PersistentDisk, PersistentDiskDetail, RawGetDiskItem, RawListDiskItem, googlePdTypes } from 'src/libs/ajax/leonardo/models/disk-models';

import { Disks } from '../Disks';

export type DiskBasics = Pick<PersistentDisk, 'cloudContext' | 'name' | 'id'>;

export interface LeoDiskProvider {
  list: (listArgs: Record<string, string>, options?: AbortOption) => Promise<PersistentDisk[]>;
  delete: (disk: DiskBasics, options?: AbortOption) => Promise<void>;
  update: (disk: DiskBasics, newSize: number, options?: AbortOption) => Promise<void>;
  details: (disk: DiskBasics, options?: AbortOption) => Promise<PersistentDiskDetail>;
}

export const leoDiskProvider: LeoDiskProvider = {
  list: async (listArgs: Record<string, string>, options: AbortOption = {}): Promise<PersistentDisk[]> => {
    const { signal } = options;
    const disks: RawListDiskItem[] = await Disks(signal).disksV1().list(listArgs);
    return mapToPdTypes(disks);
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
      const disk: RawGetDiskItem = await Disks(signal).disksV1().disk(googleProject, name).details();
      const decoratedDisk: PersistentDiskDetail = updatePdType(disk);
      return decoratedDisk;
    }
    throw new Error(`Getting disk details is currently only supported for google disks. Disk: ${disk}`);
  },
  update: (disk: DiskBasics, newSize: number, options: AbortOption = {}): Promise<void> => {
    const { signal } = options;
    const { cloudContext, name } = disk;

    if (isGcpContext(cloudContext)) {
      const googleProject = cloudContext.cloudResource;
      return Disks(signal).disksV1().disk(googleProject, name).update(newSize);
    }
    throw new Error(`Updating disk is currently only supported for google disks. Disk: ${disk}`);
  },
};

export const pdTypeFromDiskType = (type: GoogleDiskType): GooglePdType => googlePdTypes[type]
// Utils.switchCase(
//   type,
//   [googlePdTypes.standard.value, () => googlePdTypes.standard],
//   [googlePdTypes.balanced.value, () => googlePdTypes.balanced],
//   [googlePdTypes.ssd.value, () => googlePdTypes.ssd],
//   [
//     Utils.DEFAULT,
//     () => {
//       console.error(`Invalid disk type: Should not be calling googlePdTypes.fromString for ${JSON.stringify(type)}`);
//       return undefined;
//     },
//   ]
//   /**
//    * TODO: Remove cast
//    * "Log error and return undefined" for unexpected cases looks to be a pattern.
//    * However, the possible undefined isn't handled because the return type does not include undefined).
//    * Type safety could be improved by throwing an error for unexpected inputs.
//    * That would ensure that the return type is GooglePdType instead of GooglePdType | undefined.
//    */
// ) as GooglePdType; // TODO: Remove cast

const updatePdType = <T extends RawListDiskItem>(disk: T): T & { diskType: GooglePdType } => ({
  ...disk,
  diskType: pdTypeFromDiskType(disk.diskType),
});
const mapToPdTypes = <T extends RawListDiskItem>(disks: T[]): (T & { diskType: GooglePdType })[] =>
  _.map(updatePdType, disks);
