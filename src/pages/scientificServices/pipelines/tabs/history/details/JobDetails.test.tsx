import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import * as Nav from 'src/libs/nav';
import { getOutputFileSize } from 'src/pages/scientificServices/pipelines/utils/file-utils';
import { mockPipelineRunResponse } from 'src/pages/scientificServices/pipelines/utils/mock-utils';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { JobDetails } from './JobDetails';

jest.mock('src/libs/ajax/teaspoons/Teaspoons');
jest.mock('src/libs/nav');
jest.mock('src/libs/notifications');
jest.mock('src/pages/scientificServices/pipelines/utils/file-utils');

describe('JobDetails', () => {
  const mockGetPipelineRunResult = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (Teaspoons as jest.Mock).mockReturnValue({
      getPipelineRunResult: mockGetPipelineRunResult,
    });
    (getOutputFileSize as jest.Mock).mockResolvedValue('10.5 MB');
  });

  it('renders all job details sections after successful load', async () => {
    const mockResult = mockPipelineRunResponse('SUCCEEDED');
    mockGetPipelineRunResult.mockResolvedValue(mockResult);

    render(<JobDetails jobId='job-123' />);

    await waitFor(() => {
      // Back button
      expect(screen.getByRole('button', { name: /View All/i })).toBeInTheDocument();

      // JobDetailsHeader elements
      expect(screen.getByText('Job ID')).toBeInTheDocument();
      expect(screen.getByText('job-123-456-789')).toBeInTheDocument();

      // JobIOView elements
      expect(screen.getByText('Inputs')).toBeInTheDocument();
      expect(screen.getByText('Outputs')).toBeInTheDocument();

      // Timeline element
      expect(screen.getByText('Timeline')).toBeInTheDocument();
    });
  });

  it('fetches job details on render', async () => {
    const mockResult = mockPipelineRunResponse('SUCCEEDED');
    mockGetPipelineRunResult.mockResolvedValue(mockResult);

    render(<JobDetails jobId='job-123' />);

    await waitFor(() => {
      expect(mockGetPipelineRunResult).toHaveBeenCalledWith('job-123');
    });
  });

  it('navigates to pipelines history when back button is clicked', async () => {
    const user = userEvent.setup();
    const mockResult = mockPipelineRunResponse('SUCCEEDED');
    mockGetPipelineRunResult.mockResolvedValue(mockResult);

    render(<JobDetails jobId='job-123' />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /View All/i })).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: /View All/i });
    await user.click(backButton);

    expect(Nav.goToPath).toHaveBeenCalledWith('pipelines-history');
  });
});
