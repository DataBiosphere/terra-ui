import { asMockedFn, renderHookInAct } from 'src/testing/test-utils';
import { useWorkspaces } from 'src/workspaces/useWorkspaces';
import { makeUseWorkspaces, WorkspaceDataProviderNeeds } from 'src/workspaces/useWorkspaces.composable';

describe('useWorkspaces (composable)', () => {
  it('lists basic results', async () => {
    // Arrange
    const mockProvider: WorkspaceDataProviderNeeds = {
      list: jest.fn(),
    };
    asMockedFn(mockProvider.list).mockResolvedValue([]);

    const useWorkspaces = makeUseWorkspaces({ workspaceProvider: mockProvider });

    // Act
    const hookResult1 = await renderHookInAct(useWorkspaces);

    // Assert
    expect(hookResult1.result.current.workspaces).toEqual([]);
    expect(mockProvider.list).toBeCalledTimes(1);
  });
});

describe('useWorkspaces (composed)', () => {
  it('is composed for Terra UI app', () => {
    // Just making a simple check that the composed export is initialized without issue.

    // Assert
    expect(useWorkspaces).toBeTruthy();
    expect(useWorkspaces).toBeTruthy();
  });
});
