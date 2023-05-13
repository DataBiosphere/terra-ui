import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { mockModalModule } from 'src/components/Modal.mock';
import { describe, expect, it, vi } from 'vitest';

import RequesterPaysModal from './RequesterPaysModal';

vi.mock('src/components/Modal', () => {
  return mockModalModule();
});

vi.mock('src/components/workspace-utils', () => ({
  ...vi.importActual('src/components/workspace-utils'),
  useWorkspaces: vi.fn().mockReturnValue({
    loading: false,
    workspaces: [
      {
        workspace: { namespace: 'test-namespace', name: 'workspace-1', cloudPlatform: 'Gcp', googleProject: 'test-project-1' },
        accessLevel: 'PROJECT_OWNER',
      },
      {
        workspace: { namespace: 'test-namespace', name: 'workspace-2', cloudPlatform: 'Gcp', googleProject: 'test-project-2' },
        accessLevel: 'OWNER',
      },
      {
        workspace: { namespace: 'test-namespace', name: 'workspace-3', cloudPlatform: 'Gcp', googleProject: 'test-project-3' },
        accessLevel: 'WRITER',
      },
      {
        workspace: { namespace: 'test-namespace', name: 'workspace-4', cloudPlatform: 'Gcp', googleProject: 'test-project-4' },
        accessLevel: 'READER',
      },
      {
        workspace: { namespace: 'test-namespace', name: 'workspace-5', cloudPlatform: 'Azure' },
        accessLevel: 'OWNER',
      },
    ],
  }),
}));

describe('RequesterPaysModal', () => {
  it('lists GCP workspaces that the user owns', async () => {
    // Arrange
    const user = userEvent.setup();

    render(
      h(RequesterPaysModal, {
        onDismiss: () => {},
        onSuccess: () => {},
      })
    );

    // Act
    const workspaceInput = screen.getByLabelText('Workspace *');
    await user.click(workspaceInput);
    const options = screen.getAllByRole('option').map((el) => el.textContent);

    // Assert
    expect(options).toEqual(['test-namespace/workspace-1', 'test-namespace/workspace-2']);
  });

  it('calls onSuccess callback with Google project from selected workspace', async () => {
    // Arrange
    const user = userEvent.setup();

    const onSuccess = vi.fn();
    render(
      h(RequesterPaysModal, {
        onDismiss: () => {},
        onSuccess,
      })
    );

    const workspaceInput = screen.getByLabelText('Workspace *');
    await user.click(workspaceInput);

    // Act
    const workspaceOption = screen.getByText('test-namespace/workspace-2');
    await user.click(workspaceOption);

    const okButton = screen.getByText('Ok');
    await user.click(okButton);

    // Assert
    expect(onSuccess).toHaveBeenCalledWith('test-project-2');
  });
});
