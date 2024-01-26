import { App, ListAppItem } from 'src/libs/ajax/leonardo/models/app-models';
import { PersistentDisk } from 'src/libs/ajax/leonardo/models/disk-models';
import { ListRuntimeItem } from 'src/libs/ajax/leonardo/models/runtime-models';
import { LeoDiskProvider } from 'src/libs/ajax/leonardo/providers/LeoDiskProvider';
import { LeoRuntimeProvider } from 'src/libs/ajax/leonardo/providers/LeoRuntimeProvider';
import { WorkspaceInfo } from 'src/libs/workspace-utils';

export interface DecoratedResourceAttributes {
  workspace?: WorkspaceInfo;
  unsupportedWorkspace: boolean;
}

export type RuntimeWithWorkspace = DecoratedResourceAttributes & ListRuntimeItem;
export type DiskWithWorkspace = DecoratedResourceAttributes & PersistentDisk;
export type AppWithWorkspace = DecoratedResourceAttributes & ListAppItem;

export type DecoratedComputeResource = RuntimeWithWorkspace | AppWithWorkspace;
export type DecoratedResource = DecoratedComputeResource | DiskWithWorkspace;

export interface LeoResourcePermissionsProvider {
  canDeleteDisk: (disk: PersistentDisk) => boolean;
  canPauseResource: (resource: App | ListRuntimeItem) => boolean;
}

export type DeleteRuntimeProvider = Pick<LeoRuntimeProvider, 'delete'>;
export type DeleteDiskProvider = Pick<LeoDiskProvider, 'delete'>;
