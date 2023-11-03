import { DeepPartial } from '@terra-ui-packages/core-utils';
import { screen, waitFor, within } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { goToPath } from 'src/libs/nav';
import { workspacesStore, workspaceStore } from 'src/libs/state';
import { WorkspaceWrapper } from 'src/libs/workspace-utils';
import { WorkspaceContainer } from 'src/pages/workspaces/workspace/WorkspaceContainer';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';
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
type AjaxContract = ReturnType<typeof Ajax>;
type AjaxWorkspacesContract = AjaxContract['Workspaces'];

jest.mock('src/libs/ajax', (): AjaxExports => {
  return {
    ...jest.requireActual('src/libs/ajax'),
    Ajax: jest.fn(),
  };
});

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

  it('does not poll for a workspace that is not deleting', async () => {
    // Arrange

    const mockDetailsFn = jest.fn().mockResolvedValue({ state: 'Deleting' });

    const mockAjax: DeepPartial<AjaxContract> = {
      Workspaces: {
        workspace: () =>
          ({
            details: mockDetailsFn,
          } as Partial<AjaxWorkspacesContract['workspace']>),
      },
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

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
      },
    };

    jest.useFakeTimers();

    // Act
    render(h(WorkspaceContainer, props));
    // trigger timing past poll timing multiple times
    jest.advanceTimersByTime(30000);
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
    const mockDetailsFn = jest.fn().mockResolvedValue({ state: 'Deleting' });

    const mockAjax: DeepPartial<AjaxContract> = {
      Workspaces: {
        workspace: () =>
          ({
            details: mockDetailsFn,
          } as Partial<AjaxWorkspacesContract['workspace']>),
      },
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

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
      },
    };

    jest.useFakeTimers();

    // Act

    render(h(WorkspaceContainer, props));

    // trigger polls
    jest.advanceTimersByTime(30000);
    await waitFor(() => expect(mockDetailsFn).toBeCalledTimes(1));
    jest.advanceTimersByTime(30000);
    await waitFor(() => expect(mockDetailsFn).toBeCalledTimes(2));
    jest.advanceTimersByTime(30000);

    // Assert
    await waitFor(() => expect(mockDetailsFn).toBeCalledTimes(3));
    await waitFor(() => expect(goToPath).not.toBeCalled());
  });

  it('polls for a workspace in the process of deleting and updates the store when deleted', async () => {
    // Arrange
    const mockDetailsFn = jest.fn().mockRejectedValue(new Response(null, { status: 404 }));

    const mockAjax: DeepPartial<AjaxContract> = {
      Workspaces: {
        workspace: () =>
          ({
            details: mockDetailsFn,
          } as Partial<AjaxWorkspacesContract['workspace']>),
      },
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

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
      expect(updated.workspace.state).toBe('Deleted');
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
      },
    };

    jest.useFakeTimers();

    // Act

    render(h(WorkspaceContainer, props));
    // trigger first poll
    jest.advanceTimersByTime(30000);

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
      },
    };

    // Act

    render(h(WorkspaceContainer, props));

    // Assert
    await waitFor(() => expect(goToPath).toBeCalledWith('workspaces'));
  });
});
