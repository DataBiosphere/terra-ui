import { App, ListAppItem } from 'src/libs/ajax/leonardo/models/app-models';
import { PersistentDisk } from 'src/libs/ajax/leonardo/models/disk-models';
import { ListRuntimeItem, Runtime } from 'src/libs/ajax/leonardo/models/runtime-models';
import { LeoDiskProvider } from 'src/libs/ajax/leonardo/providers/LeoDiskProvider';
import { LeoRuntimeProvider } from 'src/libs/ajax/leonardo/providers/LeoRuntimeProvider';
import { WorkspaceInfo } from 'src/workspaces/utils';

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
  hasDeletePermission: (disk: PersistentDisk) => boolean;
  hasPausePermission: (resource: App | ListRuntimeItem) => boolean;
  isAppInDeletableState: (resource: App) => boolean;
  isResourceInDeletableState: (resource: App | PersistentDisk | Runtime) => boolean;
}

export type DeleteRuntimeProvider = Pick<LeoRuntimeProvider, 'delete'>;
export type DeleteDiskProvider = Pick<LeoDiskProvider, 'delete'>;
