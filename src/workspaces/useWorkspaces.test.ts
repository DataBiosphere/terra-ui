import { DeepPartial } from '@terra-ui-packages/core-utils';
import { workspaceProvider } from 'src/libs/ajax/workspaces/providers/WorkspaceProvider';
import { workspacesStore } from 'src/libs/state';
import { WorkspaceWrapper } from 'src/libs/workspace-utils';
import { asMockedFn, renderHookInAct } from 'src/testing/test-utils';
import { useWorkspaces } from 'src/workspaces/useWorkspaces';

type WorkspaceProviderExports = typeof import('src/libs/ajax/workspaces/providers/WorkspaceProvider');
jest.mock(
  'src/libs/ajax/workspaces/providers/WorkspaceProvider',
  (): WorkspaceProviderExports => ({
    workspaceProvider: {
      list: jest.fn(),
    },
  })
);

describe('useWorkspaces (composed)', () => {
  it('calls workspaces provider and retains state in workspacesStore', async () => {
    // Arrange

    asMockedFn(workspaceProvider.list).mockResolvedValue([
      { workspace: { name: 'myWorkspace' } } satisfies DeepPartial<WorkspaceWrapper> as WorkspaceWrapper,
    ]);

    // Act
    const hookRender1 = await renderHookInAct(useWorkspaces);

    // Assert
    const expectedWorkspaces: DeepPartial<WorkspaceWrapper>[] = [{ workspace: { name: 'myWorkspace' } }];
    expect(workspaceProvider.list).toBeCalledTimes(1);
    expect(hookRender1.result.current.workspaces).toEqual(expectedWorkspaces);
    expect(workspacesStore.get()).toEqual(expectedWorkspaces);
  });
});
