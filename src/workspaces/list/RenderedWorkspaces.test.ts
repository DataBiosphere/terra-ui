import { fireEvent, screen } from '@testing-library/react';
import { div, h } from 'react-hyperscript-helpers';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';
import { RenderedWorkspaces } from 'src/workspaces/list/RenderedWorkspaces';
import { WorkspaceState, WorkspaceWrapper } from 'src/workspaces/utils';

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
    render(h(RenderedWorkspaces, { workspaces, label, noContent: div({}) }));

    // Assert
    const renderedGoogleWS = screen.getAllByText(defaultGoogleWorkspace.workspace.name);
    expect(renderedGoogleWS).not.toBeNull();
    const renderedAzureWS = screen.getAllByText(defaultAzureWorkspace.workspace.name);
    expect(renderedAzureWS).not.toBeNull();
    expect(renderedAzureWS).toHaveLength(1);
  });

  it.each<{ state: WorkspaceState; statusMessage: string }>([
    // Cloning and CloningContainer are treated as the same state, for now
    { state: 'Cloning', statusMessage: 'Workspace cloning in progress' },
    { state: 'CloningContainer', statusMessage: 'Workspace cloning in progress' },
    { state: 'Deleting', statusMessage: 'Workspace deletion in progress' },
  ])(
    'should indicate when the workspace is $state instead of displaying the description',
    ({ state, statusMessage }) => {
      // Arrange
      const workspace: WorkspaceWrapper = {
        ...defaultAzureWorkspace,
        workspace: {
          ...defaultAzureWorkspace.workspace,
          state,
          attributes: { description: 'some description' },
        },
      };
      const label = 'myWorkspaces';

      // Act
      render(h(RenderedWorkspaces, { workspaces: [workspace], label, noContent: div({}) }));

      // Assert
      const workspaceDescriptionDisplay = screen.queryAllByText('some description');
      expect(workspaceDescriptionDisplay).toHaveLength(0);

      const workspaceStateDisplay = screen.getAllByText(statusMessage);
      expect(workspaceStateDisplay).not.toBeNull();
      expect(workspaceStateDisplay).toHaveLength(1);
    }
  );

  it.each<{ state: WorkspaceState; message: string }>([
    { state: 'CloningFailed', message: 'Workspace clone unsuccessful' },
    { state: 'DeleteFailed', message: 'Error deleting workspace' },
    { state: 'UpdateFailed', message: 'Error updating billing account' },
  ])('should indicate workspace failure instead of displaying the description', ({ state, message }) => {
    // Arrange
    const workspace: WorkspaceWrapper = {
      ...defaultAzureWorkspace,
      workspace: {
        ...defaultAzureWorkspace.workspace,
        state,
        attributes: { description: 'some description' },
      },
    };
    const label = 'myWorkspaces';

    // Act
    render(h(RenderedWorkspaces, { workspaces: [workspace], label, noContent: div({}) }));

    // Assert
    const workspaceDescriptionDisplay = screen.queryAllByText('some description');
    expect(workspaceDescriptionDisplay).toHaveLength(0);

    const workspaceStateDisplay = screen.getAllByText(message);
    expect(workspaceStateDisplay).not.toBeNull();
    expect(workspaceStateDisplay).toHaveLength(1);
  });

  it.each<{ state: WorkspaceState; linkDisabled: boolean }>([
    { state: 'Creating', linkDisabled: true },
    { state: 'CreateFailed', linkDisabled: true },
    { state: 'Cloning', linkDisabled: true },
    { state: 'CloningContainer', linkDisabled: true },
    { state: 'CloningFailed', linkDisabled: true },
    { state: 'Updating', linkDisabled: true },
    { state: 'UpdateFailed', linkDisabled: true },
    { state: 'Deleting', linkDisabled: true },
    { state: 'DeleteFailed', linkDisabled: true },
    { state: 'Deleted', linkDisabled: true },
    { state: 'Ready', linkDisabled: false },
  ])('should have a link with aria-disabled set to $linkDisabled for $state workspaces', ({ state, linkDisabled }) => {
    // Arrange
    const workspace: WorkspaceWrapper = {
      ...defaultAzureWorkspace,
      workspace: {
        ...defaultAzureWorkspace.workspace,
        state,
      },
    };
    const label = 'myWorkspaces';

    // Act
    render(h(RenderedWorkspaces, { workspaces: [workspace], label, noContent: div({}) }));

    // Assert
    const workspaceNameLink = screen.getAllByText(defaultAzureWorkspace.workspace.name);
    expect(workspaceNameLink[0]).toHaveAttribute('aria-disabled', linkDisabled.toString());
  });

  it('should render the description when the workspace is not in the process of deleting or cloning', () => {
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
    render(h(RenderedWorkspaces, { workspaces: [workspace], label, noContent: div({}) }));

    // Assert
    const workspaceDescriptionDisplay = screen.queryAllByText('some description');
    expect(workspaceDescriptionDisplay).toHaveLength(1);
  });

  it.each<{ state: WorkspaceState }>([
    { state: 'CloningFailed' },
    { state: 'DeleteFailed' },
    { state: 'UpdateFailed' },
  ])('gives a link to display the $state workspace error message if present', ({ state }) => {
    // Arrange
    const workspace: WorkspaceWrapper = {
      ...defaultAzureWorkspace,
      workspace: {
        ...defaultAzureWorkspace.workspace,
        state,
        errorMessage: 'A semi-helpful message!',
      },
    };
    const label = 'myWorkspaces';

    // Act
    render(h(RenderedWorkspaces, { workspaces: [workspace], label, noContent: div({}) }));

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
    render(h(RenderedWorkspaces, { workspaces: [workspace], label, noContent: div({}) }));
    const detailsLink = screen.getByText('See error details.');
    fireEvent.click(detailsLink);
    // Assert

    const message = screen.getByText('A semi-helpful message!');
    expect(message).not.toBeNull();
  });
});
