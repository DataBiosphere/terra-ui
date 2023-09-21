import { render, screen } from '@testing-library/react';
import { div, h } from 'react-hyperscript-helpers';
import { RenderedWorkspaces } from 'src/pages/workspaces/WorkspacesList/RenderedWorkspaces';
import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';

// FileBrowserTable uses react-virtualized's AutoSizer to size the table.
// This makes the virtualized window large enough for all rows/columns to be rendered in tests.
jest.mock('react-virtualized', () => ({
  ...jest.requireActual('react-virtualized'),
  AutoSizer: ({ children }) => children({ width: 1000, height: 1000 }),
}));

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn(),
}));

describe('The behavior of the RenderedWorkspaces component', () => {
  it('should render all of the workspaces it is given', () => {
    const workspaces = [defaultAzureWorkspace, defaultGoogleWorkspace];
    const label = 'myWorkspaces';
    render(h(RenderedWorkspaces, { workspaces, label, noContent: div({}), loadingSubmissionStats: false }));
    const renderedGoogleWS = screen.getAllByText(defaultGoogleWorkspace.workspace.name);
    expect(renderedGoogleWS).not.toBeNull();
    const renderedAzureWS = screen.getAllByText(defaultAzureWorkspace.workspace.name);
    expect(renderedAzureWS).not.toBeNull();
  });
});
