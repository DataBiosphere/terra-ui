import { getAllByRole, getByRole, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
import { makeGoogleWorkspace } from 'src/testing/workspace-fixtures';
import { WorkspaceWrapper as Workspace } from 'src/workspaces/utils';

import { WorkspaceSelector } from './WorkspaceSelector';

describe('WorkspaceSelector', () => {
  const workspaces: Workspace[] = [
    makeGoogleWorkspace({ workspace: { workspaceId: 'workspace-a', name: 'Workspace A' } }),
    makeGoogleWorkspace({ workspace: { workspaceId: 'workspace-b', name: 'Workspace B' } }),
    makeGoogleWorkspace({ workspace: { workspaceId: 'workspace-c', name: 'Workspace C' } }),
  ];

  it('renders a list of workspaces', async () => {
    // Arrange
    const user = userEvent.setup();

    // Act
    render(<WorkspaceSelector workspaces={workspaces} value={undefined} onChange={(_) => {}} />);

    // Assert
    const selectInput = screen.getByLabelText('Select a workspace');
    await user.click(selectInput);

    const listboxId = selectInput.getAttribute('aria-controls')!;
    const listbox = document.getElementById(listboxId)!;

    const options = getAllByRole(listbox, 'option');
    const optionLabels = options.map((opt) => opt.textContent!);

    expect(optionLabels).toEqual([
      expect.stringMatching(/Workspace A/),
      expect.stringMatching(/Workspace B/),
      expect.stringMatching(/Workspace C/),
    ]);
  });

  it('calls onChange with workspace ID when a workspace is selected', async () => {
    // Arrange
    const user = userEvent.setup();

    const onChange = jest.fn();
    render(<WorkspaceSelector workspaces={workspaces} value={undefined} onChange={onChange} />);

    // Act
    const selectInput = screen.getByLabelText('Select a workspace');
    await user.click(selectInput);

    const listboxId = selectInput.getAttribute('aria-controls')!;
    const listbox = document.getElementById(listboxId)!;

    const workspaceBOption = getByRole(listbox, 'option', { name: /Workspace B/ });
    await user.click(workspaceBOption);

    // Assert
    expect(onChange).toHaveBeenCalledWith('workspace-b');
  });
});
