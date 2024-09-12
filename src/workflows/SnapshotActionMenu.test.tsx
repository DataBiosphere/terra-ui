import { act, screen } from '@testing-library/react';
import userEvent, { UserEvent } from '@testing-library/user-event';
import React from 'react';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
import SnapshotActionMenu from 'src/workflows/SnapshotActionMenu';

const mockOnDelete = jest.fn();

describe('snapshot action menu', () => {
  it('renders the menu buttons when you click the kebab menu icon', async () => {
    // Arrange
    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(<SnapshotActionMenu onDelete={mockOnDelete} />);
    });

    await user.click(screen.getByRole('button', { name: 'Snapshot action menu' }));

    // Assert
    expect(screen.getByRole('button', { name: 'Delete snapshot' })).toBeInTheDocument();
  });

  it('closes and calls the onDelete callback when you press the delete snapshot menu button', async () => {
    // Arrange
    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(<SnapshotActionMenu onDelete={mockOnDelete} />);
    });

    await user.click(screen.getByRole('button', { name: 'Snapshot action menu' }));
    await user.click(screen.getByRole('button', { name: 'Delete snapshot' }));

    // Assert
    expect(screen.queryByRole('button', { name: 'Delete snapshot' })).not.toBeInTheDocument();
    expect(mockOnDelete).toHaveBeenCalled();
  });
});
