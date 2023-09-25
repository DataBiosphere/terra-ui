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

export interface WorkspaceUserActions {
  creatingNewWorkspace: boolean;
  cloningWorkspaceId?: string;
  deletingWorkspaceId?: string;
  lockingWorkspaceId?: string;
  leavingWorkspaceId?: string;
  requestingAccessWorkspaceId?: string;
  sharingWorkspace?: WorkspaceWrapper;
}
