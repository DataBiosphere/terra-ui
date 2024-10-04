import { act } from '@testing-library/react';
import { Workspaces, WorkspacesAjaxContract } from 'src/libs/ajax/workspaces/Workspaces';
import { asMockedFn, partial, renderHookInAct } from 'src/testing/test-utils';

import { useWorkspaceById } from './useWorkspaceById';

jest.mock('src/libs/ajax/workspaces/Workspaces');

describe('useWorkspaceById', () => {
  it('fetches a workspace by ID', async () => {
    // Arrange
    const getWorkspaceById = jest.fn().mockResolvedValue({});
    asMockedFn(Workspaces).mockReturnValue(partial<WorkspacesAjaxContract>({ getById: getWorkspaceById }));

    // Act
    await renderHookInAct(() => useWorkspaceById('test-workspace'));

    // Assert
    expect(getWorkspaceById).toHaveBeenCalledWith('test-workspace', undefined);
  });

  it('fetches workspace when ID changes', async () => {
    // Arrange
    const getWorkspaceById = jest.fn().mockResolvedValue({});
    asMockedFn(Workspaces).mockReturnValue(partial<WorkspacesAjaxContract>({ getById: getWorkspaceById }));

    const { rerender } = await renderHookInAct(useWorkspaceById, { initialProps: 'workspace-1' });

    // Act
    await act(async () => {
      rerender('workspace-2');
    });

    // Assert
    expect(getWorkspaceById).toHaveBeenCalledWith('workspace-2', undefined);
  });
});
