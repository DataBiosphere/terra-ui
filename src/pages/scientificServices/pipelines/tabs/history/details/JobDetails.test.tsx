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
jest.mock('src/pages/scientificServices/pipelines/hooks/usePipelinesList', () => ({
  usePipelinesList: jest.fn(() => ({
    pipelines: [],
    uniquePipelines: [],
    isLoading: false,
    error: undefined,
  })),
}));

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

  describe('DataDeliveryView section', () => {
    it('shows the DataDeliveryView section when job status is SUCCEEDED', async () => {
      mockGetPipelineRunResult.mockResolvedValue(mockPipelineRunResponse('SUCCEEDED'));
      render(<JobDetails jobId='job-123' />);
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Deliver Outputs' })).toBeInTheDocument();
      });
    });

    it.each(['PREPARING', 'RUNNING', 'FAILED'] as const)(
      'does not show the DataDeliveryView section when job status is %s',
      async (status) => {
        mockGetPipelineRunResult.mockResolvedValue(mockPipelineRunResponse(status));
        render(<JobDetails jobId='job-123' />);
        // Wait for loading to complete using a known element that renders for all statuses
        await waitFor(() => {
          expect(screen.getByText('Job ID')).toBeInTheDocument();
        });
        expect(screen.queryByRole('heading', { name: 'Deliver Outputs' })).not.toBeInTheDocument();
      }
    );
  });

  describe('Citation button and modal', () => {
    it('shows the Cite the service button when citation is available', async () => {
      const mockResultWithCitation = {
        ...mockPipelineRunResponse('SUCCEEDED'),
        pipelineRunReport: {
          ...mockPipelineRunResponse('SUCCEEDED').pipelineRunReport,
          citation:
            'Data Science Services at Broad Clinical Laboratories. (2026, Jul 9). *All of Us + AnVIL Array Imputation* (v1). https://services.terra.bio/',
        },
      };
      mockGetPipelineRunResult.mockResolvedValue(mockResultWithCitation);

      render(<JobDetails jobId='job-123' />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cite the service/i })).toBeInTheDocument();
      });
    });

    it('does not show the Cite the service button when citation is not available', async () => {
      const mockResultWithoutCitation = {
        ...mockPipelineRunResponse('SUCCEEDED'),
        pipelineRunReport: {
          ...mockPipelineRunResponse('SUCCEEDED').pipelineRunReport,
          citation: undefined,
        },
      };
      mockGetPipelineRunResult.mockResolvedValue(mockResultWithoutCitation);

      render(<JobDetails jobId='job-123' />);

      await waitFor(() => {
        expect(screen.getByText('Job ID')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /cite the service/i })).not.toBeInTheDocument();
    });

    it('opens citation modal when Cite the service button is clicked', async () => {
      const user = userEvent.setup();
      const mockResultWithCitation = {
        ...mockPipelineRunResponse('SUCCEEDED'),
        pipelineRunReport: {
          ...mockPipelineRunResponse('SUCCEEDED').pipelineRunReport,
          citation:
            'Data Science Services at Broad Clinical Laboratories. (2026, Jul 9). *All of Us + AnVIL Array Imputation* (v1). https://services.terra.bio/',
        },
      };
      mockGetPipelineRunResult.mockResolvedValue(mockResultWithCitation);

      render(<JobDetails jobId='job-123' />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cite the service/i })).toBeInTheDocument();
      });

      const citeButton = screen.getByRole('button', { name: /cite the service/i });
      await user.click(citeButton);

      await waitFor(() => {
        expect(screen.getByText('Cite the Service')).toBeInTheDocument();
        expect(screen.getByText(/Data Science Services at Broad Clinical Laboratories/)).toBeInTheDocument();
      });
    });
  });
});
