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
  notify('info', <NotificationTitle>Workspace is being cloned</NotificationTitle>, {
    id: notificationId,
    message: (
      <div style={{ margin: '.5rem' }}>Depending on the size of your workspace, this may take a few minutes.</div>
    ),
  });
};

const cloningFailure: StateUpdateAction = (workspace: WorkspaceInfo) => {
  const notificationId = cloningNotificationId(workspace);
  removeWorkspace(workspace);
  notify('error', <NotificationTitle>Workspace clone was unsuccessful</NotificationTitle>, { id: notificationId });
};

const cloningSuccess: StateUpdateAction = (workspace: WorkspaceInfo) => {
  const notificationId = cloningNotificationId(workspace);
  removeWorkspace(workspace);
  notify('success', <NotificationTitle>Workspace clone successful</NotificationTitle>, { id: notificationId });
};

const containerCloning: StateUpdateAction = (workspace: WorkspaceInfo) => {
  updateWorkspace(workspace);
};

const NotificationTitle = (props: { children: React.ReactNode }) => (
  <div style={{ lineHeight: '26px', fontWeight: 600 }}>{props.children}</div>
);
