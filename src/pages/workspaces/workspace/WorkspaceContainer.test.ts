import { render, screen, within } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { WorkspaceContainer } from 'src/pages/workspaces/workspace/WorkspaceContainer';
import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';

// Mocking for Nav.getLink
jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn(() => '/'),
}));
// Mocking feature preview setup
jest.mock('src/libs/feature-previews', () => ({
  ...jest.requireActual('src/libs/feature-previews'),
  isFeaturePreviewEnabled: jest.fn(),
}));

const mockWorkspaceMenu = jest.fn();
jest.mock(
  'src/pages/workspaces/workspace/WorkspaceMenu',
  () =>
    function (props) {
      mockWorkspaceMenu(props);
      return null;
    }
);

describe('WorkspaceContainer', () => {
  it('shows a warning for Azure workspaces', async () => {
    // Arrange
    const props = {
      namespace: 'mock-namespace',
      name: 'mock-name',
      workspace: { ...defaultAzureWorkspace, workspaceInitialized: true },
      storageDetails: {
        googleBucketLocation: '',
        googleBucketType: '',
        fetchedGoogleBucketLocation: undefined,
      },
      refresh: () => Promise.resolve(),
      refreshWorkspace: () => {},
      breadcrumbs: [],
      title: '',
      analysesData: {
        refreshApps: () => Promise.resolve(),
        refreshRuntimes: () => Promise.resolve(),
      },
    };
    // Act
    render(h(WorkspaceContainer, props));
    // Assert
    const alert = screen.getByRole('alert');
    expect(
      within(alert).getByText(/Do not store Unclassified Confidential Information in this platform/)
    ).not.toBeNull();
  });

  it('shows a permissions loading spinner Gcp workspaces that have IAM propagation delays', async () => {
    // Arrange
    const props = {
      namespace: 'mock-namespace',
      name: 'mock-name',
      workspace: { ...defaultGoogleWorkspace, workspaceInitialized: false },
      storageDetails: {
        googleBucketLocation: '',
        googleBucketType: '',
        fetchedGoogleBucketLocation: undefined,
      },
      refresh: () => Promise.resolve(),
      refreshWorkspace: () => {},
      breadcrumbs: [],
      title: '',
      analysesData: {
        refreshApps: () => Promise.resolve(),
        refreshRuntimes: () => Promise.resolve(),
      },
    };
    // Act
    render(h(WorkspaceContainer, props));
    // Assert
    const alert = screen.getByRole('alert');
    expect(within(alert).getByText(/Terra synchronizing permissions with Google/)).not.toBeNull();
  });

  it('shows no alerts for initialized Gcp workspaces', async () => {
    // Arrange
    const props = {
      namespace: 'mock-namespace',
      name: 'mock-name',
      workspace: { ...defaultGoogleWorkspace, workspaceInitialized: true },
      storageDetails: {
        googleBucketLocation: '',
        googleBucketType: '',
        fetchedGoogleBucketLocation: undefined,
      },
      refresh: () => Promise.resolve(),
      refreshWorkspace: () => {},
      breadcrumbs: [],
      title: '',
      analysesData: {
        refreshApps: () => Promise.resolve(),
        refreshRuntimes: () => Promise.resolve(),
      },
    };
    // Act
    render(h(WorkspaceContainer, props));
    // Assert
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
