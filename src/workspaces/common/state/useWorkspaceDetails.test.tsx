import { act } from '@testing-library/react';
import { WorkspaceContract, Workspaces, WorkspacesAjaxContract } from 'src/libs/ajax/workspaces/Workspaces';
import { asMockedFn, partial, renderHookInAct } from 'src/testing/test-utils';
import { canRead } from 'src/workspaces/utils';

import { useWorkspaceDetails } from './useWorkspaceDetails';

jest.mock('src/libs/ajax/workspaces/Workspaces');
jest.mock('src/workspaces/utils', () => ({
  ...jest.requireActual('src/workspaces/utils'),
  canRead: jest.fn(),
}));

describe('useWorkspaceDetails', () => {
  const mockWorkspaceDetails = { workspace: { name: 'test-workspace' }, accessLevel: 'READER' };
  const mockGetAcl = { acl: { user1: { accessLevel: 'OWNER', canShare: true, canCompute: true } } };

  beforeEach(() => {
    jest.clearAllMocks();
    asMockedFn(canRead).mockReturnValue(true);
    asMockedFn(Workspaces).mockReturnValue(
      partial<WorkspacesAjaxContract>({
        workspace: jest.fn(() =>
          partial<WorkspaceContract>({
            details: jest.fn().mockResolvedValue(mockWorkspaceDetails),
            getAcl: jest.fn().mockResolvedValue(mockGetAcl),
          })
        ),
      })
    );
  });

  it('fetches workspace details when user has read access', async () => {
    // Arrange & Act
    const { result } = await renderHookInAct(() =>
      useWorkspaceDetails(
        { namespace: 'test-namespace', name: 'test-name', loggedInUser: { userEmail: 'user1', accessLevel: 'READER' } },
        ['field1', 'field2']
      )
    );

    // Assert
    expect(result.current.workspace).toEqual(mockWorkspaceDetails);
    expect(result.current.loading).toBe(false);
    expect(Workspaces().workspace).toHaveBeenCalledWith('test-namespace', 'test-name');
  });

  it('fetches ACL and sets workspace when user does not have read access', async () => {
    // Arrange
    asMockedFn(canRead).mockReturnValue(false);

    // Act
    const { result } = await renderHookInAct(() =>
      useWorkspaceDetails(
        {
          namespace: 'test-namespace',
          name: 'test-name',
          loggedInUser: { userEmail: 'user1', accessLevel: 'NO ACCESS' },
        },
        ['field1', 'field2']
      )
    );

    // Assert
    expect(result.current.workspace).toEqual({
      accessLevel: 'OWNER',
      canCompute: true,
      canShare: true,
      policies: [],
      workspace: expect.objectContaining({
        namespace: 'test-namespace',
        name: 'test-name',
      }),
    });
    expect(result.current.loading).toBe(false);
    expect(Workspaces().workspace).toHaveBeenCalledWith('test-namespace', 'test-name');
  });

  it('refreshes workspace details when refresh is called', async () => {
    // Arrange
    const { result } = await renderHookInAct(() =>
      useWorkspaceDetails(
        { namespace: 'test-namespace', name: 'test-name', loggedInUser: { userEmail: 'user1', accessLevel: 'READER' } },
        ['field1', 'field2']
      )
    );

    // Act
    await act(async () => {
      result.current.refresh();
    });

    // Assert
    expect(result.current.workspace).toEqual(mockWorkspaceDetails);
    expect(Workspaces().workspace).toHaveBeenCalledTimes(2);
  });
});
