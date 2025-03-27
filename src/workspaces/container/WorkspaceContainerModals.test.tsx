import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import { goToPath } from 'src/libs/nav';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';
import { notifyNewWorkspaceClone } from 'src/workspaces/common/state/useCloningWorkspaceNotifications';
import { NewWorkspaceWizardProps } from 'src/workspaces/NewWorkspaceModal/NewWorkspaceWizard';
import { WorkspaceInfo } from 'src/workspaces/utils';

const mockModalFn = jest.fn();

type NewWorkspaceWizardExports = typeof import('src/workspaces/NewWorkspaceModal/NewWorkspaceWizard') & {
  __esModule: true;
};
jest.mock('src/workspaces/NewWorkspaceModal/NewWorkspaceWizard', (): NewWorkspaceWizardExports => {
  return {
    ...jest.requireActual<NewWorkspaceWizardExports>('src/workspaces/NewWorkspaceModal/NewWorkspaceWizard'),
    default: mockModalFn,
    __esModule: true,
  };
});

// this has to be imported with require, and after the mock for NewWorkspaceWizard,
// so the mock is set up when WorkspaceContainerModals loads its dependencies
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { WorkspaceContainerModals } = require('src/workspaces/container/WorkspaceContainerModals');

jest.mock('src/workspaces/common/state/useCloningWorkspaceNotifications', () => ({
  ...jest.requireActual('src/workspaces/common/state/useCloningWorkspaceNotifications'),
  notifyNewWorkspaceClone: jest.fn(),
}));

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  goToPath: jest.fn(),
}));

describe('WorkspacesContainerModals', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  const defaultModalProps = {
    workspace: { ...defaultAzureWorkspace, workspaceInitialized: true },
    refreshWorkspace: jest.fn(),
    deletingWorkspace: false,
    setDeletingWorkspace: jest.fn(),
    cloningWorkspace: false,
    setCloningWorkspace: jest.fn(),
    leavingWorkspace: false,
    setLeavingWorkspace: jest.fn(),
    sharingWorkspace: false,
    setSharingWorkspace: jest.fn(),
    showLockWorkspaceModal: false,
    setShowLockWorkspaceModal: jest.fn(),
  };

  it('renders the NewWorkspaceWizard when cloning a workspace', () => {
    // Arrange
    mockModalFn.mockImplementation(() => <div>mockedNewWorkspaceWizard</div>);

    // Act
    render(<WorkspaceContainerModals {...defaultModalProps} cloningWorkspace />);
    screen.debug();
    // Assert
    expect(screen.getByText('mockedNewWorkspaceWizard')).toBeInTheDocument();
  });

  it('goes to the cloned workspace when a google workspace is cloned', () => {
    // Arrange
    const newWorkspace: WorkspaceInfo = {
      ...defaultGoogleWorkspace.workspace,
      name: 'new-workspace-name',
      namespace: 'new-workspace-namespace',
    };
    mockModalFn.mockImplementation(
      (props: NewWorkspaceWizardProps): React.ReactNode => (
        <button type='button' onClick={() => props.onSuccess(newWorkspace)}>
          mockedNewWorkspaceWizard
        </button>
      )
    );
    // Act
    render(<WorkspaceContainerModals {...defaultModalProps} workspace={defaultGoogleWorkspace} cloningWorkspace />);
    fireEvent.click(screen.getByText('mockedNewWorkspaceWizard'));

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
      (props: NewWorkspaceWizardProps): React.ReactNode => (
        <button type='button' onClick={() => props.onSuccess(newWorkspace)}>
          mockedNewWorkspaceWizard
        </button>
      )
    );
    // Act
    render(<WorkspaceContainerModals {...defaultModalProps} cloningWorkspace />);
    fireEvent.click(screen.getByText('mockedNewWorkspaceWizard'));

    // Assert
    expect(goToPath).not.toHaveBeenCalled();
    expect(defaultModalProps.setCloningWorkspace).toHaveBeenCalledWith(false);
    expect(notifyNewWorkspaceClone).toHaveBeenCalledWith(newWorkspace);
  });
});
