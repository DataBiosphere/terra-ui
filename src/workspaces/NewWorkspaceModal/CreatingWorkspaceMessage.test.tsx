import React, { render, screen, waitFor } from '@testing-library/react';
import { CreatingWorkspaceMessage } from 'src/workspaces/NewWorkspaceModal/CreatingWorkspaceMessage';

describe('CreatingWorkspaceMessage', () => {
  it('displays the standard message', () => {
    // Arrange
    // Act
    render(<CreatingWorkspaceMessage />);
    // Assert
    waitFor(() => expect(screen.getByText("Once it's ready, Terra will take you there")).not.toBeNull(), {
      timeout: 1000,
    });
  });
});
