import { DeepPartial } from '@terra-ui-packages/core-utils';
import { act, waitFor } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { Ajax, AjaxContract } from 'src/libs/ajax';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';
import { useWorkspaces } from 'src/workspaces/common/state/useWorkspaces';
import { WORKSPACE_UPDATE_POLLING_INTERVAL } from 'src/workspaces/common/state/useWorkspaceStatePolling';
import { WorkspacesList } from 'src/workspaces/list/WorkspacesList';
import { WorkspaceState, WorkspaceWrapper as Workspace } from 'src/workspaces/utils';

type NavExports = typeof import('src/libs/nav');
jest.mock(
  'src/libs/nav',
  (): NavExports => ({
    ...jest.requireActual<NavExports>('src/libs/nav'),
    getLink: jest.fn(() => '/'),
    goToPath: jest.fn(),
    useRoute: jest.fn().mockReturnValue({ query: {} }),
    updateSearch: jest.fn(),
  })
);

type StateExports = typeof import('src/libs/state');
jest.mock('src/libs/state', (): StateExports => {
  return {
    ...jest.requireActual('src/libs/state'),
    getTerraUser: jest.fn(() => ({ email: 'someone@emails.com' })),
  };
});

type NotificationExports = typeof import('src/libs/notifications');
jest.mock('src/libs/notifications', (): NotificationExports => {
  return {
    ...jest.requireActual('src/libs/notifications'),
    notify: jest.fn(),
  };
});

type AjaxExports = typeof import('src/libs/ajax');

jest.mock('src/libs/ajax', (): AjaxExports => {
  return {
    ...jest.requireActual('src/libs/ajax'),
    Ajax: jest.fn(),
  };
});

type WorkspaceFiltersExports = typeof import('src/workspaces/list/WorkspaceFilters');
jest.mock<WorkspaceFiltersExports>('src/workspaces/list/WorkspaceFilters', () => ({
  ...jest.requireActual('src/workspaces/list/WorkspaceFilters'),
  WorkspaceFilters: jest.fn().mockReturnValue(null),
}));

type UseWorkspacesExports = typeof import('src/workspaces/common/state/useWorkspaces');
jest.mock<UseWorkspacesExports>('src/workspaces/common/state/useWorkspaces', () => ({
  ...jest.requireActual('src/workspaces/common/state/useWorkspaces'),
  useWorkspaces: jest.fn(),
}));

describe('WorkspaceList', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not poll workspaces that are not deleting', async () => {
    // Arrange
    asMockedFn(useWorkspaces).mockReturnValue({
      workspaces: [defaultAzureWorkspace, defaultGoogleWorkspace],
      refresh: jest.fn(),
      loading: false,
      status: 'Ready',
    });
    const mockDetailsFn = jest.fn();
    const mockAjax: DeepPartial<AjaxContract> = {
      Workspaces: {
        workspace: () => ({
          details: mockDetailsFn,
        }),
      },
      FirecloudBucket: {
        getFeaturedWorkspaces: () => [],
      },
      Metrics: { captureEvent: jest.fn() } as Partial<AjaxContract['Metrics']>,
    };

    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    jest.useFakeTimers();

    // Act

    await act(async () => {
      render(h(WorkspacesList));
    });
    // trigger first poll
    jest.advanceTimersByTime(WORKSPACE_UPDATE_POLLING_INTERVAL);
    // wait for any promises to complete
    await Promise.resolve();

    // Assert
    expect(mockDetailsFn).not.toBeCalled();
  });

  it.each<{ state: WorkspaceState }>([{ state: 'Deleting' }, { state: 'Cloning' }, { state: 'CloningContainer' }])(
    'polls for a workspace in the tracked states',
    async ({ state }) => {
      // Arrange
      const pollingWorkspace: Workspace = {
        ...defaultAzureWorkspace,
        workspace: {
          ...defaultAzureWorkspace.workspace,
          state,
        },
      };
      asMockedFn(useWorkspaces).mockReturnValue({
        workspaces: [pollingWorkspace, defaultGoogleWorkspace],
        refresh: jest.fn(),
        loading: false,
        status: 'Ready',
      });
      const mockDetailsFn: ReturnType<AjaxContract['Workspaces']['workspace']>['details'] = jest
        .fn()
        .mockResolvedValue({ workspace: { state } } satisfies DeepPartial<Workspace>);
      const mockWorkspacesFn = jest.fn().mockReturnValue({
        details: mockDetailsFn,
      } satisfies DeepPartial<AjaxContract['Workspaces']['workspace']>);

      const mockAjax: DeepPartial<AjaxContract> = {
        Workspaces: {
          workspace: mockWorkspacesFn,
        },
        FirecloudBucket: {
          getFeaturedWorkspaces: () => [],
        },
        Metrics: { captureEvent: jest.fn() } as Partial<AjaxContract['Metrics']>,
      };

      asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

      jest.useFakeTimers();

      // Act

      await act(async () => {
        render(h(WorkspacesList));
      });
      // trigger first poll
      jest.advanceTimersByTime(WORKSPACE_UPDATE_POLLING_INTERVAL);
      // Waiting on the assertion here also ensures promises have time to complete
      await waitFor(() => expect(mockDetailsFn).toBeCalledTimes(1));
      jest.advanceTimersByTime(WORKSPACE_UPDATE_POLLING_INTERVAL);

      // Assert
      await waitFor(() => expect(mockDetailsFn).toBeCalledTimes(2));
      expect(mockWorkspacesFn).toHaveBeenNthCalledWith(
        1,
        defaultAzureWorkspace.workspace.namespace,
        defaultAzureWorkspace.workspace.name
      );
      expect(mockWorkspacesFn).toHaveBeenNthCalledWith(
        2,
        defaultAzureWorkspace.workspace.namespace,
        defaultAzureWorkspace.workspace.name
      );
    }
  );

  it('polls for multiple workspaces in polling states', async () => {
    // Arrange
    const pollingWorkspaces: Workspace[] = [
      {
        ...defaultAzureWorkspace,
        workspace: {
          ...defaultAzureWorkspace.workspace,
          state: 'Deleting',
        },
      },
      {
        ...defaultGoogleWorkspace,
        workspace: {
          ...defaultGoogleWorkspace.workspace,
          state: 'Cloning',
        },
      },
    ];

    asMockedFn(useWorkspaces).mockReturnValue({
      workspaces: pollingWorkspaces,
      refresh: jest.fn(),
      loading: false,
      status: 'Ready',
    });
    const mockDeletingDetailsFn: ReturnType<AjaxContract['Workspaces']['workspace']>['details'] = jest
      .fn()
      .mockResolvedValue({ workspace: { state: 'Deleting' } } satisfies DeepPartial<Workspace>);
    const mockCloningDetailsFn: ReturnType<AjaxContract['Workspaces']['workspace']>['details'] = jest
      .fn()
      .mockResolvedValue({ workspace: { state: 'Cloning' } } satisfies DeepPartial<Workspace>);

    const mockWorkspacesFn = jest.fn().mockImplementation((_, name) => {
      const detailsFn = name === defaultAzureWorkspace.workspace.name ? mockDeletingDetailsFn : mockCloningDetailsFn;
      return {
        details: detailsFn,
      } satisfies DeepPartial<AjaxContract['Workspaces']['workspace']>;
    });

    const mockAjax: DeepPartial<AjaxContract> = {
      Workspaces: {
        workspace: mockWorkspacesFn,
      },
      FirecloudBucket: {
        getFeaturedWorkspaces: () => [],
      },
      Metrics: { captureEvent: jest.fn() } as Partial<AjaxContract['Metrics']>,
    };

    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    jest.useFakeTimers();

    // Act

    await act(async () => {
      render(h(WorkspacesList));
    });

    jest.advanceTimersByTime(WORKSPACE_UPDATE_POLLING_INTERVAL);

    // Assert
    await waitFor(() => expect(mockDeletingDetailsFn).toBeCalledTimes(1));
    await waitFor(() => expect(mockCloningDetailsFn).toBeCalledTimes(1));

    jest.advanceTimersByTime(WORKSPACE_UPDATE_POLLING_INTERVAL);

    await waitFor(() => expect(mockDeletingDetailsFn).toBeCalledTimes(2));
    await waitFor(() => expect(mockCloningDetailsFn).toBeCalledTimes(2));

    expect(mockWorkspacesFn).toHaveBeenNthCalledWith(
      1,
      defaultAzureWorkspace.workspace.namespace,
      defaultAzureWorkspace.workspace.name
    );
    expect(mockWorkspacesFn).toHaveBeenNthCalledWith(
      2,
      defaultGoogleWorkspace.workspace.namespace,
      defaultGoogleWorkspace.workspace.name
    );
    expect(mockWorkspacesFn).toHaveBeenNthCalledWith(
      3,
      defaultAzureWorkspace.workspace.namespace,
      defaultAzureWorkspace.workspace.name
    );
    expect(mockWorkspacesFn).toHaveBeenNthCalledWith(
      4,
      defaultGoogleWorkspace.workspace.namespace,
      defaultGoogleWorkspace.workspace.name
    );
  });
});
