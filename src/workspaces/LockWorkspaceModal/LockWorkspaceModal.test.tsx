import { DeepPartial } from '@terra-ui-packages/core-utils';
import { asMockedFn } from '@terra-ui-packages/test-utils';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Ajax } from 'src/libs/ajax';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';
import LockWorkspaceModal from 'src/workspaces/LockWorkspaceModal/LockWorkspaceModal';
import { WorkspaceWrapper as Workspace } from 'src/workspaces/utils';

type AjaxContract = ReturnType<typeof Ajax>;
type AjaxExports = typeof import('src/libs/ajax');
jest.mock('src/libs/ajax', (): AjaxExports => {
  return {
    ...jest.requireActual('src/libs/ajax'),
    Ajax: jest.fn(),
  };
});

const mockReportError = jest.fn();
type ErrorExports = typeof import('src/libs/error');
jest.mock('src/libs/error', (): ErrorExports => {
  return {
    ...jest.requireActual('src/libs/error'),
    reportError: (...args) => mockReportError(...args),
  };
});

describe('LockWorkspaceModal', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('contains lock button and message if the workspace is unlocked', () => {
    // Arrange
    const workspace: Workspace = {
      ...defaultGoogleWorkspace,
      workspace: { ...defaultGoogleWorkspace.workspace, isLocked: false },
    };
    const props = { workspace, onDismiss: () => {}, onSuccess: () => {} };

    // Act
    render(<LockWorkspaceModal {...props} />);

    // Assert
    const lockButton = screen.getByRole('button', { name: 'Lock Workspace' });
    expect(lockButton).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to lock this workspace/)).toBeInTheDocument;
  });

  it('contains unlock button and message if the workspace is locked', () => {
    // Arrange
    const workspace: Workspace = {
      ...defaultGoogleWorkspace,
      workspace: { ...defaultGoogleWorkspace.workspace, isLocked: true },
    };
    const props = { workspace, onDismiss: () => {}, onSuccess: () => {} };

    // Act
    render(<LockWorkspaceModal {...props} />);

    // Assert
    const unlockButton = screen.getByRole('button', { name: 'Unlock Workspace' });
    expect(unlockButton).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to unlock this workspace/)).toBeInTheDocument;
  });

  it('calls onDismiss, onSuccess, and locks unlocked workspace if the lock is toggled', async () => {
    // Arrange
    const user = userEvent.setup();
    const onDismiss = jest.fn();
    const onSuccess = jest.fn();
    const mockLock = jest.fn();
    const workspace: Workspace = {
      ...defaultGoogleWorkspace,
      workspace: { ...defaultGoogleWorkspace.workspace, isLocked: false },
    };
    const props = { workspace, onDismiss, onSuccess };
    asMockedFn(Ajax).mockReturnValue({
      Workspaces: {
        workspace: jest.fn().mockReturnValue({
          lock: mockLock,
        }),
      },
    } as DeepPartial<AjaxContract> as AjaxContract);

    // Act
    render(<LockWorkspaceModal {...props} />);
    const lockButton = screen.getByRole('button', { name: 'Lock Workspace' });
    await user.click(lockButton);

    // Assert
    expect(onDismiss).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
    expect(mockLock).toHaveBeenCalled();
  });

  it('calls onDismiss, onSuccess, and unlocks locked workspace if the lock is toggled', async () => {
    // Arrange
    const user = userEvent.setup();
    const onDismiss = jest.fn();
    const onSuccess = jest.fn();
    const mockUnlock = jest.fn();
    const workspace: Workspace = {
      ...defaultGoogleWorkspace,
      workspace: { ...defaultGoogleWorkspace.workspace, isLocked: true },
    };
    const props = { workspace, onDismiss, onSuccess };
    asMockedFn(Ajax).mockReturnValue({
      Workspaces: {
        workspace: jest.fn().mockReturnValue({
          unlock: mockUnlock,
        }),
      },
    } as DeepPartial<AjaxContract> as AjaxContract);

    // Act
    render(<LockWorkspaceModal {...props} />);
    const unlockButton = screen.getByRole('button', { name: 'Unlock Workspace' });
    await user.click(unlockButton);

    // Assert
    expect(onDismiss).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
    expect(mockUnlock).toHaveBeenCalled();
  });

  it('calls only onDismiss if the lock toggle is canceled', async () => {
    // Arrange
    const user = userEvent.setup();
    const onDismiss = jest.fn();
    const onSuccess = jest.fn();
    const mockLock = jest.fn();
    const workspace: Workspace = {
      ...defaultGoogleWorkspace,
      workspace: { ...defaultGoogleWorkspace.workspace, isLocked: false },
    };
    const props = { workspace, onDismiss, onSuccess };
    asMockedFn(Ajax).mockReturnValue({
      Workspaces: {
        workspace: jest.fn().mockReturnValue({
          lock: mockLock,
        }),
      },
    } as DeepPartial<AjaxContract> as AjaxContract);

    // Act
    render(<LockWorkspaceModal {...props} />);
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    // Assert
    expect(onDismiss).toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(mockLock).not.toHaveBeenCalled();
  });

  it('calls only onDismiss if the lock toggle causes an error', async () => {
    // Arrange
    const user = userEvent.setup();
    const onDismiss = jest.fn();
    const onSuccess = jest.fn();
    const workspace: Workspace = {
      ...defaultGoogleWorkspace,
      workspace: { ...defaultGoogleWorkspace.workspace, isLocked: true },
    };
    const props = { workspace, onDismiss, onSuccess };
    asMockedFn(Ajax).mockReturnValue({
      Workspaces: {
        workspace: () => {
          throw new Error();
        },
      },
    } as DeepPartial<AjaxContract> as AjaxContract);

    // Act
    render(<LockWorkspaceModal {...props} />);
    const unlockButton = screen.getByRole('button', { name: 'Unlock Workspace' });
    await user.click(unlockButton);

    // Assert
    expect(onDismiss).toHaveBeenCalled();
    expect(mockReportError).toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
