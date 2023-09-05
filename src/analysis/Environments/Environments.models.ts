import { App } from 'src/libs/ajax/leonardo/models/app-models';
import { PersistentDisk } from 'src/libs/ajax/leonardo/models/disk-models';
import { Runtime } from 'src/libs/ajax/leonardo/models/runtime-models';
import { WorkspaceInfo } from 'src/libs/workspace-utils';

export interface DecoratedResourceAttributes {
  workspace: WorkspaceInfo;
  unsupportedWorkspace: boolean;
}

export type RuntimeWithWorkspace = DecoratedResourceAttributes & Runtime;
export type DiskWithWorkspace = DecoratedResourceAttributes & PersistentDisk;
export type AppWithWorkspace = DecoratedResourceAttributes & App;

export type DecoratedComputeResource = RuntimeWithWorkspace | AppWithWorkspace;
export type DecoratedResource = DecoratedComputeResource | DiskWithWorkspace;
