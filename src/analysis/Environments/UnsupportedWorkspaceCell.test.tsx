import { screen } from '@testing-library/react';
import React from 'react';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { UnsupportedWorkspaceCell } from './UnsupportedWorkspaceCell';

test('renders UnsupportedWorkspaceCell with status and message', () => {
  const testStatus = 'Test Status';
  const testMessage = 'Test Message';

  render(<UnsupportedWorkspaceCell status={testStatus} message={testMessage} />);

  expect(screen.getByText(testStatus)).toBeInTheDocument();
  expect(screen.getByText(testMessage)).toBeInTheDocument();
});
