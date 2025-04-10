import { act } from '@testing-library/react';
import { SamResources, SamResourcesContract } from 'src/libs/ajax/SamResources';
import { WorkspaceContract, Workspaces, WorkspacesAjaxContract } from 'src/libs/ajax/workspaces/Workspaces';
import { asMockedFn, partial, renderHookInAct } from 'src/testing/test-utils';
import { defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';
import { canRead } from 'src/workspaces/utils';

import { useWorkspaceDetails } from './useWorkspaceDetails';

jest.mock('src/libs/ajax/SamResources');
jest.mock('src/libs/ajax/workspaces/Workspaces');
jest.mock('src/workspaces/utils', () => ({
  ...jest.requireActual('src/workspaces/utils'),
  canRead: jest.fn(),
}));
type NotificationExports = typeof import('src/libs/notifications');
jest.mock<NotificationExports>(
  'src/libs/notifications',
  (): NotificationExports => ({
    ...jest.requireActual('src/libs/notifications'),
    notify: jest.fn(),
  })
);

describe('useWorkspaceDetails', () => {
  const mockWorkspaceDetails = { workspace: { name: 'test-workspace' }, accessLevel: 'READER' };
  const mockRoles = ['project-owner', 'owner'];

  beforeEach(() => {
    jest.clearAllMocks();
    asMockedFn(canRead).mockReturnValue(true);
    asMockedFn(Workspaces).mockReturnValue(
      partial<WorkspacesAjaxContract>({
        workspace: jest.fn(() =>
          partial<WorkspaceContract>({
            details: jest.fn().mockResolvedValue(mockWorkspaceDetails),
          })
        ),
      })
    );
    asMockedFn(SamResources).mockReturnValue(
      partial<SamResourcesContract>({
        getResourceRolesV2: jest.fn().mockResolvedValue(mockRoles),
      })
    );
  });

  it('fetches workspace details when user has read access', async () => {
    // Arrange & Act
    const { result } = await renderHookInAct(() =>
      useWorkspaceDetails(
        {
          namespace: 'test-namespace',
          name: 'test-name',
          selectedWorkspace: defaultGoogleWorkspace,
          accessLevel: 'READER',
        },
        ['field1', 'field2']
      )
    );

    // Assert
    expect(result.current.workspace).toEqual(mockWorkspaceDetails);
    expect(result.current.loading).toBe(false);
    expect(Workspaces().workspace).toHaveBeenCalledWith('test-namespace', 'test-name');
  });

  it('fetches workspace user roles and sets workspace when user does not have read access', async () => {
    // Arrange
    asMockedFn(canRead).mockReturnValue(false);

    // Act
    const { result } = await renderHookInAct(() =>
      useWorkspaceDetails(
        {
          namespace: 'test-namespace',
          name: 'test-name',
          selectedWorkspace: defaultGoogleWorkspace,
          accessLevel: 'READER',
        },
        ['field1', 'field2']
      )
    );

    // Assert
    expect(result.current.workspace).toEqual({
      accessLevel: 'PROJECT_OWNER', // Updated to match new logic
      canCompute: true,
      canShare: true,
      policies: [],
      workspace: expect.objectContaining({
        namespace: 'test-namespace',
        name: 'test-name',
      }),
    });
    expect(result.current.loading).toBe(false);
    expect(SamResources().getResourceRolesV2).toHaveBeenCalledWith({
      resourceTypeName: 'workspace',
      resourceId: defaultGoogleWorkspace.workspace.workspaceId,
    });
  });

  it('refreshes workspace details when refresh is called', async () => {
    // Arrange
    const { result } = await renderHookInAct(() =>
      useWorkspaceDetails(
        {
          namespace: 'test-namespace',
          name: 'test-name',
          selectedWorkspace: defaultGoogleWorkspace,
          accessLevel: 'READER',
        },
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
