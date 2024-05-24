import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import { goToPath } from 'src/libs/nav';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';
import { notifyNewWorkspaceClone } from 'src/workspaces/common/state/useCloningWorkspaceNotifications';
import { WorkspaceUserActionsContext } from 'src/workspaces/list/WorkspaceUserActions';
import { NewWorkspaceModalProps } from 'src/workspaces/NewWorkspaceModal//NewWorkspaceModal';
import { WorkspaceInfo } from 'src/workspaces/utils';

const mockModalFn = jest.fn();

jest.doMock('src/workspaces/NewWorkspaceModal/NewWorkspaceModal', () => ({
  ...jest.requireActual('src/workspaces/NewWorkspaceModal/NewWorkspaceModal'),
  NewWorkspaceModal: mockModalFn,
  default: mockModalFn,
}));

// this has to be imported with require, and after the mock for NewWorkspaceModal,
// so the mock is set up when WorkspacesListModals loads its dependencies
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { WorkspacesListModals } = require('src/workspaces/list/WorkspacesListModals');

jest.mock('src/workspaces/common/state/useCloningWorkspaceNotifications', () => ({
  ...jest.requireActual('src/workspaces/common/state/useCloningWorkspaceNotifications'),
  notifyNewWorkspaceClone: jest.fn(),
}));

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  goToPath: jest.fn(),
}));

describe('WorkspacesListModals', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  const mockGetWorkspace = jest.fn();
  const mockRefreshWorkspaces = jest.fn();
  const mockSetUserActions = jest.fn();

  const props = {
    getWorkspace: mockGetWorkspace,
    refreshWorkspaces: mockRefreshWorkspaces,
  };

  const userActions = {
    creatingNewWorkspace: false,
    cloningWorkspace: undefined,
    deletingWorkspaceId: undefined,
    lockingWorkspaceId: undefined,
    sharingWorkspace: undefined,
    leavingWorkspaceId: undefined,
    requestingAccessWorkspaceId: undefined,
  };

  it('renders the NewWorkspaceModal when creating a new workspace', () => {
    // Arrange
    mockModalFn.mockImplementation(() => <div data-testid='mockedNewWorkspaceModal' />);

    // Act
    render(
      <WorkspaceUserActionsContext.Provider
        value={{
          userActions: { ...userActions, creatingNewWorkspace: true },
          setUserActions: mockSetUserActions,
        }}
      >
        <WorkspacesListModals {...props} />
      </WorkspaceUserActionsContext.Provider>
    );
    // Assert
    expect(screen.getByTestId('mockedNewWorkspaceModal')).toBeInTheDocument();
  });

  it('goes to the new workspace when finished', () => {
    // Arrange
    mockModalFn.mockImplementation(
      (props: NewWorkspaceModalProps): React.ReactNode => (
        // eslint-disable-next-line jsx-a11y/control-has-associated-label, react/button-has-type
        <button
          data-testid='mockedNewWorkspaceModal'
          onClick={() => props.onSuccess(defaultAzureWorkspace.workspace)}
        />
      )
    );
    // Act
    render(
      <WorkspaceUserActionsContext.Provider
        value={{
          userActions: { ...userActions, creatingNewWorkspace: true },
          setUserActions: mockSetUserActions,
        }}
      >
        <WorkspacesListModals {...props} />
      </WorkspaceUserActionsContext.Provider>
    );
    fireEvent.click(screen.getByTestId('mockedNewWorkspaceModal'));

    // Assert
    expect(goToPath).toHaveBeenCalledWith('workspace-dashboard', {
      namespace: defaultAzureWorkspace.workspace.namespace,
      name: defaultAzureWorkspace.workspace.name,
    });
  });

  it('renders the NewWorkspaceModal when cloning a workspace', () => {
    // Arrange
    mockModalFn.mockImplementation(() => <div data-testid='mockedNewWorkspaceModal' />);

    // Act
    render(
      <WorkspaceUserActionsContext.Provider
        value={{
          userActions: { ...userActions, cloningWorkspace: defaultAzureWorkspace },
          setUserActions: mockSetUserActions,
        }}
      >
        <WorkspacesListModals {...props} />
      </WorkspaceUserActionsContext.Provider>
    );
    // Assert
    expect(screen.getByTestId('mockedNewWorkspaceModal')).toBeInTheDocument();
  });

  it('goes to the cloned workspace when a google workspace is cloned', () => {
    // Arrange
    const newWorkspace: WorkspaceInfo = {
      ...defaultGoogleWorkspace.workspace,
      name: 'new-workspace-name',
      namespace: 'new-workspace-namespace',
    };
    mockModalFn.mockImplementation(
      (props: NewWorkspaceModalProps): React.ReactNode => (
        // eslint-disable-next-line jsx-a11y/control-has-associated-label, react/button-has-type
        <button data-testid='mockedNewWorkspaceModal' onClick={() => props.onSuccess(newWorkspace)} />
      )
    );
    // Act
    render(
      <WorkspaceUserActionsContext.Provider
        value={{
          userActions: { ...userActions, cloningWorkspace: defaultGoogleWorkspace },
          setUserActions: mockSetUserActions,
        }}
      >
        <WorkspacesListModals {...props} />
      </WorkspaceUserActionsContext.Provider>
    );
    fireEvent.click(screen.getByTestId('mockedNewWorkspaceModal'));

    // Assert
    expect(goToPath).toHaveBeenCalledWith('workspace-dashboard', {
      namespace: newWorkspace.namespace,
      name: newWorkspace.name,
    });
  });

  it('closes the modal and sends the notification when cloning an azure workspace', () => {
    // Arrange
    const newWorkspace: WorkspaceInfo = {
      ...defaultAzureWorkspace.workspace,
      name: 'new-workspace-name',
      namespace: 'new-workspace-namespace',
    };
    mockModalFn.mockImplementation(
      (props: NewWorkspaceModalProps): React.ReactNode => (
        // eslint-disable-next-line jsx-a11y/control-has-associated-label, react/button-has-type
        <button data-testid='mockedNewWorkspaceModal' onClick={() => props.onSuccess(newWorkspace)} />
      )
    );
    // Act
    render(
      <WorkspaceUserActionsContext.Provider
        value={{
          userActions: { ...userActions, cloningWorkspace: defaultAzureWorkspace },
          setUserActions: mockSetUserActions,
        }}
      >
        <WorkspacesListModals {...props} />
      </WorkspaceUserActionsContext.Provider>
    );
    fireEvent.click(screen.getByTestId('mockedNewWorkspaceModal'));

    // Assert
    expect(goToPath).not.toHaveBeenCalled();
    expect(mockRefreshWorkspaces).toHaveBeenCalled();
    expect(mockSetUserActions).toHaveBeenCalledWith({ cloningWorkspace: undefined });
    expect(notifyNewWorkspaceClone).toHaveBeenCalledWith(newWorkspace);
  });
});
