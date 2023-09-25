import { Fragment, ReactNode, useContext } from 'react';
import { h } from 'react-hyperscript-helpers';
import LeaveResourceModal from 'src/components/LeaveResourceModal';
import NewWorkspaceModal from 'src/components/NewWorkspaceModal';
import { goToPath } from 'src/libs/nav';
import { WorkspaceWrapper as Workspace } from 'src/libs/workspace-utils';
import DeleteWorkspaceModal from 'src/pages/workspaces/workspace/DeleteWorkspaceModal';
import LockWorkspaceModal from 'src/pages/workspaces/workspace/LockWorkspaceModal';
import { RequestAccessModal } from 'src/pages/workspaces/workspace/RequestAccessModal';
import ShareWorkspaceModal from 'src/pages/workspaces/workspace/ShareWorkspaceModal/ShareWorkspaceModal';
import { WorkspaceUserActionsContext } from 'src/pages/workspaces/WorkspacesList/WorkspaceUserActions';

interface WorkspacesListModalsProps {
  getWorkspace: (string) => Workspace;
  refreshWorkspaces: () => void;
}

export const WorkspacesListModals = (props: WorkspacesListModalsProps): ReactNode => {
  const { getWorkspace, refreshWorkspaces } = props;
  const { userActions, setUserActions } = useContext(WorkspaceUserActionsContext);

  return h(Fragment, [
    userActions.creatingNewWorkspace &&
      h(NewWorkspaceModal, {
        onDismiss: () => setUserActions({ creatingNewWorkspace: false }),
        onSuccess: ({ namespace, name }) => goToPath('workspace-dashboard', { namespace, name }),
      }),
    !!userActions.cloningWorkspaceId &&
      h(NewWorkspaceModal, {
        cloneWorkspace: getWorkspace(userActions.cloningWorkspaceId),
        onDismiss: () => setUserActions({ cloningWorkspaceId: undefined }),
        onSuccess: ({ namespace, name }) => goToPath('workspace-dashboard', { namespace, name }),
      }),
    !!userActions.deletingWorkspaceId &&
      h(DeleteWorkspaceModal, {
        workspace: getWorkspace(userActions.deletingWorkspaceId) as any,
        onDismiss: () => setUserActions({ deletingWorkspaceId: undefined }),
        onSuccess: refreshWorkspaces,
      }),
    !!userActions.lockingWorkspaceId &&
      h(LockWorkspaceModal, {
        workspace: getWorkspace(userActions.lockingWorkspaceId) as any,
        onDismiss: () => setUserActions({ lockingWorkspaceId: undefined }),
        onSuccess: refreshWorkspaces,
      }),
    !!userActions.sharingWorkspace &&
      h(ShareWorkspaceModal, {
        workspace: userActions.sharingWorkspace,
        onDismiss: () => setUserActions({ sharingWorkspace: undefined }),
      }),
    !!userActions.leavingWorkspaceId &&
      h(LeaveResourceModal, {
        samResourceId: userActions.leavingWorkspaceId,
        samResourceType: 'workspace',
        displayName: 'workspace',
        onDismiss: () => setUserActions({ leavingWorkspaceId: undefined }),
        onSuccess: refreshWorkspaces,
      }),
    !!userActions.requestingAccessWorkspaceId &&
      h(RequestAccessModal, {
        workspace: getWorkspace(userActions.requestingAccessWorkspaceId),
        onDismiss: () => setUserActions({ requestingAccessWorkspaceId: undefined }),
      }),
  ]);
};
