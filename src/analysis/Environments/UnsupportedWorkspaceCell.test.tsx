import { screen } from '@testing-library/react';
import React from 'react';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { UnsupportedWorkspaceCell } from './UnsupportedWorkspaceCell';

describe('UnsupportedWorkspaceCell', () => {
  it('renders UnsupportedWorkspaceCell with status and message', () => {
    // Arrange
    const testStatus = 'Test Status';
    const testMessage = 'Test Message';

    // Act
    render(<UnsupportedWorkspaceCell status={testStatus} message={testMessage} />);

    // Assert
    expect(screen.getByText(testStatus)).toBeInTheDocument();
    expect(screen.getByText(testMessage)).toBeInTheDocument();
  });
});
