import { screen, waitFor, within } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { ErrorCallback } from 'src/libs/error';
import { goToPath } from 'src/libs/nav';
import { WorkspaceContainer } from 'src/pages/workspaces/workspace/WorkspaceContainer';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';

import { InitializedWorkspaceWrapper } from './useWorkspace';

type NavExports = typeof import('src/libs/nav');
jest.mock(
  'src/libs/nav',
  (): NavExports => ({
    ...jest.requireActual<NavExports>('src/libs/nav'),
    getLink: jest.fn(() => '/'),
    goToPath: jest.fn(),
  })
);

type AjaxExports = typeof import('src/libs/ajax');
jest.mock('src/libs/ajax', (): AjaxExports => {
  return {
    ...jest.requireActual('src/libs/ajax'),
    Ajax: jest.fn(),
  };
});

type WorkspaceMenuExports = typeof import('src/pages/workspaces/workspace/WorkspaceMenu');
jest.mock<WorkspaceMenuExports>('src/pages/workspaces/workspace/WorkspaceMenu', () => ({
  ...jest.requireActual('src/pages/workspaces/workspace/WorkspaceMenu'),
  WorkspaceMenu: jest.fn().mockReturnValue(null),
}));

describe('WorkspaceContainer', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
  });

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
      silentlyRefreshWorkspace: () => Promise.resolve(),
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
      silentlyRefreshWorkspace: () => Promise.resolve(),
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
      silentlyRefreshWorkspace: () => Promise.resolve(),
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

  xit('polls for a workspace in the process of deleting and redirects when deleted', async () => {
    // Arrange
    const pollResponse: Response = new Response(null, { status: 404 });
    const silentlyRefreshWorkspace = jest.fn().mockImplementation((errorHandling?: ErrorCallback) => {
      if (errorHandling) {
        errorHandling(pollResponse);
      }
    });
    const workspace: InitializedWorkspaceWrapper = {
      ...defaultAzureWorkspace,
      workspace: {
        ...defaultAzureWorkspace.workspace,
        state: 'Deleting',
      },
      workspaceInitialized: true,
    };
    const props = {
      namespace: workspace.workspace.namespace,
      name: workspace.workspace.name,
      workspace,
      storageDetails: {
        googleBucketLocation: '',
        googleBucketType: '',
        fetchedGoogleBucketLocation: undefined,
      },
      refresh: () => Promise.resolve(),
      refreshWorkspace: () => {},
      silentlyRefreshWorkspace,
      breadcrumbs: [],
      title: '',
      analysesData: {
        refreshApps: () => Promise.resolve(),
        refreshRuntimes: () => Promise.resolve(),
      },
    };

    jest.useFakeTimers();

    // Act

    render(h(WorkspaceContainer, props));
    // trigger first poll
    jest.advanceTimersByTime(30000);

    // Assert
    await waitFor(() => expect(silentlyRefreshWorkspace).toBeCalled());
    await waitFor(() => expect(goToPath).toBeCalledWith('workspaces'));
  });

  xit('continues polling when a workspace has not been deleted', async () => {
    // Arrange
    const silentlyRefreshWorkspace = jest.fn().mockImplementation(() => Promise.resolve());
    const workspace: InitializedWorkspaceWrapper = {
      ...defaultAzureWorkspace,
      workspace: {
        ...defaultAzureWorkspace.workspace,
        state: 'Deleting',
      },
      workspaceInitialized: true,
    };
    const props = {
      namespace: workspace.workspace.namespace,
      name: workspace.workspace.name,
      workspace,
      storageDetails: {
        googleBucketLocation: '',
        googleBucketType: '',
        fetchedGoogleBucketLocation: undefined,
      },
      refresh: () => Promise.resolve(),
      refreshWorkspace: () => {},
      silentlyRefreshWorkspace,
      breadcrumbs: [],
      title: '',
      analysesData: {
        refreshApps: () => Promise.resolve(),
        refreshRuntimes: () => Promise.resolve(),
      },
    };

    jest.useFakeTimers();

    // Act

    render(h(WorkspaceContainer, props));
    // trigger polls
    jest.advanceTimersByTime(30000);
    await waitFor(() => expect(silentlyRefreshWorkspace).toBeCalledTimes(1));
    jest.advanceTimersByTime(30000);
    await waitFor(() => expect(silentlyRefreshWorkspace).toBeCalledTimes(2));
    jest.advanceTimersByTime(30000);

    // Assert
    await waitFor(() => expect(silentlyRefreshWorkspace).toBeCalledTimes(3));
    await waitFor(() => expect(goToPath).not.toBeCalled());
  });

  it('does not poll for a workspace that is not deleting', async () => {
    // Arrange
    const pollResponse: Response = new Response(null, { status: 404 });
    const silentlyRefreshWorkspace = jest.fn().mockImplementation((errorHandling?: ErrorCallback) => {
      if (errorHandling) {
        errorHandling(pollResponse);
      }
    });
    const workspace: InitializedWorkspaceWrapper = {
      ...defaultAzureWorkspace,
      workspaceInitialized: true,
    };
    const props = {
      namespace: workspace.workspace.namespace,
      name: workspace.workspace.name,
      workspace,
      storageDetails: {
        googleBucketLocation: '',
        googleBucketType: '',
        fetchedGoogleBucketLocation: undefined,
      },
      refresh: () => Promise.resolve(),
      refreshWorkspace: () => {},
      silentlyRefreshWorkspace,
      breadcrumbs: [],
      title: '',
      analysesData: {
        refreshApps: () => Promise.resolve(),
        refreshRuntimes: () => Promise.resolve(),
      },
    };

    jest.useFakeTimers();

    // Act
    render(h(WorkspaceContainer, props));
    // trigger timing past poll timing multiple times
    jest.advanceTimersByTime(30000);
    await Promise.resolve();

    // Assert
    expect(silentlyRefreshWorkspace).not.toBeCalled();
  });
});
