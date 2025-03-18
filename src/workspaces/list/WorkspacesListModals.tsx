import React, { ReactNode, useContext } from 'react';
import LeaveResourceModal from 'src/components/LeaveResourceModal';
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews';
import { ENHANCED_WORKSPACE_CREATION } from 'src/libs/feature-previews-config';
import { goToPath } from 'src/libs/nav';
import { notifyNewWorkspaceClone } from 'src/workspaces/common/state/useCloningWorkspaceNotifications';
import { DeleteWorkspaceModal } from 'src/workspaces/DeleteWorkspaceModal/DeleteWorkspaceModal';
import { WorkspaceUserActionsContext } from 'src/workspaces/list/WorkspaceUserActions';
import LockWorkspaceModal from 'src/workspaces/LockWorkspaceModal/LockWorkspaceModal';
import { NewWorkspaceModal } from 'src/workspaces/NewWorkspaceModal/NewWorkspaceModal';
import { RequestAccessModal } from 'src/workspaces/RequestAccessModal/RequestAccessModal';
import SettingsModal from 'src/workspaces/SettingsModal/SettingsModal';
import ShareWorkspaceModal from 'src/workspaces/ShareWorkspaceModal/ShareWorkspaceModal';
import { isGoogleWorkspace, WorkspaceWrapper as Workspace } from 'src/workspaces/utils';

import NewWorkspaceWizard from '../NewWorkspaceModal/NewWorkspaceWizard';

interface WorkspacesListModalsProps {
  getWorkspace: (string) => Workspace;
  refreshWorkspaces: () => void;
}

export const WorkspacesListModals = (props: WorkspacesListModalsProps): ReactNode => {
  const { getWorkspace, refreshWorkspaces } = props;
  const { userActions, setUserActions } = useContext(WorkspaceUserActionsContext);

  return (
    <>
      {userActions.creatingNewWorkspace && isFeaturePreviewEnabled(ENHANCED_WORKSPACE_CREATION) && (
        <NewWorkspaceWizard
          onDismiss={() => setUserActions({ creatingNewWorkspace: false })}
          onSuccess={({ namespace, name }) => goToPath('workspace-dashboard', { namespace, name })}
        />
      )}
      {userActions.creatingNewWorkspace && !isFeaturePreviewEnabled(ENHANCED_WORKSPACE_CREATION) && (
        <NewWorkspaceModal
          onDismiss={() => setUserActions({ creatingNewWorkspace: false })}
          onSuccess={({ namespace, name }) => goToPath('workspace-dashboard', { namespace, name })}
        />
      )}
      {!!userActions.cloningWorkspace && !isFeaturePreviewEnabled(ENHANCED_WORKSPACE_CREATION) && (
        <NewWorkspaceModal
          cloneWorkspace={userActions.cloningWorkspace}
          onDismiss={() => setUserActions({ cloningWorkspace: undefined })}
          onSuccess={(ws) => {
            if (userActions.cloningWorkspace && isGoogleWorkspace(userActions.cloningWorkspace)) {
              goToPath('workspace-dashboard', { namespace: ws.namespace, name: ws.name });
            } else {
              refreshWorkspaces();
              setUserActions({ cloningWorkspace: undefined });
              notifyNewWorkspaceClone(ws);
            }
          }}
        />
      )}
      {!!userActions.cloningWorkspace && isFeaturePreviewEnabled(ENHANCED_WORKSPACE_CREATION) && (
        <NewWorkspaceWizard
          cloneWorkspace={userActions.cloningWorkspace}
          onDismiss={() => setUserActions({ cloningWorkspace: undefined })}
          onSuccess={(ws) => {
            if (userActions.cloningWorkspace && isGoogleWorkspace(userActions.cloningWorkspace)) {
              goToPath('workspace-dashboard', { namespace: ws.namespace, name: ws.name });
            } else {
              refreshWorkspaces();
              setUserActions({ cloningWorkspace: undefined });
              notifyNewWorkspaceClone(ws);
            }
          }}
        />
      )}
      {!!userActions.deletingWorkspaceId && (
        <DeleteWorkspaceModal
          workspace={getWorkspace(userActions.deletingWorkspaceId)}
          onDismiss={() => setUserActions({ deletingWorkspaceId: undefined })}
          onSuccess={refreshWorkspaces}
        />
      )}
      {!!userActions.lockingWorkspaceId && (
        <LockWorkspaceModal
          workspace={getWorkspace(userActions.lockingWorkspaceId)}
          onDismiss={() => setUserActions({ lockingWorkspaceId: undefined })}
          onSuccess={refreshWorkspaces}
        />
      )}
      {!!userActions.sharingWorkspace && (
        <ShareWorkspaceModal
          workspace={userActions.sharingWorkspace}
          onDismiss={() => setUserActions({ sharingWorkspace: undefined })}
        />
      )}
      {!!userActions.leavingWorkspaceId && (
        <LeaveResourceModal
          samResourceId={userActions.leavingWorkspaceId}
          samResourceType='workspace'
          displayName='workspace'
          onDismiss={() => setUserActions({ leavingWorkspaceId: undefined })}
          onSuccess={refreshWorkspaces}
        />
      )}
      {!!userActions.requestingAccessWorkspaceId && (
        <RequestAccessModal
          workspace={getWorkspace(userActions.requestingAccessWorkspaceId)}
          onDismiss={() => setUserActions({ requestingAccessWorkspaceId: undefined })}
          refreshWorkspaces={refreshWorkspaces}
        />
      )}
      {!!userActions.showSettingsWorkspaceId && (
        <SettingsModal
          workspace={getWorkspace(userActions.showSettingsWorkspaceId)}
          onDismiss={() => setUserActions({ showSettingsWorkspaceId: undefined })}
        />
      )}
    </>
  );
};
