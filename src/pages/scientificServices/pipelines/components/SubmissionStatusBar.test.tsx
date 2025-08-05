import { screen } from '@testing-library/react';
import React from 'react';
import { renderWithAppContexts } from 'src/testing/test-utils';

import { SubmissionStatusBar } from './SubmissionStatusBar';

describe('SubmissionStatusBar', () => {
  it('renders steps with correct text and icon colors based on completion status', () => {
    renderWithAppContexts(<SubmissionStatusBar submissionState='uploading' />);

    const preparingText = screen.getByText('Preparing');
    const preparingIcon = screen.getByTestId('icon-preparing');
    const uploadingText = screen.getByText('Uploading');
    const startingText = screen.getByText('Starting');
    const startingIcon = screen.getByTestId('icon-starting');

    expect(preparingText).toHaveStyle('color: #000');
    expect(preparingIcon).toHaveStyle('color: #74AE43');
    expect(uploadingText).toHaveStyle('color: #000');
    expect(startingText).toHaveStyle('color: #8f95a0');
    expect(startingIcon).toHaveStyle('color: #8f95a0');
  });
});
