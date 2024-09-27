import { act, screen } from '@testing-library/react';
import userEvent, { UserEvent } from '@testing-library/user-event';
import React from 'react';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
import SnapshotActionMenu from 'src/workflows/SnapshotActionMenu';

const mockOnDelete = jest.fn();
const mockOnEdit = jest.fn();

describe('snapshot action menu delete', () => {
  it('renders and enables the menu buttons if you are the snapshot owner', async () => {
    // Arrange
    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(<SnapshotActionMenu isSnapshotOwner onDelete={mockOnDelete} onEdit={mockOnEdit} />);
    });

    await user.click(screen.getByRole('button', { name: 'Snapshot action menu' }));

    const deleteSnapshotButton = screen.getByRole('button', { name: 'Delete snapshot' });

    await user.pointer({ target: deleteSnapshotButton });

    // Assert
    expect(deleteSnapshotButton).toBeInTheDocument();
    expect(deleteSnapshotButton).toHaveAttribute('aria-disabled', 'false');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('renders the menu buttons but disables the proper ones if you are not the snapshot owner', async () => {
    // Arrange
    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(<SnapshotActionMenu isSnapshotOwner={false} onDelete={mockOnDelete} onEdit={mockOnEdit} />);
    });

    await user.click(screen.getByRole('button', { name: 'Snapshot action menu' }));

    const deleteSnapshotButton = screen.getByRole('button', { name: 'Delete snapshot' });

    await user.pointer({ target: deleteSnapshotButton });

    // Assert
    expect(deleteSnapshotButton).toBeInTheDocument();
    expect(deleteSnapshotButton).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('closes and calls the onDelete callback when you press the delete snapshot menu button', async () => {
    // Arrange
    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(<SnapshotActionMenu isSnapshotOwner onDelete={mockOnDelete} onEdit={mockOnEdit} />);
    });

    await user.click(screen.getByRole('button', { name: 'Snapshot action menu' }));
    await user.click(screen.getByRole('button', { name: 'Delete snapshot' }));

    // Assert
    expect(screen.queryByRole('button', { name: 'Delete snapshot' })).not.toBeInTheDocument();
    expect(mockOnDelete).toHaveBeenCalled();
  });
});

describe('snapshot action menu edit permissions', () => {
  it('does', async () => {
    // Arrange
    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(<SnapshotActionMenu isSnapshotOwner onDelete={mockOnDelete} onEdit={mockOnEdit} />);
    });

    await user.click(screen.getByRole('button', { name: 'Snapshot action menu' }));
    await user.click(screen.getByRole('button', { name: 'Edit Permissions' }));

    expect(screen.queryByRole('button', { name: 'Edit Permissions' })).not.toBeInTheDocument();
    expect(mockOnEdit).toHaveBeenCalled();
  });
});
