import { DeepPartial, ErrorState, ReadyState } from '@terra-ui-packages/core-utils';
import { WorkspaceWrapper } from 'src/libs/workspace-utils';
import { asMockedFn, renderHookInAct } from 'src/testing/test-utils';
import { useWorkspacesData, UseWorkspacesDataArgs } from 'src/workspaces/useWorkspacesData';

describe('useWorkspacesData hook', () => {
  it('lists basic results and calls onSuccess', async () => {
    // Arrange
    const getData: UseWorkspacesDataArgs['getData'] = jest.fn();
    asMockedFn(getData).mockResolvedValue([{ workspace: { name: 'myWorkspace' } } as WorkspaceWrapper]);
    const onSuccess = jest.fn();
    const onError = jest.fn();

    // Act
    const hookRender1 = await renderHookInAct(() =>
      useWorkspacesData({
        getData,
        onSuccess,
        onError,
      })
    );

    // Assert
    const expectedWorkspaces: DeepPartial<WorkspaceWrapper>[] = [{ workspace: { name: 'myWorkspace' } }];
    const expectedSuccessState: ReadyState<WorkspaceWrapper[]> = {
      status: 'Ready',
      state: [{ workspace: { name: 'myWorkspace' } } as WorkspaceWrapper],
    };
    expect(hookRender1.result.current.workspaces).toEqual(expectedWorkspaces);
    expect(getData).toBeCalledTimes(1);
    expect(onSuccess).toBeCalledTimes(1);
    expect(onSuccess).toBeCalledWith(expectedSuccessState);
    expect(onError).toBeCalledTimes(0);
  });

  it('handles error and calls onError', async () => {
    // Arrange
    const getData: UseWorkspacesDataArgs['getData'] = jest.fn();
    asMockedFn(getData).mockRejectedValue(new Error('BOOM!'));
    const onSuccess = jest.fn();
    const onError = jest.fn();

    // Act
    const hookRender1 = await renderHookInAct(() =>
      useWorkspacesData({
        getData,
        onSuccess,
        onError,
      })
    );

    // Assert
    expect(hookRender1.result.current.workspaces).toEqual([]);
    expect(getData).toBeCalledTimes(1);
    expect(onSuccess).toBeCalledTimes(0);
    expect(onError).toBeCalledTimes(1);
    const expectedErrorState: ErrorState<string> = {
      status: 'Error',
      state: null,
      error: new Error('BOOM!'),
    };
    expect(onError).toBeCalledWith(expectedErrorState);
  });
});
