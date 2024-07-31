import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';
import { useWorkspaces } from 'src/workspaces/common/state/useWorkspaces';
import { WorkspaceWrapper } from 'src/workspaces/utils';

import RequesterPaysModal from './RequesterPaysModal';

type UseWorkspacesExports = typeof import('src/workspaces/common/state/useWorkspaces');
jest.mock('src/workspaces/common/state/useWorkspaces', (): UseWorkspacesExports => {
  return {
    ...jest.requireActual<UseWorkspacesExports>('src/workspaces/common/state/useWorkspaces'),
    useWorkspaces: jest.fn(),
  };
});

describe('RequesterPaysModal', () => {
  it('lists GCP workspaces that the user owns or is writer with canCompute', async () => {
    // Arrange
    asMockedFn(useWorkspaces).mockReturnValue({
      refresh: jest.fn(),
      status: 'Ready',
      loading: false,
      workspaces: [
        {
          workspace: {
            namespace: 'test-namespace',
            name: 'gcp-project-owner',
            cloudPlatform: 'Gcp',
            googleProject: 'test-project-1',
          },
          accessLevel: 'PROJECT_OWNER',
          canCompute: true,
        },
        {
          workspace: {
            namespace: 'test-namespace',
            name: 'gcp-owner',
            cloudPlatform: 'Gcp',
            googleProject: 'test-project-2',
          },
          accessLevel: 'OWNER',
          canCompute: true,
        },
        {
          workspace: {
            namespace: 'test-namespace',
            name: 'gcp-writer-no-compute',
            cloudPlatform: 'Gcp',
            googleProject: 'test-project-3',
          },
          accessLevel: 'WRITER',
          canCompute: false,
        },
        {
          workspace: {
            namespace: 'test-namespace',
            name: 'gcp-writer-can-compute',
            cloudPlatform: 'Gcp',
            googleProject: 'test-project-4',
          },
          accessLevel: 'WRITER',
          canCompute: true,
        },
        {
          workspace: {
            namespace: 'test-namespace',
            name: 'gcp-reader',
            cloudPlatform: 'Gcp',
            googleProject: 'test-project-5',
          },
          accessLevel: 'READER',
          canCompute: false,
        },
        {
          workspace: { namespace: 'test-namespace', name: 'azure-owner', cloudPlatform: 'Azure' },
          accessLevel: 'OWNER',
          canCompute: true,
        },
      ] as WorkspaceWrapper[],
    });
    const user = userEvent.setup();
    render(<RequesterPaysModal onDismiss={() => {}} onSuccess={() => {}} />);

    // Act
    const workspaceInput = screen.getByLabelText('Workspace *');
    await user.click(workspaceInput);
    const options = screen.getAllByRole('option').map((el) => el.textContent);

    // Assert
    expect(useWorkspaces).toBeCalledWith(['accessLevel', 'canCompute', 'workspace']);
    expect(options).toEqual([
      'test-namespace/gcp-owner',
      'test-namespace/gcp-project-owner',
      'test-namespace/gcp-writer-can-compute',
    ]);
  });

  it('calls onSuccess callback with Google project from selected workspace', async () => {
    // Arrange
    asMockedFn(useWorkspaces).mockReturnValue({
      refresh: jest.fn(),
      status: 'Ready',
      loading: false,
      workspaces: [
        {
          workspace: {
            namespace: 'test-namespace',
            name: 'gcp-project-owner',
            cloudPlatform: 'Gcp',
            googleProject: 'test-project-1',
          },
          accessLevel: 'PROJECT_OWNER',
          canCompute: true,
        },
        {
          workspace: {
            namespace: 'test-namespace',
            name: 'gcp-owner',
            cloudPlatform: 'Gcp',
            googleProject: 'gcp-owner-googleProject',
          },
          accessLevel: 'OWNER',
          canCompute: true,
        },
      ] as WorkspaceWrapper[],
    });
    const user = userEvent.setup();

    const onSuccess = jest.fn();
    render(<RequesterPaysModal onDismiss={() => {}} onSuccess={onSuccess} />);

    const workspaceInput = screen.getByLabelText('Workspace *');
    await user.click(workspaceInput);

    // Act
    const workspaceOption = screen.getByText('test-namespace/gcp-owner');
    await user.click(workspaceOption);

    const okButton = screen.getByText('Ok');
    await user.click(okButton);

    // Assert
    expect(onSuccess).toHaveBeenCalledWith('gcp-owner-googleProject');
  });
});
