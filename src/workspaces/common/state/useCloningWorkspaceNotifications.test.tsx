import { DeepPartial } from '@terra-ui-packages/core-utils';
import { NotificationType } from '@terra-ui-packages/notifications';
import { waitFor } from '@testing-library/react';
import React from 'react';
import { Ajax } from 'src/libs/ajax';
import { clearNotification, notify } from 'src/libs/notifications';
import { cloningWorkspacesStore } from 'src/libs/state';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultAzureWorkspace } from 'src/testing/workspace-fixtures';
import {
  notifyNewWorkspaceClone,
  useCloningWorkspaceNotifications,
} from 'src/workspaces/common/state/useCloningWorkspaceNotifications';
import { WORKSPACE_UPDATE_POLLING_INTERVAL } from 'src/workspaces/common/state/useWorkspaceStatePolling';
import { WorkspaceInfo, WorkspaceState, WorkspaceWrapper } from 'src/workspaces/utils';

type AjaxContract = ReturnType<typeof Ajax>;
type AjaxWorkspacesContract = AjaxContract['Workspaces'];

jest.mock('src/libs/ajax', (): typeof import('src/libs/ajax') => {
  return {
    ...jest.requireActual('src/libs/ajax'),
    Ajax: jest.fn(),
  };
});

type NotificationExports = typeof import('src/libs/notifications');
jest.mock<NotificationExports>(
  'src/libs/notifications',
  (): NotificationExports => ({
    ...jest.requireActual('src/libs/notifications'),
    notify: jest.fn(),
    clearNotification: jest.fn(),
  })
);
// notify
const CloningTestComponent = (): React.ReactNode => {
  useCloningWorkspaceNotifications();
  return null;
};

describe('useCloningWorkspaceNotifications', () => {
  beforeEach(() => {
    cloningWorkspacesStore.set([]);
    jest.useFakeTimers();
  });

  describe('notifyNewWorkspaceClone', () => {
    it('adds the workspace to the cloning store', () => {
      // Arrange
      const clone: WorkspaceInfo = {
        ...defaultAzureWorkspace.workspace,
        state: 'Cloning',
      };
      // Act
      notifyNewWorkspaceClone(clone);

      // Assert
      expect(cloningWorkspacesStore.get()).toEqual([clone]);
    });

    it('creates a notification that the clone has started', () => {
      // Arrange
      const clone: WorkspaceInfo = {
        ...defaultAzureWorkspace.workspace,
        state: 'Cloning',
      };
      // Act
      notifyNewWorkspaceClone(clone);

      // Assert
      expect(asMockedFn(notify)).toHaveBeenCalledWith('info', expect.any(Object), {
        id: expect.any(String),
        message: expect.any(Object),
      });
    });
  });

  it.each<{
    updatedState: WorkspaceState;
    notificationType?: NotificationType;
  }>([
    { updatedState: 'CloningFailed', notificationType: 'error' },
    { updatedState: 'Ready', notificationType: 'success' },
  ])(
    'removes the workspace in the store and sends a $notificationType notification when the workspace is updated to $updatedState',
    async ({ updatedState, notificationType }) => {
      // Arrange
      const clone: WorkspaceInfo = { ...defaultAzureWorkspace.workspace, state: 'Cloning' };
      cloningWorkspacesStore.set([clone]);
      const update: DeepPartial<WorkspaceWrapper> = {
        workspace: {
          workspaceId: defaultAzureWorkspace.workspace.workspaceId,
          state: updatedState,
        },
      };
      const mockDetailsFn = jest.fn().mockResolvedValue(update);
      const mockAjax: DeepPartial<AjaxContract> = {
        Workspaces: {
          workspace: () =>
            ({
              details: mockDetailsFn,
            } as Partial<AjaxWorkspacesContract['workspace']>),
        },
      };
      asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

      // Act
      render(<CloningTestComponent />);
      await waitFor(() => expect(mockDetailsFn).toBeCalledTimes(1));
      jest.advanceTimersByTime(WORKSPACE_UPDATE_POLLING_INTERVAL);

      // Assert
      // still only called once
      await waitFor(() => expect(mockDetailsFn).toBeCalledTimes(1));
      expect(cloningWorkspacesStore.get()).toHaveLength(0);
      expect(asMockedFn(clearNotification)).toHaveBeenCalledWith(
        expect.stringContaining(`${clone.namespace}/${clone.name}`)
      );
      expect(asMockedFn(notify)).toHaveBeenCalledWith(notificationType, expect.any(Object), { id: expect.any(String) });
    }
  );

  it.each<{
    state: WorkspaceState;
  }>([{ state: 'Cloning' }, { state: 'CloningContainer' }])(
    'continues polling when the workspace is in $state',
    async ({ state }) => {
      // Arrange
      const clone: WorkspaceInfo = { ...defaultAzureWorkspace.workspace, state };
      cloningWorkspacesStore.set([clone]);
      const update: DeepPartial<WorkspaceWrapper> = {
        workspace: {
          workspaceId: defaultAzureWorkspace.workspace.workspaceId,
          state,
        },
      };
      const mockDetailsFn = jest.fn().mockImplementation(() => Promise.resolve(update));
      const mockAjax: DeepPartial<AjaxContract> = {
        Workspaces: {
          workspace: () => ({ details: mockDetailsFn }),
        },
      };
      asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);
      jest.useFakeTimers();
      // Act
      render(<CloningTestComponent />);

      await (() => Promise.resolve());
      await waitFor(() => expect(mockDetailsFn).toBeCalledTimes(1));
      jest.advanceTimersByTime(WORKSPACE_UPDATE_POLLING_INTERVAL);
      await (() => Promise.resolve());

      // Assert
      await waitFor(() => expect(mockDetailsFn).toBeCalledTimes(2));
      expect(cloningWorkspacesStore.get()).toHaveLength(1);
      expect(asMockedFn(clearNotification)).not.toHaveBeenCalled();
      expect(asMockedFn(notify)).not.toHaveBeenCalled();
    }
  );

  it('updates the workspace when the state is updated to to CloningContainer', async () => {
    // Arrange
    const clone: WorkspaceInfo = { ...defaultAzureWorkspace.workspace, state: 'Cloning' };
    cloningWorkspacesStore.set([clone]);
    const update: DeepPartial<WorkspaceWrapper> = {
      workspace: {
        workspaceId: defaultAzureWorkspace.workspace.workspaceId,
        state: 'CloningContainer',
      },
    };
    const mockDetailsFn = jest.fn().mockResolvedValue(update);
    const mockAjax: DeepPartial<AjaxContract> = {
      Workspaces: {
        workspace: () =>
          ({
            details: mockDetailsFn,
          } as Partial<AjaxWorkspacesContract['workspace']>),
      },
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);
    jest.useFakeTimers();

    // Act
    render(<CloningTestComponent />);
    await waitFor(() => expect(mockDetailsFn).toBeCalledTimes(1));

    // Assert
    expect(cloningWorkspacesStore.get()).toHaveLength(1);
    await waitFor(() => expect(cloningWorkspacesStore.get()[0].state).toBe('CloningContainer'));
  });
});
