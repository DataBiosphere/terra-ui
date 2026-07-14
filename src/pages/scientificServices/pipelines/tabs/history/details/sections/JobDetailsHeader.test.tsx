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
      const copyButtons = screen.getAllByRole('button');
      expect(copyButtons.length).toBeGreaterThanOrEqual(1);
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

  it('renders citation label', async () => {
    const mockResult = mockPipelineRunResponse('SUCCEEDED');
    render(<JobDetailsHeader pipelineRunResult={mockResult} />);

    await waitFor(() => {
      expect(screen.getByText('Citation')).toBeInTheDocument();
    });
  });

  it('renders citation text content from mock data', async () => {
    const mockResult = mockPipelineRunResponse('SUCCEEDED');
    render(<JobDetailsHeader pipelineRunResult={mockResult} />);

    await waitFor(() => {
      // Verify the citation content from the mock
      expect(screen.getByText(/Data Science Services at Broad Clinical Laboratories/)).toBeInTheDocument();
      expect(screen.getByText(/All of Us \+ AnVIL Array Imputation/)).toBeInTheDocument();
      expect(screen.getByText(/https:\/\/services\.terra\.bio\//)).toBeInTheDocument();
    });
  });

  it('renders copy button for citation', async () => {
    const mockResult = mockPipelineRunResponse('SUCCEEDED');
    render(<JobDetailsHeader pipelineRunResult={mockResult} />);

    await waitFor(() => {
      const copyButtons = screen.getAllByRole('button');
      // There should be at least 2 copy buttons: one for job ID and one for citation
      expect(copyButtons.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('does not render citation section when citation is not provided', async () => {
    const mockResult = mockPipelineRunResponse('SUCCEEDED', undefined, null);
    render(<JobDetailsHeader pipelineRunResult={mockResult} />);

    await waitFor(() => {
      expect(screen.queryByText('Citation')).not.toBeInTheDocument();
    });
  });
});
