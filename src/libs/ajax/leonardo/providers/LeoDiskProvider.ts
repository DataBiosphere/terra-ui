import { isGcpContext } from 'src/analysis/utils/runtime-utils';
import { Ajax } from 'src/libs/ajax';
import { PersistentDisk } from 'src/libs/ajax/leonardo/models/disk-models';
import { GoogleWorkspaceInfo, WorkspaceInfo } from 'src/libs/workspace-utils';

export interface LeoDiskProvider {
  list: (listArgs: Record<string, string>, signal?: AbortSignal) => Promise<PersistentDisk[]>;
  delete: (disk: PersistentDisk, workspace: WorkspaceInfo, signal?: AbortSignal) => Promise<void>;
}

export const leoDiskProvider: LeoDiskProvider = {
  list: (listArgs: Record<string, string>, signal?: AbortSignal): Promise<PersistentDisk[]> => {
    return Ajax(signal).Disks.disksV1().list(listArgs);
  },
  delete: (disk: PersistentDisk, workspace: WorkspaceInfo, signal?: AbortSignal): Promise<void> => {
    const { cloudContext, name, id } = disk;

    if (isGcpContext(cloudContext)) {
      const { googleProject } = workspace as GoogleWorkspaceInfo;
      return Ajax(signal).Disks.disksV1().disk(googleProject, name).delete();
    }
    return Ajax(signal).Disks.disksV2().delete(id);
  },
};
