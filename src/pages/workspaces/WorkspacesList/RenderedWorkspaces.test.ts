import { fireEvent, screen } from '@testing-library/react';
import { div, h } from 'react-hyperscript-helpers';
import { WorkspaceWrapper } from 'src/libs/workspace-utils';
import { RenderedWorkspaces } from 'src/pages/workspaces/WorkspacesList/RenderedWorkspaces';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
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
    // Arrange
    const workspaces = [defaultAzureWorkspace, defaultGoogleWorkspace];
    const label = 'myWorkspaces';

    // Act
    render(h(RenderedWorkspaces, { workspaces, label, noContent: div({}), loadingSubmissionStats: false }));

    // Assert
    const renderedGoogleWS = screen.getAllByText(defaultGoogleWorkspace.workspace.name);
    expect(renderedGoogleWS).not.toBeNull();
    const renderedAzureWS = screen.getAllByText(defaultAzureWorkspace.workspace.name);
    expect(renderedAzureWS).not.toBeNull();
    expect(renderedAzureWS).toHaveLength(1);
  });

  it('should indicate when the workspace is in the process of deleting instead of displaying the description', () => {
    // Arrange
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

    const workspaceStateDisplay = screen.getAllByText('Workspace deletion in progress');
    expect(workspaceStateDisplay).not.toBeNull();
    expect(workspaceStateDisplay).toHaveLength(1);
  });

  it('should indicate when the workspace failed to delete instead of displaying the description', () => {
    // Arrange
    const workspace: WorkspaceWrapper = {
      ...defaultAzureWorkspace,
      workspace: {
        ...defaultAzureWorkspace.workspace,
        state: 'DeleteFailed',
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

    const workspaceStateDisplay = screen.getAllByText('Error deleting workspace');
    expect(workspaceStateDisplay).not.toBeNull();
    expect(workspaceStateDisplay).toHaveLength(1);
  });

  it('should render the description when the workspace is not in the process of deleting', () => {
    // Arrange
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

  it('gives a link to display the workspace error message if present', () => {
    // Arrange
    const workspace: WorkspaceWrapper = {
      ...defaultAzureWorkspace,
      workspace: {
        ...defaultAzureWorkspace.workspace,
        state: 'DeleteFailed',
        errorMessage: 'A semi-helpful message!',
      },
    };
    const label = 'myWorkspaces';

    // Act
    render(
      h(RenderedWorkspaces, { workspaces: [workspace], label, noContent: div({}), loadingSubmissionStats: false })
    );

    // Assert
    const detailsLink = screen.getByText('See error details.');
    expect(detailsLink).not.toBeNull();
    expect(detailsLink).toHaveLength[1];
  });

  it('shows the error message in a modal when the details link is clicked', () => {
    // Arrange
    const workspace: WorkspaceWrapper = {
      ...defaultAzureWorkspace,
      workspace: {
        ...defaultAzureWorkspace.workspace,
        state: 'DeleteFailed',
        errorMessage: 'A semi-helpful message!',
      },
    };
    const label = 'myWorkspaces';

    // Act
    render(
      h(RenderedWorkspaces, { workspaces: [workspace], label, noContent: div({}), loadingSubmissionStats: false })
    );
    const detailsLink = screen.getByText('See error details.');
    fireEvent.click(detailsLink);
    // Assert

    const message = screen.getByText('A semi-helpful message!');
    expect(message).not.toBeNull();
  });
});
