import React, { render, screen, waitFor } from '@testing-library/react';
import { CreatingWorkspaceMessage } from 'src/workspaces/NewWorkspaceModal/CreatingWorkspaceMessage';

describe('CreatingWorkspaceMessage', () => {
  it('displays the standard message', () => {
    // Arrange
    // Act
    render(<CreatingWorkspaceMessage />);
    // Assert
    waitFor(() => expect(screen.getByText('Creating and provisioning your workspace')).not.toBeNull(), {
      timeout: 1000,
    });
  });
});
