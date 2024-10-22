import { screen, waitFor, within } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { WorkspaceContract, Workspaces, WorkspacesAjaxContract } from 'src/libs/ajax/workspaces/Workspaces';
import { goToPath } from 'src/libs/nav';
import { workspacesStore, workspaceStore } from 'src/libs/state';
import { asMockedFn, partial, renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';
import { InitializedWorkspaceWrapper } from 'src/workspaces/common/state/useWorkspace';
import { WORKSPACE_UPDATE_POLLING_INTERVAL } from 'src/workspaces/common/state/useWorkspaceStatePolling';
import { WorkspaceContainer } from 'src/workspaces/container/WorkspaceContainer';
import { WorkspaceWrapper } from 'src/workspaces/utils';

type NavExports = typeof import('src/libs/nav');
jest.mock(
  'src/libs/nav',
  (): NavExports => ({
    ...jest.requireActual<NavExports>('src/libs/nav'),
    getLink: jest.fn(() => '/'),
    goToPath: jest.fn(),
  })
);

jest.mock('src/libs/ajax/AzureStorage');
jest.mock('src/libs/ajax/Metrics');
jest.mock('src/libs/ajax/workspaces/Workspaces');

type StateExports = typeof import('src/libs/state');
jest.mock<StateExports>(
  'src/libs/state',
  (): StateExports => ({
    ...jest.requireActual('src/libs/state'),
    workspaceStore: {
      get: jest.fn(),
      set: jest.fn(),
      reset: jest.fn(),
      subscribe: jest.fn(),
      update: jest.fn(),
    },
    workspacesStore: {
      get: jest.fn(),
      set: jest.fn(),
      reset: jest.fn(),
      subscribe: jest.fn(),
      update: jest.fn(),
    },
  })
);

type WorkspaceMenuExports = typeof import('src/workspaces/common/WorkspaceMenu');
jest.mock<WorkspaceMenuExports>('src/workspaces/common/WorkspaceMenu', () => ({
  ...jest.requireActual('src/workspaces/common/WorkspaceMenu'),
  WorkspaceMenu: jest.fn().mockReturnValue(null),
}));

describe('WorkspaceContainer', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
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
        lastRefresh: null,
        refreshRuntimes: () => Promise.resolve(),
        isLoadingCloudEnvironments: false,
      },
    };
    // Act
    render(h(WorkspaceContainer, props));
    // Assert
    const alert = screen.getByRole('alert');
    expect(within(alert).getByText(/Terra is synchronizing permissions with Google/)).not.toBeNull();
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
        lastRefresh: null,
        isLoadingCloudEnvironments: false,
      },
    };
    // Act
    render(h(WorkspaceContainer, props));
    // Assert
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('does not poll for a workspace that is not deleting', async () => {
    // Arrange

    const mockDetailsFn = jest.fn();

    asMockedFn(Workspaces).mockReturnValue(
      partial<WorkspacesAjaxContract>({
        workspace: () =>
          partial<WorkspaceContract>({
            details: mockDetailsFn,
          }),
      })
    );

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
      breadcrumbs: [],
      title: '',
      analysesData: {
        refreshApps: () => Promise.resolve(),
        refreshRuntimes: () => Promise.resolve(),
        lastRefresh: null,
        isLoadingCloudEnvironments: false,
      },
    };

    jest.useFakeTimers();

    // Act
    render(h(WorkspaceContainer, props));
    // trigger timing past poll timing multiple times
    jest.advanceTimersByTime(WORKSPACE_UPDATE_POLLING_INTERVAL);
    await Promise.resolve();

    // Assert
    expect(mockDetailsFn).not.toBeCalled();
  });

  it('continues polling when a workspace has not been deleted', async () => {
    // Arrange
    const workspace: WorkspaceWrapper = {
      ...defaultAzureWorkspace,
      workspace: {
        ...defaultAzureWorkspace.workspace,
        state: 'Deleting',
      },
    };
    const mockDetailsFn = jest.fn().mockResolvedValue({ workspace: { state: 'Deleting' } });

    asMockedFn(Workspaces).mockReturnValue(
      partial<WorkspacesAjaxContract>({
        workspace: () =>
          partial<WorkspaceContract>({
            details: mockDetailsFn,
          }),
      })
    );

    const props = {
      namespace: workspace.workspace.namespace,
      name: workspace.workspace.name,
      workspace: { ...workspace, workspaceInitialized: true },
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
        lastRefresh: null,
        isLoadingCloudEnvironments: false,
      },
    };

    jest.useFakeTimers();

    // Act

    render(h(WorkspaceContainer, props));

    // trigger polls
    jest.advanceTimersByTime(WORKSPACE_UPDATE_POLLING_INTERVAL);
    await waitFor(() => expect(mockDetailsFn).toBeCalledTimes(1));
    jest.advanceTimersByTime(WORKSPACE_UPDATE_POLLING_INTERVAL);
    await waitFor(() => expect(mockDetailsFn).toBeCalledTimes(2));
    jest.advanceTimersByTime(WORKSPACE_UPDATE_POLLING_INTERVAL);

    // Assert
    await waitFor(() => expect(mockDetailsFn).toBeCalledTimes(3));
    await waitFor(() => expect(goToPath).not.toBeCalled());
  });

  it('polls for a workspace in the process of deleting and updates the store when deleted', async () => {
    // Arrange
    const mockDetailsFn = jest.fn().mockRejectedValue(new Response(null, { status: 404 }));

    asMockedFn(Workspaces).mockReturnValue(
      partial<WorkspacesAjaxContract>({
        workspace: () =>
          partial<WorkspaceContract>({
            details: mockDetailsFn,
          }),
      })
    );

    const workspace: InitializedWorkspaceWrapper = {
      ...defaultAzureWorkspace,
      workspace: {
        ...defaultAzureWorkspace.workspace,
        state: 'Deleting',
      },
      workspaceInitialized: true,
    };

    const mockUpdateWsFn = asMockedFn(workspaceStore.update);
    const mockUpdateWsListFn = asMockedFn(workspacesStore.update);
    mockUpdateWsFn.mockImplementation((updateFn) => {
      const updated = updateFn(workspace);
      expect(updated!.workspace.state).toBe('Deleted');
    });

    mockUpdateWsListFn.mockImplementation((updateFn) => {
      const updated = updateFn([workspace]);
      expect(updated[0].workspace.state).toBe('Deleted');
    });

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
      breadcrumbs: [],
      title: '',
      analysesData: {
        refreshApps: () => Promise.resolve(),
        refreshRuntimes: () => Promise.resolve(),
        lastRefresh: null,
        isLoadingCloudEnvironments: false,
      },
    };

    jest.useFakeTimers();

    // Act

    render(h(WorkspaceContainer, props));
    // trigger first poll
    jest.advanceTimersByTime(WORKSPACE_UPDATE_POLLING_INTERVAL);

    // Assert
    await waitFor(() => expect(mockDetailsFn).toBeCalled());
    await waitFor(() => expect(mockUpdateWsListFn).toBeCalled());
    await waitFor(() => expect(mockUpdateWsFn).toBeCalled());
  });

  it('sets the error message and stops polling when the deletion fails', async () => {
    // Arrange
    const errorMessage = 'this is an error message';
    const mockDetailsFn = jest.fn().mockResolvedValue({ workspace: { state: 'DeleteFailed', errorMessage } });

    asMockedFn(Workspaces).mockReturnValue(
      partial<WorkspacesAjaxContract>({
        workspace: () =>
          partial<WorkspaceContract>({
            details: mockDetailsFn,
          }),
      })
    );

    const workspace: InitializedWorkspaceWrapper = {
      ...defaultAzureWorkspace,
      workspace: {
        ...defaultAzureWorkspace.workspace,
        state: 'Deleting',
      },
      workspaceInitialized: true,
    };

    const mockUpdateWsFn = asMockedFn(workspaceStore.update);
    const mockUpdateWsListFn = asMockedFn(workspacesStore.update);
    mockUpdateWsFn.mockImplementation((updateFn) => {
      const updated = updateFn(workspace);
      expect(updated!.workspace.state).toBe('DeleteFailed');
      expect(updated!.workspace.errorMessage).toBe(errorMessage);
    });

    mockUpdateWsListFn.mockImplementation((updateFn) => {
      const updated = updateFn([workspace]);
      expect(updated[0].workspace.state).toBe('DeleteFailed');
      expect(updated[0].workspace.errorMessage).toBe(errorMessage);
    });

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
      breadcrumbs: [],
      title: '',
      analysesData: {
        refreshApps: () => Promise.resolve(),
        refreshRuntimes: () => Promise.resolve(),
        lastRefresh: null,
        isLoadingCloudEnvironments: false,
      },
    };

    jest.useFakeTimers();

    // Act

    render(h(WorkspaceContainer, props));
    // trigger first poll
    jest.advanceTimersByTime(WORKSPACE_UPDATE_POLLING_INTERVAL);

    // Assert
    await waitFor(() => expect(mockDetailsFn).toBeCalled());
    await waitFor(() => expect(mockUpdateWsListFn).toBeCalled());
    await waitFor(() => expect(mockUpdateWsFn).toBeCalled());
  });

  it('redirects for a deleted workspace', async () => {
    // Arrange
    const workspace: InitializedWorkspaceWrapper = {
      ...defaultAzureWorkspace,
      workspace: {
        ...defaultAzureWorkspace.workspace,
        state: 'Deleted',
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
      breadcrumbs: [],
      title: '',
      analysesData: {
        refreshApps: () => Promise.resolve(),
        refreshRuntimes: () => Promise.resolve(),
        lastRefresh: null,
        isLoadingCloudEnvironments: false,
      },
    };

    // Act

    render(h(WorkspaceContainer, props));

    // Assert
    await waitFor(() => expect(goToPath).toBeCalledWith('workspaces'));
  });
});
