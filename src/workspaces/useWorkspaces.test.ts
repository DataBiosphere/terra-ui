import { DeepPartial } from '@terra-ui-packages/core-utils';
import { act, renderHook } from '@testing-library/react';
import { workspaceProvider } from 'src/libs/ajax/workspaces/providers/WorkspaceProvider';
import { WorkspaceWrapper } from 'src/libs/workspace-utils';
import { useWorkspaces, useWorkspacesComposer, useWorkspacesState } from 'src/workspaces/useWorkspaces';
import { makeUseWorkspaces } from 'src/workspaces/useWorkspaces.composable';

type UseWorkspacesComposableExports = typeof import('src/workspaces/useWorkspaces.composable');
jest.mock('src/workspaces/useWorkspaces.composable', (): UseWorkspacesComposableExports => {
  const { asMockedFn } = jest.requireActual<typeof import('src/testing/test-utils')>('src/testing/test-utils');
  const mock: UseWorkspacesComposableExports = {
    ...jest.requireActual<UseWorkspacesComposableExports>('src/workspaces/useWorkspaces.composable'),
    makeUseWorkspaces: jest.fn(),
  };
  asMockedFn(mock.makeUseWorkspaces).mockReturnValue(() => ({
    workspaces: [],
    refresh: () => Promise.resolve(),
    loading: false,
  }));
  return mock;
});

describe('useWorkspaces (composed)', () => {
  it('is composed for Terra UI app', () => {
    // Act
    const myHook = useWorkspacesComposer.make();

    // Assert
    expect(myHook).toBeTruthy();
    expect(makeUseWorkspaces).toBeCalledTimes(1);
    expect(makeUseWorkspaces).toBeCalledWith({
      workspaceProvider,
      useWorkspacesState,
    });
    // also check that the composed export is initialized without issue
    expect(useWorkspaces).toBeTruthy();
  });
});

describe('useWorkspacesState', () => {
  it('holds state', () => {
    // Arrange
    const hookResult = renderHook(() => useWorkspacesState());

    const [value1, setValue] = hookResult.result.current;

    const workspace1 = {
      workspace: {
        name: 'myWorkspace',
      },
    } satisfies DeepPartial<WorkspaceWrapper> as WorkspaceWrapper;

    // Act
    act(() => {
      setValue([workspace1]);
      hookResult.rerender();
    });

    // Assert
    const [value2] = hookResult.result.current;

    expect(value1).toEqual([]);
    expect(value2).toEqual([workspace1]);
  });
});
