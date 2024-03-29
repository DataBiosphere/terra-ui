import { screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { getLocalPref } from 'src/libs/prefs';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';
import { recentlyViewedPersistenceId } from 'src/workspaces/common/state/recentlyViewedWorkspaces';
import { RecentlyViewedWorkspaces } from 'src/workspaces/list/RecentlyViewedWorkspaces';
import { persistenceId } from 'src/workspaces/list/WorkspacesList';
import { WorkspaceWrapper as Workspace } from 'src/workspaces/utils';

type NavExports = typeof import('src/libs/nav');

type PrefExports = typeof import('src/libs/prefs');

jest.mock(
  'src/libs/nav',
  (): NavExports => ({
    ...jest.requireActual<NavExports>('src/libs/nav'),
    getLink: jest.fn(),
  })
);

jest.mock(
  'src/libs/prefs',
  (): PrefExports => ({
    ...jest.requireActual('src/libs/prefs'),
    setLocalPref: jest.fn(),
    getLocalPref: jest.fn(),
  })
);

describe('The recently viewed workspaces component', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('starts open when the user preference is set to true', () => {
    // Assert
    const recentlyViewed = [{ workspaceId: defaultAzureWorkspace.workspace.workspaceId, timestamp: Date.now() }];
    const mockgetLocalPref = jest.fn((key) => {
      if (key === persistenceId) return { recentlyViewedOpen: true };
      if (key === recentlyViewedPersistenceId) return { recentlyViewed };
      return {};
    });
    asMockedFn(getLocalPref).mockImplementation(mockgetLocalPref);

    // Act
    render(h(RecentlyViewedWorkspaces, { workspaces: [defaultAzureWorkspace] }));
    expect(mockgetLocalPref).toBeCalled();
    const renderedAzureWS = screen.getAllByText(defaultAzureWorkspace.workspace.name);
    expect(renderedAzureWS).toHaveLength(1);
  });

  it('starts collapsed when the user preference is set to false', () => {
    // Arrange
    const recentlyViewed = [{ workspaceId: defaultAzureWorkspace.workspace.workspaceId, timestamp: Date.now() }];
    asMockedFn(getLocalPref).mockImplementation((key) => {
      if (key === persistenceId) return { recentlyViewedOpen: false };
      if (key === recentlyViewedPersistenceId) return { recentlyViewed };
      return {};
    });

    // Act
    const workspaces = [defaultAzureWorkspace];
    render(h(RecentlyViewedWorkspaces, { workspaces }));

    // Assert
    expect(getLocalPref).toBeCalled();
    const renderedAzureWS = screen.queryAllByText(defaultAzureWorkspace.workspace.name);
    expect(renderedAzureWS).toHaveLength(0);
  });

  it('defaults to open when the user preference is not set', () => {
    // Arrange
    const recentlyViewed = [{ workspaceId: defaultAzureWorkspace.workspace.workspaceId, timestamp: Date.now() }];
    asMockedFn(getLocalPref).mockImplementation((key) => {
      if (key === persistenceId) return {};
      if (key === recentlyViewedPersistenceId) return { recentlyViewed };
      return {};
    });

    // Act
    const workspaces = [defaultAzureWorkspace];
    render(h(RecentlyViewedWorkspaces, { workspaces }));

    // Assert
    expect(getLocalPref).toBeCalled();
    const renderedAzureWS = screen.queryAllByText(defaultAzureWorkspace.workspace.name);
    expect(renderedAzureWS).toHaveLength(1);
  });

  it('only renders recently viewed workspaces when open', () => {
    // Arrange
    const recentlyViewed = [{ workspaceId: defaultAzureWorkspace.workspace.workspaceId, timestamp: Date.now() }];
    asMockedFn(getLocalPref).mockImplementation((key) => {
      if (key === persistenceId) return { recentlyViewedOpen: true };
      if (key === recentlyViewedPersistenceId) return { recentlyViewed };
      return {};
    });

    // Act
    const workspaces = [defaultAzureWorkspace, defaultGoogleWorkspace];
    render(h(RecentlyViewedWorkspaces, { workspaces }));

    // Assert
    const renderedAzureWS = screen.getAllByText(defaultAzureWorkspace.workspace.name);
    expect(renderedAzureWS).toHaveLength(1);
    const renderedGoogleWS = screen.queryAllByText(defaultGoogleWorkspace.workspace.name);
    expect(renderedGoogleWS).toHaveLength(0);
  });

  it('does not render deleted workspaces', () => {
    // Arrange
    const recentlyViewed = [
      { workspaceId: defaultAzureWorkspace.workspace.workspaceId, timestamp: Date.now() },
      { workspaceId: defaultGoogleWorkspace.workspace.workspaceId, timestamp: Date.now() },
    ];
    asMockedFn(getLocalPref).mockImplementation((key) => {
      if (key === persistenceId) return { recentlyViewedOpen: true };
      if (key === recentlyViewedPersistenceId) return { recentlyViewed };
      return {};
    });

    // Act

    const workspaces: Workspace[] = [
      {
        ...defaultAzureWorkspace,
        workspace: {
          ...defaultAzureWorkspace.workspace,
          state: 'Deleted',
        },
      },
      defaultGoogleWorkspace,
    ];
    render(h(RecentlyViewedWorkspaces, { workspaces }));

    // Assert
    const renderedAzureWS = screen.queryAllByText(defaultAzureWorkspace.workspace.name);
    expect(renderedAzureWS).toHaveLength(0);
    const renderedGoogleWS = screen.queryAllByText(defaultGoogleWorkspace.workspace.name);
    expect(renderedGoogleWS).toHaveLength(1);
  });
});
