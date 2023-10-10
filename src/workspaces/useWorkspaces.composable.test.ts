import { atom, DeepPartial } from '@terra-ui-packages/core-utils';
import { useSettableStore } from 'src/libs/react-utils';
import { WorkspaceWrapper } from 'src/libs/workspace-utils';
import { asMockedFn, renderHookInAct } from 'src/testing/test-utils';
import {
  useWorkspacesComposable,
  UseWorkspacesDeps,
  UseWorkspacesStateResult,
  WorkspaceDataProviderNeeds,
} from 'src/workspaces/useWorkspaces.composable';

describe('useWorkspaces (composable)', () => {
  it('lists basic results and reflects state to store', async () => {
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

    const store = atom<WorkspaceWrapper[]>([]);
    const useMockStore: UseWorkspacesDeps['useWorkspacesStore'] = () => useSettableStore(store);

    const useWorkspaces = (): UseWorkspacesStateResult =>
      useWorkspacesComposable({
        workspaceProvider: mockProvider,
        useWorkspacesStore: useMockStore,
      });

    // Act
    const hookRender1 = await renderHookInAct(useWorkspaces);

    // Assert
    const expectedWorkspaces: DeepPartial<WorkspaceWrapper>[] = [{ workspace: { name: 'myWorkspace' } }];

    expect(hookRender1.result.current.workspaces).toEqual(expectedWorkspaces);
    expect(mockProvider.list).toBeCalledTimes(1);
    expect(store.get()).toEqual(expectedWorkspaces);
  });
  it('works stubbed workspaces store', async () => {
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

    // const store = atom<WorkspaceWrapper[]>([]);
    let store: WorkspaceWrapper[] = [];
    const useStubbedStore: UseWorkspacesDeps['useWorkspacesStore'] = () => [
      store,
      (v) => {
        store = v;
      },
    ];

    const useWorkspaces = (): UseWorkspacesStateResult =>
      useWorkspacesComposable({
        workspaceProvider: mockProvider,
        useWorkspacesStore: useStubbedStore,
      });

    // Act
    const hookRender1 = await renderHookInAct(useWorkspaces);

    // Assert
    const expectedWorkspaces: DeepPartial<WorkspaceWrapper>[] = [{ workspace: { name: 'myWorkspace' } }];

    expect(hookRender1.result.current.workspaces).toEqual(expectedWorkspaces);
    expect(mockProvider.list).toBeCalledTimes(1);
    expect(store).toEqual(expectedWorkspaces);
  });
});
