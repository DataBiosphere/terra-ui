import React, { render, screen, waitFor } from '@testing-library/react';
import { CreatingWorkspaceMessage } from 'src/workspaces/NewWorkspaceWizard/CreatingWorkspaceMessage';

describe('CreatingWorkspaceMessage', () => {
  it('displays the standard message', () => {
    // Arrange
    // Act
    render(<CreatingWorkspaceMessage />);
    // Assert
    waitFor(
      () => {
        expect(screen.getByText('Creating and provisioning your workspace.')).not.toBeNull();
        expect(
          screen.getByText('Remember to configure your workspace settings to optimize cloud storage costs.')
        ).not.toBeNull();
      },
      { timeout: 1000 }
    );
  });
});
