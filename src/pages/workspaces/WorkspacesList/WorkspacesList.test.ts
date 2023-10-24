import { DeepPartial } from '@terra-ui-packages/core-utils';
import { act, waitFor } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { useWorkspacesWithSubmissionStats } from 'src/pages/workspaces/WorkspacesList/useWorkspacesWithSubmissionStats';
import { WorkspacesList } from 'src/pages/workspaces/WorkspacesList/WorkspacesList';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';

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

type WorkspaceFiltersExports = typeof import('src/pages/workspaces/WorkspacesList/WorkspaceFilters');
jest.mock<WorkspaceFiltersExports>('src/pages/workspaces/WorkspacesList/WorkspaceFilters', () => ({
  ...jest.requireActual('src/pages/workspaces/WorkspacesList/WorkspaceFilters'),
  WorkspaceFilters: jest.fn().mockReturnValue(null),
}));

jest.mock<UseWorkspaceWithSubmissionStatsExports>(
  'src/pages/workspaces/WorkspacesList/useWorkspacesWithSubmissionStats',
  () => ({
    ...jest.requireActual('src/pages/workspaces/WorkspacesList/useWorkspacesWithSubmissionStats'),
    useWorkspacesWithSubmissionStats: jest.fn(),
  })
);
type UseWorkspaceWithSubmissionStatsExports =
  typeof import('src/pages/workspaces/WorkspacesList/useWorkspacesWithSubmissionStats');

describe('WorkspaceList', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  it('polls workspaces using the refreshSilently function', async () => {
    // Arrange

    const mockRefreshSilently = jest.fn().mockImplementation(() => Promise.resolve());

    asMockedFn(useWorkspacesWithSubmissionStats).mockReturnValue({
      workspaces: [],
      refresh: () => jest.fn(),
      refreshSilently: mockRefreshSilently,
      loadingWorkspaces: false,
      loadingSubmissionStats: false,
    });

    const mockAjax: DeepPartial<AjaxContract> = {
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

    // Assert
    await waitFor(() => expect(mockRefreshSilently).toBeCalledTimes(1));
    jest.advanceTimersByTime(30000);
    await waitFor(() => expect(mockRefreshSilently).toBeCalledTimes(2));
  });
});
