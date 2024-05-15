import { Fragment, ReactNode, useContext } from 'react';
import { h } from 'react-hyperscript-helpers';
import LeaveResourceModal from 'src/components/LeaveResourceModal';
import { goToPath } from 'src/libs/nav';
import DeleteWorkspaceModal from 'src/workspaces/DeleteWorkspaceModal/DeleteWorkspaceModal';
import { WorkspaceUserActionsContext } from 'src/workspaces/list/WorkspaceUserActions';
import LockWorkspaceModal from 'src/workspaces/LockWorkspaceModal/LockWorkspaceModal';
import NewWorkspaceModal from 'src/workspaces/NewWorkspaceModal/NewWorkspaceModal';
import { RequestAccessModal } from 'src/workspaces/RequestAccessModal/RequestAccessModal';
import ShareWorkspaceModal from 'src/workspaces/ShareWorkspaceModal/ShareWorkspaceModal';
import { WorkspaceWrapper as Workspace } from 'src/workspaces/utils';

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
    !!userActions.cloningWorkspace &&
      h(NewWorkspaceModal, {
        cloneWorkspace: userActions.cloningWorkspace,
        onDismiss: () => setUserActions({ cloningWorkspace: undefined }),
        onSuccess: () => {
          refreshWorkspaces();
          setUserActions({ cloningWorkspace: undefined });
        },
      }),
    !!userActions.deletingWorkspaceId &&
      h(DeleteWorkspaceModal, {
        workspace: getWorkspace(userActions.deletingWorkspaceId),
        onDismiss: () => setUserActions({ deletingWorkspaceId: undefined }),
        onSuccess: refreshWorkspaces,
      }),
    !!userActions.lockingWorkspaceId &&
      h(LockWorkspaceModal, {
        // @ts-expect-error
        workspace: getWorkspace(userActions.lockingWorkspaceId),
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
