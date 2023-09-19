import { Atom, atom } from '@terra-ui-packages/core-utils';
import { WorkspaceWrapper } from 'src/libs/workspace-utils';

/**
 * This is here instead of libs/state.ts
 * because it is limited to tracking current user activity in the List component
 */
export const workspaceUserActionsStore: Atom<WorkspaceUserActions> = atom<WorkspaceUserActions>({
  creatingNewWorkspace: false,
});

export interface WorkspaceUserActions {
  creatingNewWorkspace: boolean;
  cloningWorkspaceId?: string;
  deletingWorkspaceId?: string;
  lockingWorkspaceId?: string;
  leavingWorkspaceId?: string;
  requestingAccessWorkspaceId?: string;
  sharingWorkspace?: WorkspaceWrapper;
}

export const updateWorkspaceActions = (actions: Partial<WorkspaceUserActions>) => {
  workspaceUserActionsStore.set({ ...workspaceUserActionsStore.get(), ...actions });
};
