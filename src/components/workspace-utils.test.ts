import { getAllByRole, getByRole, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';

import { WorkspaceSelector } from './workspace-utils';

// The workspace menu uses react-virtualized's AutoSizer to size the options menu.
// Left to its own devices, in the unit test environment, AutoSizer makes the menu
// list 0px wide and no options are rendered. Mocking AutoSizer makes the virtualized
// window large enough for options to be rendered.
type ReactVirtualizedExports = typeof import('react-virtualized');
jest.mock('react-virtualized', (): ReactVirtualizedExports => {
  return {
    ...jest.requireActual('react-virtualized'),
    // @ts-expect-error
    AutoSizer: ({ children }) => children({ height: 300, width: 300 }),
  };
});

describe('WorkspaceSelector', () => {
  const workspaces = [
    { workspace: { workspaceId: 'workspace-a', name: 'Workspace A' } },
    { workspace: { workspaceId: 'workspace-b', name: 'Workspace B' } },
    { workspace: { workspaceId: 'workspace-c', name: 'Workspace C' } },
  ];

  it('renders a list of workspaces', async () => {
    // Arrange
    const user = userEvent.setup();

    // Act
    render(
      // @ts-expect-error
      h(WorkspaceSelector, {
        workspaces,
      })
    );

    // Assert
    const selectInput = screen.getByLabelText('Select a workspace');
    await user.click(selectInput);

    const listboxId = selectInput.getAttribute('aria-controls')!;
    const listbox = document.getElementById(listboxId)!;

    const options = getAllByRole(listbox, 'option');
    const optionLabels = options.map((opt) => opt.textContent!);

    expect(optionLabels).toEqual(['Workspace A', 'Workspace B', 'Workspace C']);
  });

  it('calls onChange with workspace ID when a workspace is selected', async () => {
    // Arrange
    const user = userEvent.setup();

    const onChange = jest.fn();
    render(
      // @ts-expect-error
      h(WorkspaceSelector, {
        workspaces,
        onChange,
      })
    );

    // Act
    const selectInput = screen.getByLabelText('Select a workspace');
    await user.click(selectInput);

    const listboxId = selectInput.getAttribute('aria-controls')!;
    const listbox = document.getElementById(listboxId)!;

    const workspaceBOption = getByRole(listbox, 'option', { name: 'Workspace B' });
    await user.click(workspaceBOption);

    // Assert
    expect(onChange).toHaveBeenCalledWith('workspace-b');
  });
});
