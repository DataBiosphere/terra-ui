import { asMockedFn } from '@terra-ui-packages/test-utils';
import { fireEvent, screen, within } from '@testing-library/react';
import React from 'react';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';
import { WorkspaceWrapper } from 'src/workspaces/utils';

import { useWorkspaceDataAttributes } from './useWorkspaceDataAttributes';
import { WorkspaceAttributes } from './WorkspaceAttributes';

type UseWorkspaceDataAttributesExports = typeof import('./useWorkspaceDataAttributes');
jest.mock(
  './useWorkspaceDataAttributes',
  (): UseWorkspaceDataAttributesExports => ({
    ...jest.requireActual<UseWorkspaceDataAttributesExports>('./useWorkspaceDataAttributes'),
    useWorkspaceDataAttributes: jest.fn(),
  })
);

type ReactVirtualizedExports = typeof import('react-virtualized');
jest.mock('react-virtualized', (): ReactVirtualizedExports => {
  const actual = jest.requireActual<ReactVirtualizedExports>('react-virtualized');

  const { AutoSizer } = actual;
  class MockAutoSizer extends AutoSizer {
    state = {
      height: 1000,
      width: 1000,
    };

    setState = () => {};
  }

  return {
    ...actual,
    AutoSizer: MockAutoSizer,
  };
});

describe('WorkspaceAttributes', () => {
  interface SetupArgs {
    attributes?: [string, unknown, string][];
    workspace?: WorkspaceWrapper;
  }

  const setup = (args: SetupArgs = {}): void => {
    const { attributes = [], workspace = defaultGoogleWorkspace } = args;

    const refresh = jest.fn().mockResolvedValue(Promise.resolve());

    asMockedFn(useWorkspaceDataAttributes).mockReturnValue([
      {
        state: attributes,
        status: 'Ready',
      },
      refresh,
    ]);

    render(<WorkspaceAttributes refreshKey={0} workspace={workspace} />);
  };

  it('loads and displays workspace data attributes', () => {
    // Arrange/Act
    setup({
      attributes: [
        ['attribute1', 'value1', 'description1'],
        ['attribute2', 'value2', 'description2'],
      ],
    });

    // Assert
    expect(useWorkspaceDataAttributes).toHaveBeenCalledWith(
      defaultGoogleWorkspace.workspace.namespace,
      defaultGoogleWorkspace.workspace.name
    );

    const rows = screen.getAllByRole('row');

    const firstRowCells = within(rows[1]).getAllByRole('cell');
    expect(firstRowCells.map((el) => el.textContent)).toEqual([
      'attribute1',
      'value1',
      'description1Edit variableDelete variable',
    ]);

    const secondRowCells = within(rows[2]).getAllByRole('cell');
    expect(secondRowCells.map((el) => el.textContent)).toEqual([
      'attribute2',
      'value2',
      'description2Edit variableDelete variable',
    ]);
  });

  it('has option to add a new variable', () => {
    // Arrange
    setup();

    // Act
    const editMenuButton = screen.getByRole('button', { name: 'Edit' });
    fireEvent.click(editMenuButton);

    const addVariableButton = screen.getByText('Add variable');
    fireEvent.click(addVariableButton);

    // Assert
    const rows = screen.getAllByRole('row');
    const inputs = within(rows[1]).getAllByRole('textbox');
    expect(inputs).toHaveLength(3);
  });

  it('disables edit menu for read-only workspaces', () => {
    // Arrange/Act
    setup({
      workspace: {
        ...defaultGoogleWorkspace,
        accessLevel: 'READER',
      },
    });

    // Assert
    const editMenuButton = screen.getByRole('button', { name: 'Edit' });
    expect(editMenuButton).toHaveAttribute('aria-disabled', 'true');
  });
});
