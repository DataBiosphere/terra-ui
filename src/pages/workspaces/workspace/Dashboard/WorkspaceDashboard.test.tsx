import { screen } from '@testing-library/react';
import React from 'react';
import { StorageDetails, InitializedWorkspaceWrapper as Workspace } from 'src/pages/workspaces/hooks/useWorkspace';
import { WorkspaceDashboard } from 'src/pages/workspaces/workspace/Dashboard/WorkspaceDashboard';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultGoogleBucketOptions, defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';

describe('WorkspaceDashboard', () => {
  const storageDetails: StorageDetails = {
    googleBucketLocation: defaultGoogleBucketOptions.googleBucketLocation,
    googleBucketType: defaultGoogleBucketOptions.googleBucketType,
    fetchedGoogleBucketLocation: defaultGoogleBucketOptions.fetchedGoogleBucketLocation,
  };
  const refreshWorkspace: () => void = jest.fn();
  const namespace: string = defaultGoogleWorkspace.workspace.namespace;
  const name: string = defaultGoogleWorkspace.workspace.name;
  const workspace: Workspace = {
    ...defaultGoogleWorkspace,
    workspace: {
      ...defaultGoogleWorkspace.workspace,
      attributes: {
        description: 'test-description',
      },
    },
    workspaceInitialized: true,
  };

  it('displays the basic panels', () => {
    // Arrange
    // Act
    render(<WorkspaceDashboard {...{ name, namespace, refreshWorkspace, workspace, storageDetails }} />);

    // Assert
    expect(screen.getByText('About the workspace')).toBeInTheDocument();
    expect(screen.getByText('Workspace information')).toBeInTheDocument();
    expect(screen.getByText('Cloud information')).toBeInTheDocument();
    expect(screen.getByText('Owners')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Tags')).toBeInTheDocument();
  });

  it('does not display the authorizationDomain when absent', () => {
    // Arrange
    // Act
    render(<WorkspaceDashboard {...{ name, namespace, refreshWorkspace, workspace, storageDetails }} />);
    // Assert
    expect(screen.queryByText('Authorization domain')).toBeNull();
  });

  it('displays the authorizationDomain when present', () => {
    // Arrange
    // Act
    render(
      <WorkspaceDashboard
        {...{ name, namespace, refreshWorkspace, storageDetails }}
        workspace={{
          ...workspace,
          workspace: {
            ...workspace.workspace,
            authorizationDomain: [{ membersGroupName: 'test-domain' }],
          },
        }}
      />
    );
    // Assert
    expect(screen.queryByText('Authorization domain')).toBeInTheDocument();
  });

  it('displays the workspace description', () => {
    // Arrange
    // Act
    render(<WorkspaceDashboard {...{ name, namespace, refreshWorkspace, workspace, storageDetails }} />);
    // Assert
    expect(screen.getByText('test-description')).toBeInTheDocument();
  });

  it('sets the the workspace description to open by default', () => {
    // Arrange
    // Act
    render(<WorkspaceDashboard {...{ name, namespace, refreshWorkspace, workspace, storageDetails }} />);
    
    // Assert
    expect(screen.getByText('Last Updated')).toBeInTheDocument(); //
    expect(screen.getByText('Creation Date')).toBeInTheDocument();
  });
});
