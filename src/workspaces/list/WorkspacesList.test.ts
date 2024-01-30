import { DeepPartial } from '@terra-ui-packages/core-utils';
import { act, waitFor } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { WorkspaceWrapper as Workspace } from 'src/libs/workspace-utils';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';
import { useWorkspacesWithSubmissionStats } from 'src/workspaces/hooks/useWorkspacesWithSubmissionStats';
import { WorkspacesList } from 'src/workspaces/list/WorkspacesList';

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
type AjaxContract = ReturnType<AjaxExports['Ajax']>;

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

jest.mock<UseWorkspaceWithSubmissionStatsExports>('src/workspaces/hooks/useWorkspacesWithSubmissionStats', () => ({
  ...jest.requireActual('src/workspaces/hooks/useWorkspacesWithSubmissionStats'),
  useWorkspacesWithSubmissionStats: jest.fn(),
}));
type UseWorkspaceWithSubmissionStatsExports = typeof import('src/workspaces/hooks/useWorkspacesWithSubmissionStats');

describe('WorkspaceList', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not poll workspaces that are not deleting', async () => {
    // Arrange
    asMockedFn(useWorkspacesWithSubmissionStats).mockReturnValue({
      workspaces: [defaultAzureWorkspace, defaultGoogleWorkspace],
      refresh: () => jest.fn(),
      loadingWorkspaces: false,
      loadingSubmissionStats: false,
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
    };

    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    jest.useFakeTimers();

    // Act

    await act(async () => {
      render(h(WorkspacesList));
    });
    // trigger first poll
    jest.advanceTimersByTime(30000);
    // wait for any promises to complete
    await Promise.resolve();

    // Assert
    expect(mockDetailsFn).not.toBeCalled();
  });

  it('polls for a deleting workspace', async () => {
    // Arrange
    const deletingWorkspace: Workspace = {
      ...defaultAzureWorkspace,
      workspace: {
        ...defaultAzureWorkspace.workspace,
        state: 'Deleting',
      },
    };
    asMockedFn(useWorkspacesWithSubmissionStats).mockReturnValue({
      workspaces: [deletingWorkspace, defaultGoogleWorkspace],
      refresh: () => jest.fn(),
      loadingWorkspaces: false,
      loadingSubmissionStats: false,
    });
    const mockDetailsFn: ReturnType<AjaxContract['Workspaces']['workspace']>['details'] = jest
      .fn()
      .mockResolvedValue({ workspace: { state: 'Deleting' } } satisfies DeepPartial<Workspace>);
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
    };

    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    jest.useFakeTimers();

    // Act

    await act(async () => {
      render(h(WorkspacesList));
    });
    // trigger first poll
    jest.advanceTimersByTime(30000);
    // Waiting on the assertion here also ensures promises have time to complete
    await waitFor(() => expect(mockDetailsFn).toBeCalledTimes(1));
    jest.advanceTimersByTime(30000);

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
  });

  it('polls for all deleting workspaces', async () => {
    // Arrange
    const deletingWorkspaces: Workspace[] = [
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
          state: 'Deleting',
        },
      },
    ];

    asMockedFn(useWorkspacesWithSubmissionStats).mockReturnValue({
      workspaces: deletingWorkspaces,
      refresh: () => jest.fn(),
      loadingWorkspaces: false,
      loadingSubmissionStats: false,
    });
    const mockDetailsFn: ReturnType<AjaxContract['Workspaces']['workspace']>['details'] = jest
      .fn()
      .mockResolvedValue({ workspace: { state: 'Deleting' } } satisfies DeepPartial<Workspace>);
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
    };

    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    jest.useFakeTimers();

    // Act

    await act(async () => {
      render(h(WorkspacesList));
    });

    jest.advanceTimersByTime(30000);

    // Assert
    await waitFor(() => expect(mockDetailsFn).toBeCalledTimes(2));

    jest.advanceTimersByTime(30000);

    await waitFor(() => expect(mockDetailsFn).toBeCalledTimes(4));
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
