import { fireEvent, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { WorkspaceWrapper as Workspace } from 'src/libs/workspace-utils';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultAzureWorkspace } from 'src/testing/workspace-fixtures';
import { WorkspaceDeletingBanner } from 'src/workspaces/container/WorkspaceDeletingBanner';

// Mocking for Nav.getLink
type NavExports = typeof import('src/libs/nav');
jest.mock(
  'src/libs/nav',
  (): NavExports => ({
    ...jest.requireActual<NavExports>('src/libs/nav'),
    getLink: jest.fn(() => '/'),
  })
);

describe('WorkspaceDeletingBanner', () => {
  it('shows a message when the workspace is deleting', () => {
    // Arrange
    const workspace: Workspace = {
      ...defaultAzureWorkspace,
      workspace: {
        ...defaultAzureWorkspace.workspace,
        state: 'Deleting',
      },
    };
    // Act
    render(h(WorkspaceDeletingBanner, { workspace }));

    // Assert
    const message = screen.getByText(
      'Workspace deletion in progress. Analyses, Workflow, and Data tools are no longer accessible.'
    );
    expect(message).not.toBeNull();
  });

  it('shows a message when the workspace has failed deletion', () => {
    // Arrange
    const workspace: Workspace = {
      ...defaultAzureWorkspace,
      workspace: {
        ...defaultAzureWorkspace.workspace,
        state: 'DeleteFailed',
      },
    };
    // Act
    render(h(WorkspaceDeletingBanner, { workspace }));

    // Assert
    const message = screen.getByText(
      'Error deleting workspace. Analyses, Workflow, and Data tools are no longer accessible.'
    );
    expect(message).not.toBeNull();
    // we didn't set the workspace error message, so there should not be a link for details
    const detailsLink = screen.queryByText('See error details.');
    expect(detailsLink).toBeNull();
  });

  it('gives a link to display the workspace error message if present', () => {
    // Arrange
    const workspace: Workspace = {
      ...defaultAzureWorkspace,
      workspace: {
        ...defaultAzureWorkspace.workspace,
        state: 'DeleteFailed',
        errorMessage: 'A semi-helpful message!',
      },
    };
    // Act
    render(h(WorkspaceDeletingBanner, { workspace }));

    // Assert
    const detailsLink = screen.getByText('See error details.');
    expect(detailsLink).not.toBeNull();
  });

  it('shows the error message in a modal when the details link is clicked', () => {
    // Arrange
    const workspace: Workspace = {
      ...defaultAzureWorkspace,
      workspace: {
        ...defaultAzureWorkspace.workspace,
        state: 'DeleteFailed',
        errorMessage: 'A semi-helpful message!',
      },
    };
    // Act
    render(h(WorkspaceDeletingBanner, { workspace }));

    // Assert
    const detailsLink = screen.getByText('See error details.');
    expect(detailsLink).not.toBeNull();
    fireEvent.click(detailsLink);
    const message = screen.getByText('A semi-helpful message!');
    expect(message).not.toBeNull();
  });
});
