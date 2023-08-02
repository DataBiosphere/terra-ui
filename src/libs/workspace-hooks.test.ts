import { act } from '@testing-library/react';
import { Ajax } from 'src/libs/ajax';
import { DeepPartial } from 'src/libs/type-utils/deep-partial';
import { asMockedFn, renderHookInAct } from 'src/testing/test-utils';

import { useWorkspaceById } from './workspace-hooks';

type AjaxExports = typeof import('src/libs/ajax');
jest.mock('src/libs/ajax', (): AjaxExports => {
  const actual = jest.requireActual<AjaxExports>('src/libs/ajax');
  return {
    ...actual,
    Ajax: jest.fn(),
  };
});

type AjaxContract = ReturnType<typeof Ajax>;

describe('useWorkspaceById', () => {
  it('fetches a workspace by ID', async () => {
    // Arrange
    const getWorkspaceById = jest.fn().mockResolvedValue({});
    const mockAjax: DeepPartial<AjaxContract> = {
      Workspaces: {
        getById: getWorkspaceById,
      },
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    // Act
    await renderHookInAct(() => useWorkspaceById('test-workspace'));

    // Assert
    expect(getWorkspaceById).toHaveBeenCalledWith('test-workspace', undefined);
  });

  it('fetches workspace when ID changes', async () => {
    // Arrange
    const getWorkspaceById = jest.fn().mockResolvedValue({});
    const mockAjax: DeepPartial<AjaxContract> = {
      Workspaces: {
        getById: getWorkspaceById,
      },
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    const { rerender } = await renderHookInAct(useWorkspaceById, { initialProps: 'workspace-1' });

    // Act
    await act(async () => {
      rerender('workspace-2');
    });

    // Assert
    expect(getWorkspaceById).toHaveBeenCalledWith('workspace-2', undefined);
  });
});
