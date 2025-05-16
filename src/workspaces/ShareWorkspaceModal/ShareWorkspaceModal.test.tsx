import { act, fireEvent, screen } from '@testing-library/react';
import _ from 'lodash/fp';
import React from 'react';
import { CurrentUserGroupMembership, Groups, GroupsContract } from 'src/libs/ajax/Groups';
import { Metrics, MetricsContract } from 'src/libs/ajax/Metrics';
import { SamResources, SamResourcesContract } from 'src/libs/ajax/SamResources';
import { WorkspaceContract, Workspaces, WorkspacesAjaxContract } from 'src/libs/ajax/workspaces/Workspaces';
import { getTerraUser } from 'src/libs/state';
import { asMockedFn, partial, renderWithAppContexts as render } from 'src/testing/test-utils';
import {
  defaultAzureWorkspace,
  defaultGoogleWorkspace,
  protectedAzureWorkspace,
  protectedGoogleWorkspace,
} from 'src/testing/workspace-fixtures';
import { AccessEntry, RawWorkspaceAcl } from 'src/workspaces/acl-utils';
import ShareWorkspaceModal, { getAccessLevel } from 'src/workspaces/ShareWorkspaceModal/ShareWorkspaceModal';
import { GoogleWorkspace } from 'src/workspaces/utils';

jest.mock('src/libs/state', () => ({
  ...jest.requireActual('src/libs/state'),
  getTerraUser: jest.fn(),
}));

jest.mock('src/libs/ajax/Groups');
jest.mock('src/libs/ajax/Metrics');
jest.mock('src/libs/ajax/workspaces/Workspaces');
jest.mock('src/libs/ajax/SamResources');

describe('the share workspace modal', () => {
  beforeEach(() => {
    asMockedFn(getTerraUser).mockReturnValue({
      email: 'owner@test.com',
    });
  });

  const workspace: GoogleWorkspace = defaultGoogleWorkspace;

  const mockAjax = (
    acl: RawWorkspaceAcl,
    groups: CurrentUserGroupMembership[],
    updateAcl?: (aclUpdates: Partial<AccessEntry>[]) => Promise<any>
  ) => {
    const updateFn: (aclUpdates: Partial<AccessEntry>[]) => Promise<any> =
      updateAcl ?? jest.fn(() => Promise.resolve({ success: true }));

    asMockedFn(Workspaces).mockReturnValue(
      partial<WorkspacesAjaxContract>({
        workspace: () =>
          partial<WorkspaceContract>({
            getAcl: jest.fn(() => Promise.resolve({ acl })),
            updateAcl: updateFn,
          }),
      })
    );
    asMockedFn(Groups).mockReturnValue(
      partial<GroupsContract>({
        list: jest.fn(() => Promise.resolve(groups)),
      })
    );
    asMockedFn(Metrics).mockReturnValue(
      partial<MetricsContract>({
        captureEvent: jest.fn(async () => {}),
      })
    );
  };

  it('shows a list of all users with access', async () => {
    const acl: RawWorkspaceAcl = {
      'user1@test.com': {
        pending: false,
        canShare: true,
        canCompute: true,
        accessLevel: 'OWNER',
      },
      'user2@test.com': {
        pending: false,
        canShare: true,
        canCompute: true,
        accessLevel: 'READER',
      },
    };
    mockAjax(acl, []);
    render(<ShareWorkspaceModal workspace={workspace} onDismiss={jest.fn()} />);
    const email1 = await screen.findByText('user1@test.com');
    expect(email1).not.toBeNull();
    const email2 = await screen.findByText('user2@test.com');
    expect(email2).not.toBeNull();
  });

  it('saving updates only updates changed items ', async () => {
    const acl: RawWorkspaceAcl = {
      'user1@test.com': {
        pending: false,
        canShare: true,
        canCompute: true,
        accessLevel: 'OWNER',
      },
      'user2@test.com': {
        pending: false,
        canShare: true,
        canCompute: true,
        accessLevel: 'READER',
      },
    };

    const updateAcl = jest.fn((aclUpdates: Partial<AccessEntry>[]) => {
      expect(aclUpdates).toHaveLength(2);

      const user1 = _.find({ email: 'user1@test.com' }, aclUpdates);
      expect(user1?.accessLevel).toEqual('OWNER');

      const user2 = _.find({ email: 'user2@test.com' }, aclUpdates);
      expect(user2?.accessLevel).toEqual('WRITER');
      return Promise.resolve({ success: true });
    });
    mockAjax(acl, [], updateAcl);

    render(<ShareWorkspaceModal workspace={workspace} onDismiss={jest.fn()} />);
    const permissionSelect = await screen.findByLabelText(`permissions for ${'user2@test.com'}`);
    expect(permissionSelect).not.toBeNull();
    act(() => {
      fireEvent.click(permissionSelect);
      fireEvent.keyDown(permissionSelect, { key: 'ArrowDown', code: 'ArrowDown' });
    });

    const permissionSelection = await screen.findByText('Writer');
    expect(permissionSelection).not.toBeNull();
    act(() => {
      fireEvent.click(permissionSelection);
    });
    const saveButton = await screen.findByText('Save');
    expect(saveButton).not.toBeNull();
    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(updateAcl).toHaveBeenCalledTimes(1);
  });

  it('displays the error if saving updates fails', async () => {
    const acl: RawWorkspaceAcl = {
      'user1@test.com': {
        pending: false,
        canShare: true,
        canCompute: true,
        accessLevel: 'OWNER',
      },
      'user2@test.com': {
        pending: false,
        canShare: true,
        canCompute: true,
        accessLevel: 'READER',
      },
    };

    const expectedErrorText = 'This is the expected error';
    const updateAcl = jest.fn(() => {
      const err = { text: () => Promise.resolve(expectedErrorText), message: expectedErrorText };
      throw err;
    });
    mockAjax(acl, [], updateAcl);
    render(<ShareWorkspaceModal workspace={workspace} onDismiss={jest.fn()} />);

    const permissionSelect = await screen.findByLabelText(`permissions for ${'user2@test.com'}`);
    expect(permissionSelect).not.toBeNull();
    act(() => {
      fireEvent.click(permissionSelect);
      fireEvent.keyDown(permissionSelect, { key: 'ArrowDown', code: 'ArrowDown' });
    });

    const permissionSelection = await screen.findByText('Writer');
    expect(permissionSelection).not.toBeNull();
    act(() => {
      fireEvent.click(permissionSelection);
    });
    const saveButton = await screen.findByText('Save');
    expect(saveButton).not.toBeNull();
    await act(async () => {
      fireEvent.click(saveButton);
    });

    const errorMessage = await screen.findByText(expectedErrorText);
    expect(errorMessage).not.toBeNull();
  });

  it('renders EmailSelect, AclInput, and Add button correctly', async () => {
    const acl: RawWorkspaceAcl = {};
    mockAjax(acl, []);
    render(<ShareWorkspaceModal workspace={workspace} onDismiss={jest.fn()} />);

    const emailSelect = await screen.findByLabelText('Add people or groups');
    expect(emailSelect).not.toBeNull();

    const aclInput = await screen.findByLabelText('permissions for new collaborator');
    expect(aclInput).not.toBeNull();

    const addButton = await screen.findByText('Add');
    expect(addButton).not.toBeNull();
  });

  it('adds a new collaborator when Add button is clicked', async () => {
    const acl: RawWorkspaceAcl = {};
    mockAjax(acl, []);
    render(<ShareWorkspaceModal workspace={workspace} onDismiss={jest.fn()} />);

    const emailSelect = await screen.findByLabelText('Add people or groups');
    fireEvent.change(emailSelect, { target: { value: 'newuser@test.com' } });
    fireEvent.keyDown(emailSelect, { key: 'Enter', code: 'Enter' });

    const aclInput = await screen.findByLabelText('permissions for new collaborator');
    fireEvent.change(aclInput, { target: { value: 'READER' } });

    const list = screen.getByRole('list');
    list.scrollTo = jest.fn();

    const addButton = await screen.findByText('Add');
    fireEvent.click(addButton);

    const newCollaborator = await screen.findByText('newuser@test.com');
    expect(newCollaborator).not.toBeNull();
  });

  describe('the policy section for sharing workspaces', () => {
    const policyTitle = 'Security and controls on this workspace:';
    it('shows a policy section for Azure workspaces that have them', async () => {
      mockAjax({}, [], jest.fn());
      await act(async () => {
        render(<ShareWorkspaceModal workspace={protectedAzureWorkspace} onDismiss={jest.fn()} />);
      });
      screen.getByText(policyTitle);
    });

    it('shows a policy section for GCP workspaces that have them', async () => {
      mockAjax({}, [], jest.fn());
      await act(async () => {
        render(<ShareWorkspaceModal workspace={protectedGoogleWorkspace} onDismiss={jest.fn()} />);
      });
      screen.getByText(policyTitle);
    });

    it('does not show a policy section for Azure workspaces without them', async () => {
      mockAjax({}, [], jest.fn());
      await act(async () => {
        render(<ShareWorkspaceModal workspace={defaultAzureWorkspace} onDismiss={jest.fn()} />);
      });
      expect(defaultAzureWorkspace.policies).toEqual([]);
      expect(screen.queryByText(policyTitle)).toBeNull();
    });
  });

  describe('Enable Acl selection when user has NoAccess', () => {
    // Helper function to set up mocks
    const setupMock = (roles: string[]) => {
      const mockGetResourceRolesV2 = jest.fn(() => Promise.resolve(roles));
      asMockedFn(SamResources).mockReturnValue(
        partial<SamResourcesContract>({
          getResourceRolesV2: mockGetResourceRolesV2,
        })
      );
      return mockGetResourceRolesV2;
    };

    it('returns the correct access level based on user roles', async () => {
      // Arrange
      const mockGetResourceRolesV2 = setupMock(['reader', 'writer', 'owner']);
      const workspaceId = 'test-workspace-id';
      const accessLevel = 'NO ACCESS';
      const mockAbortSignal = {} as AbortSignal;

      // Act
      const result = await getAccessLevel(workspaceId, accessLevel, mockAbortSignal);

      // Assert
      expect(mockGetResourceRolesV2).toHaveBeenCalledWith({
        resourceTypeName: 'workspace',
        resourceId: workspaceId,
      });
      expect(result).toBe('OWNER');
    });

    it('returns NO ACCESS if no roles match', async () => {
      // Arrange
      const mockGetResourceRolesV2 = setupMock([]);
      const workspaceId = 'test-workspace-id';
      const accessLevel = 'NO ACCESS';
      const mockAbortSignal = {} as AbortSignal;

      // Act
      const result = await getAccessLevel(workspaceId, accessLevel, mockAbortSignal);

      // Assert
      expect(mockGetResourceRolesV2).toHaveBeenCalledWith({
        resourceTypeName: 'workspace',
        resourceId: workspaceId,
      });
      expect(result).toBe('NO ACCESS');
    });

    it('returns OWNER for project-owner or owner roles', async () => {
      // Arrange
      const mockGetResourceRolesV2 = setupMock(['project-owner', 'owner']);
      const workspaceId = 'test-workspace-id';
      const accessLevel = 'NO ACCESS';
      const mockAbortSignal = {} as AbortSignal;

      // Act
      const result = await getAccessLevel(workspaceId, accessLevel, mockAbortSignal);

      // Assert
      expect(mockGetResourceRolesV2).toHaveBeenCalledWith({
        resourceTypeName: 'workspace',
        resourceId: workspaceId,
      });
      expect(result).toBe('OWNER');
    });

    it('returns WRITER for writer role and READER for reader role', async () => {
      // Arrange
      const mockGetResourceRolesV2 = setupMock(['writer']);
      const workspaceId = 'test-workspace-id';
      const accessLevel = 'NO ACCESS';
      const mockAbortSignal = {} as AbortSignal;

      // Act
      const writerResult = await getAccessLevel(workspaceId, accessLevel, mockAbortSignal);

      // Assert
      expect(mockGetResourceRolesV2).toHaveBeenCalledWith({
        resourceTypeName: 'workspace',
        resourceId: workspaceId,
      });
      expect(writerResult).toBe('WRITER');

      // Arrange for reader
      mockGetResourceRolesV2.mockResolvedValueOnce(['reader']);

      // Act
      const readerResult = await getAccessLevel(workspaceId, accessLevel, mockAbortSignal);

      // Assert
      expect(readerResult).toBe('READER');
    });
  });
});
