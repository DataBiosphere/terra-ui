import { render, screen } from '@testing-library/react';
import { div, h } from 'react-hyperscript-helpers';
import { WorkspaceWrapper } from 'src/libs/workspace-utils';
import { RenderedWorkspaces } from 'src/pages/workspaces/WorkspacesList/RenderedWorkspaces';
import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';

// FlexTable uses react-virtualized's AutoSizer to size the table.
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
  })
);

describe('The behavior of the RenderedWorkspaces component', () => {
  it('should render all of the workspaces it is given', () => {
    // Arange
    const workspaces = [defaultAzureWorkspace, defaultGoogleWorkspace];
    const label = 'myWorkspaces';

    // Act
    render(h(RenderedWorkspaces, { workspaces, label, noContent: div({}), loadingSubmissionStats: false }));

    // Assert
    const renderedGoogleWS = screen.getAllByText(defaultGoogleWorkspace.workspace.name);
    expect(renderedGoogleWS).not.toBeNull();
    const renderedAzureWS = screen.getAllByText(defaultAzureWorkspace.workspace.name);
    expect(renderedAzureWS).not.toBeNull();
  });

  it('should indicate when the workspace is in the process of deleting instead of displaying the description', () => {
    // Arange
    const workspace: WorkspaceWrapper = {
      ...defaultAzureWorkspace,
      workspace: {
        ...defaultAzureWorkspace.workspace,
        state: 'Deleting',
        attributes: { description: 'some description' },
      },
    };
    const label = 'myWorkspaces';

    // Act
    render(
      h(RenderedWorkspaces, { workspaces: [workspace], label, noContent: div({}), loadingSubmissionStats: false })
    );

    // Assert
    const workspaceDescriptionDisplay = screen.queryAllByText('some description');
    expect(workspaceDescriptionDisplay).toHaveLength(0);

    const workspaceStateDisplay = screen.getAllByText('Deleting');
    expect(workspaceStateDisplay).not.toBeNull();
  });

  it('should render the description when the workspace is not in the process of deleting', () => {
    // Arange
    const workspace: WorkspaceWrapper = {
      ...defaultAzureWorkspace,
      workspace: {
        ...defaultAzureWorkspace.workspace,
        state: 'Ready',
        attributes: { description: 'some description' },
      },
    };
    const label = 'myWorkspaces';

    // Act
    render(
      h(RenderedWorkspaces, { workspaces: [workspace], label, noContent: div({}), loadingSubmissionStats: false })
    );

    // Assert
    const workspaceDescriptionDisplay = screen.queryAllByText('some description');
    expect(workspaceDescriptionDisplay).toHaveLength(1);
  });
});
