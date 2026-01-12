import { screen, waitFor } from '@testing-library/react';
import React from 'react';
import { usePipelineDetails } from 'src/pages/scientificServices/pipelines/hooks/usePipelineDetails';
import {
  mockPipelineRunResponse,
  mockPipelineWithDetails,
} from 'src/pages/scientificServices/pipelines/utils/mock-utils';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { JobDetailsHeader } from './JobDetailsHeader';

jest.mock('src/pages/scientificServices/pipelines/hooks/usePipelineDetails');

describe('JobDetailsHeader', () => {
  const mockUsePipelineDetails = usePipelineDetails as jest.MockedFunction<typeof usePipelineDetails>;
  const mockPipelineDetails = mockPipelineWithDetails('array_imputation');

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePipelineDetails.mockReturnValue({
      pipelineDetails: mockPipelineDetails,
      isLoading: false,
      error: undefined,
    });
  });

  it('renders pipeline display name', async () => {
    const mockResult = mockPipelineRunResponse('SUCCEEDED');
    render(<JobDetailsHeader pipelineRunResult={mockResult} />);

    await waitFor(() => {
      expect(screen.getByText(mockPipelineDetails.displayName)).toBeInTheDocument();
    });
  });

  it('renders pipeline version', async () => {
    const mockResult = mockPipelineRunResponse('SUCCEEDED');
    render(<JobDetailsHeader pipelineRunResult={mockResult} />);

    await waitFor(() => {
      expect(screen.getByText('Version 1')).toBeInTheDocument();
    });
  });

  it('renders pipeline description when available', async () => {
    const mockResult = mockPipelineRunResponse('SUCCEEDED');
    render(<JobDetailsHeader pipelineRunResult={mockResult} />);

    await waitFor(() => {
      expect(screen.getByText(mockPipelineDetails.description)).toBeInTheDocument();
    });
  });

  it('renders job status badge with correct text', async () => {
    const mockResult = mockPipelineRunResponse('SUCCEEDED');
    render(<JobDetailsHeader pipelineRunResult={mockResult} />);

    await waitFor(() => {
      expect(screen.getByText('succeeded')).toBeInTheDocument();
    });
  });

  it('renders job ID', async () => {
    const mockResult = mockPipelineRunResponse('SUCCEEDED');
    render(<JobDetailsHeader pipelineRunResult={mockResult} />);

    await waitFor(() => {
      expect(screen.getByText('Job ID')).toBeInTheDocument();
      expect(screen.getByText('job-123-456-789')).toBeInTheDocument();
    });
  });

  it('renders copy button for job ID', async () => {
    const mockResult = mockPipelineRunResponse('SUCCEEDED');
    render(<JobDetailsHeader pipelineRunResult={mockResult} />);

    await waitFor(() => {
      const copyButton = screen.getByRole('button');
      expect(copyButton).toBeInTheDocument();
    });
  });

  it('renders description for a pipeline run when available', async () => {
    const mockResult = mockPipelineRunResponse('SUCCEEDED', 'Test job description');
    render(<JobDetailsHeader pipelineRunResult={mockResult} />);

    await waitFor(() => {
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Test job description')).toBeInTheDocument();
    });
  });

  it('renders "No description" when description is not provided for a pipeline run', async () => {
    const mockResult = mockPipelineRunResponse('SUCCEEDED');
    render(<JobDetailsHeader pipelineRunResult={mockResult} />);

    await waitFor(() => {
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('No description')).toBeInTheDocument();
    });
  });
});
