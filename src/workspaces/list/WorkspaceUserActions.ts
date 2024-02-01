import { createContext } from 'react';
import { WorkspaceWrapper } from 'src/libs/workspace-utils';

export const WorkspaceUserActionsContext = createContext<WorkspaceUserActionsState>({
  userActions: {
    creatingNewWorkspace: false,
  },
  setUserActions: () => {},
});

export interface WorkspaceUserActionsState {
  userActions: WorkspaceUserActions;
  setUserActions: (actions: Partial<WorkspaceUserActions>) => void;
}

// TODO: these should be removed in favor of the modal manager once available
export interface WorkspaceUserActions {
  creatingNewWorkspace: boolean;
  deletingWorkspaceId?: string;
  lockingWorkspaceId?: string;
  leavingWorkspaceId?: string;
  requestingAccessWorkspaceId?: string;
  sharingWorkspace?: WorkspaceWrapper;
  cloningWorkspace?: WorkspaceWrapper;
}
