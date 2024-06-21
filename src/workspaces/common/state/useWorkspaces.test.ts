import { DeepPartial } from '@terra-ui-packages/core-utils';
import { workspaceProvider } from 'src/libs/ajax/workspaces/providers/WorkspaceProvider';
import { workspacesStore } from 'src/libs/state';
import {
  asMockedFn,
  mockNotifications,
  renderHookInActWithAppContexts as renderHookInAct,
} from 'src/testing/test-utils';
import { useWorkspaces } from 'src/workspaces/common/state/useWorkspaces';
import { WorkspaceWrapper } from 'src/workspaces/utils';

type WorkspaceProviderExports = typeof import('src/libs/ajax/workspaces/providers/WorkspaceProvider');
jest.mock(
  'src/libs/ajax/workspaces/providers/WorkspaceProvider',
  (): WorkspaceProviderExports => ({
    workspaceProvider: {
      list: jest.fn(),
    },
  })
);

describe('useWorkspaces hook', () => {
  beforeEach(() => {
    workspacesStore.set([]);
  });
  it('calls workspaces provider and retains state in workspacesStore', async () => {
    // Arrange
    asMockedFn(workspaceProvider.list).mockResolvedValue([
      { workspace: { name: 'myWorkspace' } } satisfies DeepPartial<WorkspaceWrapper> as WorkspaceWrapper,
    ]);

    // Act
    const hookRender = await renderHookInAct(useWorkspaces);
    const hookResult1 = hookRender.result.current;

    // Assert
    const expectedWorkspaces: DeepPartial<WorkspaceWrapper>[] = [{ workspace: { name: 'myWorkspace' } }];
    expect(workspaceProvider.list).toBeCalledTimes(1);
    expect(hookResult1.workspaces).toEqual(expectedWorkspaces);
    expect(workspacesStore.get()).toEqual(expectedWorkspaces);
  });

  it('handles error', async () => {
    // Arrange
    asMockedFn(workspaceProvider.list).mockRejectedValue(new Error('BOOM!'));
    // silence error log to console
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    const hookRender = await renderHookInAct(useWorkspaces);
    const hookResult1 = hookRender.result.current;

    // Assert
    expect(workspaceProvider.list).toBeCalledTimes(1);
    expect(hookResult1.workspaces).toEqual([]);
    expect(workspacesStore.get()).toEqual([]);
    expect(mockNotifications.notify).toBeCalledTimes(1);
    expect(mockNotifications.notify).toBeCalledWith('error', 'Error loading workspace list', { detail: undefined });
  });
});
