import React, { ReactNode } from 'react';
import LeaveResourceModal from 'src/components/LeaveResourceModal';
import * as Nav from 'src/libs/nav';
import { notifyNewWorkspaceClone } from 'src/workspaces/common/state/useCloningWorkspaceNotifications';
import { InitializedWorkspaceWrapper } from 'src/workspaces/common/state/useWorkspace';
import DeleteWorkspaceModal from 'src/workspaces/DeleteWorkspaceModal/DeleteWorkspaceModal';
import LockWorkspaceModal from 'src/workspaces/LockWorkspaceModal/LockWorkspaceModal';
import { NewWorkspaceModal } from 'src/workspaces/NewWorkspaceModal/NewWorkspaceModal';
import SettingsModal from 'src/workspaces/SettingsModal/SettingsModal';
import ShareWorkspaceModal from 'src/workspaces/ShareWorkspaceModal/ShareWorkspaceModal';
import { isGoogleWorkspace } from 'src/workspaces/utils';

export interface WorkspaceContainerModalsProps {
  workspace: InitializedWorkspaceWrapper;
  refreshWorkspace: () => void;
  deletingWorkspace: boolean;
  setDeletingWorkspace: (value: boolean) => void;
  cloningWorkspace: boolean;
  setCloningWorkspace: (value: boolean) => void;
  leavingWorkspace: boolean;
  setLeavingWorkspace: (value: boolean) => void;
  sharingWorkspace: boolean;
  setSharingWorkspace: (value: boolean) => void;
  showLockWorkspaceModal: boolean;
  setShowLockWorkspaceModal: (value: boolean) => void;
  showSettingsModal: boolean;
  setShowSettingsModal: (value: boolean) => void;
}
export const WorkspaceContainerModals = (props: WorkspaceContainerModalsProps): ReactNode => {
  const {
    workspace,
    refreshWorkspace,
    deletingWorkspace,
    setDeletingWorkspace,
    cloningWorkspace,
    setCloningWorkspace,
    leavingWorkspace,
    setLeavingWorkspace,
    sharingWorkspace,
    setSharingWorkspace,
    showLockWorkspaceModal,
    setShowLockWorkspaceModal,
    showSettingsModal,
    setShowSettingsModal,
  } = props;
  return (
    <>
      {deletingWorkspace && (
        <DeleteWorkspaceModal
          workspace={workspace}
          onDismiss={() => setDeletingWorkspace(false)}
          onSuccess={() => Nav.goToPath('workspaces')}
        />
      )}
      {cloningWorkspace && (
        <NewWorkspaceModal
          cloneWorkspace={workspace}
          onDismiss={() => setCloningWorkspace(false)}
          onSuccess={(clonedWorkspace) => {
            if (workspace && isGoogleWorkspace(workspace)) {
              Nav.goToPath('workspace-dashboard', { namespace: clonedWorkspace.namespace, name: clonedWorkspace.name });
            } else {
              setCloningWorkspace(false);
              notifyNewWorkspaceClone(clonedWorkspace);
            }
          }}
        />
      )}
      {showLockWorkspaceModal && (
        <LockWorkspaceModal
          workspace={workspace}
          onDismiss={() => setShowLockWorkspaceModal(false)}
          onSuccess={() => refreshWorkspace()}
        />
      )}
      {leavingWorkspace && (
        <LeaveResourceModal
          samResourceId={workspace.workspace.workspaceId}
          samResourceType='workspace'
          displayName='workspace'
          onDismiss={() => setLeavingWorkspace(false)}
          onSuccess={() => Nav.goToPath('workspaces')}
        />
      )}
      {sharingWorkspace && <ShareWorkspaceModal workspace={workspace} onDismiss={() => setSharingWorkspace(false)} />}
      {showSettingsModal && <SettingsModal onDismiss={() => setShowSettingsModal(false)} />}
    </>
  );
};
