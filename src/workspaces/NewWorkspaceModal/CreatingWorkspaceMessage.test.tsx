import React, { render, screen, waitFor } from '@testing-library/react';
import { CreatingWorkspaceMessage } from 'src/workspaces/NewWorkspaceModal/CreatingWorkspaceMessage';

describe('CreatingWorkspaceMessage', () => {
  it('displays the standard message for synchronous operations', () => {
    // Arrange
    // Act
    render(<CreatingWorkspaceMessage />);
    // Assert
    waitFor(() => expect(screen.getByText("Once it's ready, Terra will take you there")).not.toBeNull(), {
      timeout: 1000,
    });
  });

  it('displays the separate message for asynchronous cloning', () => {
    // Arrange
    // Act
    render(<CreatingWorkspaceMessage asyncClone />);
    // Assert
    waitFor(() => expect(screen.getByText('Initiating workspace clone')).not.toBeNull(), { timeout: 1000 });
    expect(screen.queryByText("Once it's ready, Terra will take you there")).toBeNull();
  });
});
