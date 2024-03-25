import { asMockedFn } from '@terra-ui-packages/test-utils';
import { act, fireEvent, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import Events from 'src/libs/events';
import { updateSearch, useRoute } from 'src/libs/nav';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';
import { CategorizedWorkspaces } from 'src/workspaces/list/CategorizedWorkspaces';
import { WorkspacesListTabs } from 'src/workspaces/list/WorkspacesListTabs';

// the FlexTable uses react-virtualized's AutoSizer to size the table.
// This makes the virtualized window large enough for all rows/columns to be rendered in tests.
jest.mock('react-virtualized', () => ({
  ...jest.requireActual('react-virtualized'),
  AutoSizer: ({ children }) => children({ width: 1000, height: 1000 }),
}));

type NavExports = typeof import('src/libs/nav');

jest.mock(
  'src/libs/nav',
  (): NavExports => ({
    ...jest.requireActual<NavExports>('src/libs/nav'),
    getLink: jest.fn(),
    useRoute: jest.fn().mockImplementation(() => ({ params: {}, query: {} })),
    updateSearch: jest.fn(),
  })
);

type AjaxContract = ReturnType<typeof Ajax>;

jest.mock('src/libs/ajax');

asMockedFn(Ajax).mockImplementation(
  () =>
    ({
      Metrics: { captureEvent: jest.fn() } as Partial<AjaxContract['Metrics']>,
    } as Partial<AjaxContract> as AjaxContract)
);

describe('The WorkspacesListTabs component', () => {
  it('should render the workspaces of the current tab', () => {
    // Arrange
    const workspaces: CategorizedWorkspaces = {
      myWorkspaces: [defaultAzureWorkspace],
      public: [defaultGoogleWorkspace],
      newAndInteresting: [],
      featured: [],
    };
    asMockedFn(useRoute).mockImplementation(() => ({ params: {}, query: { tab: 'public' } }));

    // Act
    render(
      h(WorkspacesListTabs, {
        workspaces,
        refreshWorkspaces: jest.fn(),
        loadingWorkspaces: false,
      })
    );

    // Assert
    const renderedGoogleWS = screen.queryAllByText(defaultGoogleWorkspace.workspace.name);
    expect(renderedGoogleWS).toHaveLength(1);
    const renderedAzureWS = screen.queryAllByText(defaultAzureWorkspace.workspace.name);
    expect(renderedAzureWS).toHaveLength(0);
  });

  it('should show the count of workspaces', () => {
    // Arrange
    const workspaces: CategorizedWorkspaces = {
      myWorkspaces: [defaultAzureWorkspace, defaultGoogleWorkspace],
      public: [defaultGoogleWorkspace],
      newAndInteresting: [],
      featured: [],
    };
    asMockedFn(useRoute).mockImplementation(() => ({ params: {}, query: { tab: 'public' } }));

    // Act
    render(
      h(WorkspacesListTabs, {
        workspaces,
        refreshWorkspaces: jest.fn(),
        loadingWorkspaces: false,
      })
    );

    // Assert
    screen.getByText('MY WORKSPACES (2)');
    screen.getByText('PUBLIC (1)');
  });

  it('should update the count of workspaces after filtering', () => {
    // Arrange
    const workspaces: CategorizedWorkspaces = {
      myWorkspaces: [defaultAzureWorkspace, defaultGoogleWorkspace],
      public: [defaultGoogleWorkspace],
      newAndInteresting: [],
      featured: [],
    };
    asMockedFn(useRoute).mockImplementation(() => ({
      params: {},
      query: { tab: 'public', filter: defaultAzureWorkspace.workspace.name },
    }));

    // Act
    render(
      h(WorkspacesListTabs, {
        workspaces,
        refreshWorkspaces: jest.fn(),
        loadingWorkspaces: false,
      })
    );

    // Assert
    screen.getByText('MY WORKSPACES (1)');
    screen.getByText('PUBLIC (0)');
  });

  it('should default to the myWorkspaces tab', () => {
    // Arrange
    const workspaces: CategorizedWorkspaces = {
      myWorkspaces: [defaultAzureWorkspace],
      public: [defaultGoogleWorkspace],
      newAndInteresting: [],
      featured: [],
    };
    asMockedFn(useRoute).mockImplementation(() => ({ params: {}, query: {} }));

    // Act
    render(
      h(WorkspacesListTabs, {
        workspaces,
        refreshWorkspaces: jest.fn(),
        loadingWorkspaces: false,
      })
    );

    // Assert
    const renderedGoogleWS = screen.queryAllByText(defaultGoogleWorkspace.workspace.name);
    expect(renderedGoogleWS).toHaveLength(0);
    const renderedAzureWS = screen.queryAllByText(defaultAzureWorkspace.workspace.name);
    expect(renderedAzureWS).toHaveLength(1);
  });

  it('refreshes workspaces when the current tab is clicked', () => {
    // Arrange
    const workspaces: CategorizedWorkspaces = {
      myWorkspaces: [defaultAzureWorkspace],
      public: [defaultGoogleWorkspace],
      newAndInteresting: [],
      featured: [],
    };
    asMockedFn(useRoute).mockImplementation(() => ({ params: {}, query: {} }));
    const refreshWorkspaces = jest.fn();

    // Act
    render(
      h(WorkspacesListTabs, {
        workspaces,
        refreshWorkspaces,
        loadingWorkspaces: false,
      })
    );

    // Assert
    const tabs = screen.getAllByRole('tab');
    const myWorkspacesTab = tabs[0];
    act(() => fireEvent.click(myWorkspacesTab));
    expect(refreshWorkspaces).toHaveBeenCalled();
  });

  it('switches to an inactive tab when clicked and emits an event', () => {
    // Arrange
    const workspaces: CategorizedWorkspaces = {
      myWorkspaces: [defaultAzureWorkspace],
      public: [defaultGoogleWorkspace],
      newAndInteresting: [],
      featured: [],
    };
    asMockedFn(updateSearch);

    const captureEvent = jest.fn();
    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Metrics: { captureEvent } as Partial<AjaxContract['Metrics']>,
        } as Partial<AjaxContract> as AjaxContract)
    );

    // Act
    const refreshWorkspaces = jest.fn();
    render(
      h(WorkspacesListTabs, {
        workspaces,
        refreshWorkspaces,
        loadingWorkspaces: false,
      })
    );

    // Assert
    const tabs = screen.getAllByRole('tab');
    const publicTab = tabs[3];
    act(() => fireEvent.click(publicTab));
    expect(updateSearch).toHaveBeenCalledWith({ tab: 'public' });
    expect(captureEvent).toHaveBeenNthCalledWith(1, `${Events.workspacesListSelectTab}:view:myWorkspaces`, {});
    expect(captureEvent).toHaveBeenNthCalledWith(2, `${Events.workspacesListSelectTab}:view:public`, {});
  });
});
