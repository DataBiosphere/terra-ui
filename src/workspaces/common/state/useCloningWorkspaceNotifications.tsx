import { useStore } from '@terra-ui-packages/components';
import React from 'react';
import { notify } from 'src/libs/notifications';
import { cloningWorkspacesStore } from 'src/libs/state';
import {
  StateUpdateAction,
  StateUpdateListener,
  useWorkspacesStatePollingWithAction,
  WorkspaceUpdate,
} from 'src/workspaces/common/state/useWorkspaceStatePolling';
import { WorkspaceInfo } from 'src/workspaces/utils';

const cloningNotificationId = (workspace: WorkspaceInfo | WorkspaceUpdate) =>
  `${workspace.namespace}/${workspace.name}-clone-${workspace.state}`;

const updateWorkspace = (update: WorkspaceInfo) =>
  cloningWorkspacesStore.update((workspaces) =>
    workspaces.map((ws) => {
      if (ws.workspaceId === update.workspaceId) {
        return update;
      }
      return ws;
    })
  );

const removeWorkspace = (remove: WorkspaceInfo) =>
  cloningWorkspacesStore.update((workspaces) => workspaces.filter((ws) => ws.workspaceId !== remove.workspaceId));

const addWorkspace = (workspace: WorkspaceInfo) =>
  cloningWorkspacesStore.update((workspaces) => workspaces.concat(workspace));

/*
 * A simple hook that polls for the state of cloning workspaces, and adds notifications when the state changes
 * This uses a separate store, so the cloning workspaces can be tracked even if the main workspaces store is not initialized
 */
export const useCloningWorkspaceNotifications = (): void => {
  const cloningStore = useStore(cloningWorkspacesStore);

  const listener: StateUpdateListener = {
    CloningContainer: [containerCloning],
    CloningFailed: [cloningFailure],
    Ready: [cloningSuccess],
  };
  useWorkspacesStatePollingWithAction(cloningStore, listener);
};

// adds a newly cloned workspace to the cloning store and give the corresponding notification
export const notifyNewWorkspaceClone = (workspace: WorkspaceInfo) => {
  addWorkspace(workspace);
  const notificationId = cloningNotificationId(workspace);
  const startComponent = (
    <div style={{ margin: '.5rem', display: 'flex', flexDirection: 'column' }}>
      <p style={{ fontWeight: 600 }}>Your workspace is being cloned</p>
      <p style={{ fontWeight: 400 }}>This may take a few minutes, depending on how large your workspace is</p>
    </div>
  );
  notify('info', startComponent, { id: notificationId });
};

const cloningFailure: StateUpdateAction = (workspace: WorkspaceInfo) => {
  const notificationId = cloningNotificationId(workspace);
  removeWorkspace(workspace);
  notify('error', <div style={{ marginTop: '.5rem', fontWeight: 600 }}>Workspace clone was unsuccessful</div>, {
    id: notificationId,
  });
};

const cloningSuccess: StateUpdateAction = (workspace: WorkspaceInfo) => {
  const notificationId = cloningNotificationId(workspace);
  removeWorkspace(workspace);
  notify('success', <div style={{ margin: '.5rem', fontWeight: 600 }}>Workspace clone successful</div>, {
    id: notificationId,
  });
};

const containerCloning: StateUpdateAction = (workspace: WorkspaceInfo) => {
  updateWorkspace(workspace);
};
