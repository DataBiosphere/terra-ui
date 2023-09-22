import { act, fireEvent, render, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { updateSearch, useRoute } from 'src/libs/nav';
import { CatagorizedWorkspaces } from 'src/pages/workspaces/WorkspacesList/CatagorizedWorkspaces';
import { WorkspacesListTabs } from 'src/pages/workspaces/WorkspacesList/WorkspacesListTabs';
import { asMockedFn } from 'src/testing/test-utils';
import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';

// the FlexTable uses react-virtualized's AutoSizer to size the table.
// This makes the virtualized window large enough for all rows/columns to be rendered in tests.
jest.mock('react-virtualized', () => ({
  ...jest.requireActual('react-virtualized'),
  AutoSizer: ({ children }) => children({ width: 1000, height: 1000 }),
}));

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn(),
  useRoute: jest.fn().mockImplementation(() => ({ params: {}, query: {} })),
  updateSearch: jest.fn(),
}));

describe('The WorkspacesListTabs component', () => {
  it('should render the workspaces of the current tab', () => {
    useRoute;
    const workspaces: CatagorizedWorkspaces = {
      myWorkspaces: [defaultAzureWorkspace],
      public: [defaultGoogleWorkspace],
      newAndInteresting: [],
      featured: [],
    };
    asMockedFn(useRoute).mockImplementation(() => ({ params: {}, query: { tab: 'public' } }));

    render(
      h(WorkspacesListTabs, {
        workspaces,
        refreshWorkspaces: jest.fn(),
        loadingWorkspaces: false,
        loadingSubmissionStats: false,
      })
    );
    const renderedGoogleWS = screen.queryAllByText(defaultGoogleWorkspace.workspace.name);
    expect(renderedGoogleWS).toHaveLength(1);
    const renderedAzureWS = screen.queryAllByText(defaultAzureWorkspace.workspace.name);
    expect(renderedAzureWS).toHaveLength(0);
  });

  it('should default to the myWorkspaces tab', () => {
    const workspaces: CatagorizedWorkspaces = {
      myWorkspaces: [defaultAzureWorkspace],
      public: [defaultGoogleWorkspace],
      newAndInteresting: [],
      featured: [],
    };
    asMockedFn(useRoute).mockImplementation(() => ({ params: {}, query: {} }));

    render(
      h(WorkspacesListTabs, {
        workspaces,
        refreshWorkspaces: jest.fn(),
        loadingWorkspaces: false,
        loadingSubmissionStats: false,
      })
    );
    const renderedGoogleWS = screen.queryAllByText(defaultGoogleWorkspace.workspace.name);
    expect(renderedGoogleWS).toHaveLength(0);
    const renderedAzureWS = screen.queryAllByText(defaultAzureWorkspace.workspace.name);
    expect(renderedAzureWS).toHaveLength(1);
  });

  it('refreshes workspaces when the current tab is clicked', () => {
    const workspaces: CatagorizedWorkspaces = {
      myWorkspaces: [defaultAzureWorkspace],
      public: [defaultGoogleWorkspace],
      newAndInteresting: [],
      featured: [],
    };
    asMockedFn(useRoute).mockImplementation(() => ({ params: {}, query: {} }));
    const refreshWorkspaces = jest.fn();
    render(
      h(WorkspacesListTabs, {
        workspaces,
        refreshWorkspaces,
        loadingWorkspaces: false,
        loadingSubmissionStats: false,
      })
    );

    const tabs = screen.getAllByRole('tab');
    const myWorkspacesTab = tabs[0];
    act(() => fireEvent.click(myWorkspacesTab));
    expect(refreshWorkspaces).toHaveBeenCalled();
  });

  it('switches to an intactive tab when clicked', () => {
    const workspaces: CatagorizedWorkspaces = {
      myWorkspaces: [defaultAzureWorkspace],
      public: [defaultGoogleWorkspace],
      newAndInteresting: [],
      featured: [],
    };
    asMockedFn(updateSearch);
    const refreshWorkspaces = jest.fn();
    render(
      h(WorkspacesListTabs, {
        workspaces,
        refreshWorkspaces,
        loadingWorkspaces: false,
        loadingSubmissionStats: false,
      })
    );

    const tabs = screen.getAllByRole('tab');
    const publicTab = tabs[3];
    act(() => fireEvent.click(publicTab));
    expect(updateSearch).toHaveBeenCalledWith({ tab: 'public' });
  });
});
