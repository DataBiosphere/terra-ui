import { screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { getLink } from 'src/libs/nav';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';
import { useWorkspaceById } from 'src/workspaces/common/state/useWorkspaceById';
import { WorkspaceWrapper } from 'src/workspaces/utils';

import { WorkspaceLink, WorkspaceLinkById } from './WorkspaceLinks';

type NavExports = typeof import('src/libs/nav');
jest.mock('src/libs/nav', (): NavExports => {
  const actual = jest.requireActual<NavExports>('src/libs/nav');
  return {
    ...actual,
    getLink: jest.fn(),
  };
});

type UseWorkspaceByIdExports = typeof import('src/workspaces/common/state/useWorkspaceById');
jest.mock('src/workspaces/common/state/useWorkspaceById', (): UseWorkspaceByIdExports => {
  return {
    ...jest.requireActual<UseWorkspaceByIdExports>('src/workspaces/common/state/useWorkspaceById'),
    useWorkspaceById: jest.fn(),
  };
});

describe('WorkspaceLink', () => {
  it('renders a link to a workspace', () => {
    // Arrange
    asMockedFn(getLink).mockImplementation(
      (routeName: string, { namespace, name }: any) => `/${routeName}/${namespace}/${name}`
    );

    // Act
    render(
      h(WorkspaceLink, {
        namespace: 'test-workspaces',
        name: 'test-workspace',
      })
    );

    // Assert
    const link = screen.getByRole('link');
    expect(link).toHaveTextContent('test-workspaces/test-workspace');

    expect(getLink).toHaveBeenCalledWith('workspace-dashboard', {
      namespace: 'test-workspaces',
      name: 'test-workspace',
    });
    expect(link).toHaveAttribute('href', '/workspace-dashboard/test-workspaces/test-workspace');
  });
});

describe('WorkspaceLinkById', () => {
  const mockWorkspace: WorkspaceWrapper = {
    workspace: {
      workspaceId: 'test-workspace-id',
      name: 'test-workspace',
      namespace: 'test-workspaces',
      cloudPlatform: 'Gcp',
      billingAccount: 'billingAccounts/123456-ABCDEF-ABCDEF',
      bucketName: 'test-bucket',
      googleProject: 'google-project',
      authorizationDomain: [],
      createdBy: 'user@example.com',
      createdDate: '2023-02-15T19:17:15.711Z',
      lastModified: '2023-03-15T19:17:15.711Z',
    },
    accessLevel: 'OWNER',
    canShare: true,
    canCompute: true,
    policies: [],
  };

  it('fetches workspace by ID', async () => {
    // Arrange
    asMockedFn(useWorkspaceById).mockReturnValue({
      workspace: mockWorkspace,
      status: 'Ready',
    });

    // Act
    render(h(WorkspaceLinkById, { workspaceId: 'test-workspace-id' }));

    // Assert
    expect(useWorkspaceById).toHaveBeenCalledWith('test-workspace-id', []);
  });

  it('renders link to workspace', async () => {
    // Arrange
    asMockedFn(useWorkspaceById).mockReturnValue({
      workspace: mockWorkspace,
      status: 'Ready',
    });

    asMockedFn(getLink).mockImplementation(
      (routeName: string, { namespace, name }: any) => `/${routeName}/${namespace}/${name}`
    );

    // Act
    render(h(WorkspaceLinkById, { workspaceId: 'test-workspace-id' }));

    // Assert
    const link = screen.getByRole('link');
    expect(link).toHaveTextContent('test-workspaces/test-workspace');

    expect(getLink).toHaveBeenCalledWith('workspace-dashboard', {
      namespace: 'test-workspaces',
      name: 'test-workspace',
    });
    expect(link).toHaveAttribute('href', '/workspace-dashboard/test-workspaces/test-workspace');
  });

  it('renders workspace ID without a link if fetching workspace fails', () => {
    // Arrange
    asMockedFn(useWorkspaceById).mockReturnValue({
      workspace: null,
      status: 'Error',
      error: new Error('Something went wrong'),
    });

    // Act
    const { container } = render(h(WorkspaceLinkById, { workspaceId: 'test-workspace-id' }));

    // Assert
    expect(container).toHaveTextContent('test-workspace-id');
    expect(screen.queryByRole('link')).toBeNull();
  });
});
