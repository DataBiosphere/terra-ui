import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
import { WorkspaceWrapper } from 'src/workspaces/utils';

import RequesterPaysModal from './RequesterPaysModal';

jest.mock('src/workspaces/common/state/useWorkspaces', () => ({
  ...jest.requireActual('src/workspaces/common/state/useWorkspaces'),
  useWorkspaces: jest.fn().mockReturnValue({
    loading: false,
    workspaces: [
      {
        workspace: {
          namespace: 'test-namespace',
          name: 'workspace-1',
          cloudPlatform: 'Gcp',
          googleProject: 'test-project-1',
        },
        accessLevel: 'PROJECT_OWNER',
      },
      {
        workspace: {
          namespace: 'test-namespace',
          name: 'workspace-2',
          cloudPlatform: 'Gcp',
          googleProject: 'test-project-2',
        },
        accessLevel: 'OWNER',
      },
      {
        workspace: {
          namespace: 'test-namespace',
          name: 'workspace-3',
          cloudPlatform: 'Gcp',
          googleProject: 'test-project-3',
        },
        accessLevel: 'WRITER',
      },
      {
        workspace: {
          namespace: 'test-namespace',
          name: 'workspace-4',
          cloudPlatform: 'Gcp',
          googleProject: 'test-project-4',
        },
        accessLevel: 'READER',
      },
      {
        workspace: { namespace: 'test-namespace', name: 'workspace-5', cloudPlatform: 'Azure' },
        accessLevel: 'OWNER',
      },
    ] as WorkspaceWrapper[],
  }),
}));

describe('RequesterPaysModal', () => {
  it('lists GCP workspaces that the user owns', async () => {
    // Arrange
    const user = userEvent.setup();

    render(<RequesterPaysModal onDismiss={() => {}} onSuccess={() => {}} />);

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

    const onSuccess = jest.fn();
    render(<RequesterPaysModal onDismiss={() => {}} onSuccess={onSuccess} />);

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
