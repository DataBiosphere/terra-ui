import { Clickable, Icon, useStore, useThemeFromContext } from '@terra-ui-packages/components';
import React, { ReactNode } from 'react';
import { Store } from 'react-notifications-component';
import { cloningWorkspacesStore } from 'src/libs/state';
import {
  StateUpdateAction,
  StateUpdateListener,
  useWorkspacesStatePollingWithAction,
  WorkspaceUpdate,
} from 'src/workspaces/common/state/useWorkspaceStatePolling';
import { WorkspaceInfo } from 'src/workspaces/utils';

interface CloningWorkspaceNotificationWrapperProps {
  notificationId: string;
  backgroundColor: string;
  children?: ReactNode;
}

const CloningWorkspaceNotificationWrapper = (props: CloningWorkspaceNotificationWrapperProps): ReactNode => {
  return (
    <div
      role='alert'
      style={{
        backgroundColor: props.backgroundColor,
        borderRadius: '4px',
        boxShadow: '0 0 4px 0 rgba(0,0,0,0.5)',
        cursor: 'auto',
        display: 'flex',
        flexDirection: 'column',
        fontSize: 12,
        padding: '1rem',
        width: '100%',
      }}
    >
      <CloseNotificationButton notificationId={props.notificationId} />
      <div style={{ flexDirection: 'column' }}>{props.children}</div>
    </div>
  );
};

interface CloningWorkspaceNotificationProps {
  notificationId: string;
}

const CloneStartedNotification = (props: CloningWorkspaceNotificationProps): ReactNode => {
  const { colors } = useThemeFromContext();
  return (
    <CloningWorkspaceNotificationWrapper notificationId={props.notificationId} backgroundColor={colors.accent(0.15)}>
      <p style={{ margin: '1rem', fontWeight: 600 }}>Your Workspace is being cloned</p>
      <p>This may take a few minutes, depending on how large your workspace is</p>
    </CloningWorkspaceNotificationWrapper>
  );
};

const CloneFailedNotification = (props: CloningWorkspaceNotificationProps): ReactNode => {
  const { colors } = useThemeFromContext();
  return (
    <CloningWorkspaceNotificationWrapper notificationId={props.notificationId} backgroundColor={colors.danger(0.15)}>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyItems: 'center' }}>
        <Icon icon='warning-standard' size={20} color={colors.danger()} />
        <p style={{ margin: '1rem', fontWeight: 600 }}>Workspace Clone was unsuccessful</p>
      </div>
    </CloningWorkspaceNotificationWrapper>
  );
};

const CloneSuccessNotification = (props: CloningWorkspaceNotificationProps): ReactNode => {
  const { colors } = useThemeFromContext();
  return (
    <CloningWorkspaceNotificationWrapper notificationId={props.notificationId} backgroundColor={colors.success(0.15)}>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyItems: 'center' }}>
        <Icon icon='success-standard' size={20} color={colors.success()} />
        <p style={{ margin: '1rem', fontWeight: 600 }}>Workspace Clone successful</p>
      </div>
    </CloningWorkspaceNotificationWrapper>
  );
};

// 'The Workspace has failed to clone. Please try again.
const CloseNotificationButton = (props: { notificationId: string }): ReactNode => {
  const { colors } = useThemeFromContext();

  return (
    <Clickable
      onClick={() => Store.removeNotification(props.notificationId)}
      style={{
        cursor: 'pointer',
        alignSelf: 'end',
        fontWeight: 500,
        color: colors.dark(),
      }}
      hover={{ color: colors.dark(0.8) }}
      aria-label={`Dismiss ${props.notificationId}`}
      title='Dismiss notification'
    >
      <Icon icon='times' size={12} />
    </Clickable>
  );
};

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
  Store.addNotification({
    id: notificationId,
    title: 'Your workspace is being cloned',
    container: 'top-right',
    content: <CloneStartedNotification notificationId={notificationId} />,
    animationIn: ['animate__animated', 'animate__fadeIn'],
    animationOut: ['animate__animated', 'animate__fadeOut'],
    dismiss: { duration: 0, click: false, touch: false },
    insert: 'bottom',
    width: 350,
  });
};

const cloningFailure: StateUpdateAction = (workspace: WorkspaceInfo) => {
  const notificationId = cloningNotificationId(workspace);
  removeWorkspace(workspace);
  Store.addNotification({
    id: notificationId,
    title: 'Clone this Workspace',
    message: 'The Workspace has failed to clone. Please try again.',
    container: 'top-right',
    content: <CloneFailedNotification notificationId={notificationId} />,
    animationIn: ['animate__animated', 'animate__fadeIn'],
    animationOut: ['animate__animated', 'animate__fadeOut'],
    dismiss: { duration: 0, click: false, touch: false },
    insert: 'bottom',
    width: 350,
  });
};

const cloningSuccess: StateUpdateAction = (workspace: WorkspaceInfo) => {
  const notificationId = cloningNotificationId(workspace);
  removeWorkspace(workspace);
  Store.addNotification({
    id: notificationId,
    title: 'Your workspace cloned is complete',
    container: 'top-right',
    content: <CloneSuccessNotification notificationId={notificationId} />,
    animationIn: ['animate__animated', 'animate__fadeIn'],
    animationOut: ['animate__animated', 'animate__fadeOut'],
    insert: 'bottom',
    dismiss: { duration: 0, click: false, touch: false },
    width: 350,
  });
};

const containerCloning: StateUpdateAction = (workspace: WorkspaceInfo) => {
  updateWorkspace(workspace);
};
