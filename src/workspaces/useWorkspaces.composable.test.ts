import { DeepPartial } from '@terra-ui-packages/core-utils';
import { useState } from 'react';
import { WorkspaceWrapper } from 'src/libs/workspace-utils';
import { asMockedFn, renderHookInAct } from 'src/testing/test-utils';
import { makeUseWorkspaces, WorkspaceDataProviderNeeds } from 'src/workspaces/useWorkspaces.composable';

describe('useWorkspaces (composable)', () => {
  it('lists basic results', async () => {
    // Arrange
    const mockProvider: WorkspaceDataProviderNeeds = {
      list: jest.fn(),
    };
    asMockedFn(mockProvider.list).mockResolvedValue([
      {
        workspace: {
          name: 'myWorkspace',
        },
      } satisfies DeepPartial<WorkspaceWrapper> as WorkspaceWrapper,
    ]);

    const useWorkspaces = makeUseWorkspaces({
      workspaceProvider: mockProvider,
      useWorkspacesState: () => useState<WorkspaceWrapper[]>([]),
    });

    // Act
    const hookResult1 = await renderHookInAct(useWorkspaces);

    // Assert
    expect(hookResult1.result.current.workspaces).toEqual([{ workspace: { name: 'myWorkspace' } }]);
    expect(mockProvider.list).toBeCalledTimes(1);
  });
});
