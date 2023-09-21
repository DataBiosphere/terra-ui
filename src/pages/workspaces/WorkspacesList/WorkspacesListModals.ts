import { FC, Fragment } from 'react';
import { h } from 'react-hyperscript-helpers';
import LeaveResourceModal from 'src/components/LeaveResourceModal';
import NewWorkspaceModal from 'src/components/NewWorkspaceModal';
import { goToPath } from 'src/libs/nav';
import { useStore } from 'src/libs/react-utils';
import { WorkspaceWrapper as Workspace } from 'src/libs/workspace-utils';
import DeleteWorkspaceModal from 'src/pages/workspaces/workspace/DeleteWorkspaceModal';
import LockWorkspaceModal from 'src/pages/workspaces/workspace/LockWorkspaceModal';
import { RequestAccessModal } from 'src/pages/workspaces/workspace/RequestAccessModal';
import ShareWorkspaceModal from 'src/pages/workspaces/workspace/ShareWorkspaceModal/ShareWorkspaceModal';
import {
  updateWorkspaceActions,
  workspaceUserActionsStore,
} from 'src/pages/workspaces/WorkspacesList/WorkspaceUserActions';

interface WorkspacesListModalsProps {
  getWorkspace: (string) => Workspace;
  refreshWorkspaces: () => void;
}

export const WorkspacesListModals: FC<WorkspacesListModalsProps> = ({ getWorkspace, refreshWorkspaces }) => {
  const userActions = useStore(workspaceUserActionsStore);

  return h(Fragment, [
    userActions.creatingNewWorkspace &&
      h(NewWorkspaceModal, {
        onDismiss: () => updateWorkspaceActions({ creatingNewWorkspace: false }),
        onSuccess: ({ namespace, name }) => goToPath('workspace-dashboard', { namespace, name }),
      }),
    !!userActions.cloningWorkspaceId &&
      h(NewWorkspaceModal, {
        cloneWorkspace: getWorkspace(userActions.cloningWorkspaceId),
        onDismiss: () => updateWorkspaceActions({ cloningWorkspaceId: undefined }),
        onSuccess: ({ namespace, name }) => goToPath('workspace-dashboard', { namespace, name }),
      }),
    !!userActions.deletingWorkspaceId &&
      h(DeleteWorkspaceModal, {
        workspace: getWorkspace(userActions.deletingWorkspaceId),
        onDismiss: () => updateWorkspaceActions({ deletingWorkspaceId: undefined }),
        onSuccess: refreshWorkspaces,
      }),
    !!userActions.lockingWorkspaceId &&
      h(LockWorkspaceModal, {
        workspace: getWorkspace(userActions.lockingWorkspaceId),
        onDismiss: () => updateWorkspaceActions({ lockingWorkspaceId: undefined }),
        onSuccess: refreshWorkspaces,
      }),
    !!userActions.sharingWorkspace &&
      h(ShareWorkspaceModal, {
        workspace: userActions.sharingWorkspace,
        onDismiss: () => updateWorkspaceActions({ sharingWorkspace: undefined }),
      }),
    !!userActions.leavingWorkspaceId &&
      h(LeaveResourceModal, {
        samResourceId: userActions.leavingWorkspaceId,
        samResourceType: 'workspace',
        displayName: 'workspace',
        onDismiss: () => updateWorkspaceActions({ leavingWorkspaceId: undefined }),
        onSuccess: refreshWorkspaces,
      }),
    !!userActions.requestingAccessWorkspaceId &&
      h(RequestAccessModal, {
        workspace: getWorkspace(userActions.requestingAccessWorkspaceId),
        onDismiss: () => updateWorkspaceActions({ requestingAccessWorkspaceId: undefined }),
      }),
  ]);
};
