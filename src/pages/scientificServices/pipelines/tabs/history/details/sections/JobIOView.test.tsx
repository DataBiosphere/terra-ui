import { screen, waitFor } from '@testing-library/react';
import React from 'react';
import { PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { usePipelineDetails } from 'src/pages/scientificServices/pipelines/hooks/usePipelineDetails';
import { getOutputFileSize } from 'src/pages/scientificServices/pipelines/utils/download-utils';
import {
  mockPipelineRunResponse,
  mockPipelineWithDetails,
} from 'src/pages/scientificServices/pipelines/utils/mock-utils';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { JobIOView } from './JobIOView';

jest.mock('src/pages/scientificServices/pipelines/hooks/usePipelineDetails');
jest.mock('src/pages/scientificServices/pipelines/utils/download-utils');

describe('JobIOView', () => {
  const mockUsePipelineDetails = usePipelineDetails as jest.MockedFunction<typeof usePipelineDetails>;

  const mockPipelineDetails = mockPipelineWithDetails('array_imputation');

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePipelineDetails.mockReturnValue({
      pipelineDetails: mockPipelineDetails,
      isLoading: false,
      error: undefined,
    });
    (getOutputFileSize as jest.Mock).mockResolvedValue('10.5 MB');
  });

  it('renders JobInputsView component with Inputs and Outputs side by side', async () => {
    const mockResult = mockPipelineRunResponse('SUCCEEDED');
    render(<JobIOView pipelineRunResult={mockResult} />);

    expect(mockUsePipelineDetails).toHaveBeenCalledWith('array_imputation', 1);

    await waitFor(() => {
      expect(screen.getByText('Inputs & Outputs')).toBeInTheDocument();
      expect(screen.getByText('Inputs')).toBeInTheDocument();
      expect(screen.getByText('Outputs')).toBeInTheDocument();
    });
  });

  it('renders error message instead of outputs when errorReport is present', async () => {
    const mockResult: PipelineRunResponse = {
      ...mockPipelineRunResponse('FAILED'),
      errorReport: {
        message: 'Pipeline failed because your vcf was terrrrrrrrible',
        errorCode: 500,
        causes: [],
      },
    };

    render(<JobIOView pipelineRunResult={mockResult} />);

    await waitFor(() => {
      expect(screen.getByText('No outputs were generated due to the following error:')).toBeInTheDocument();
      expect(screen.getByText('Pipeline failed because your vcf was terrrrrrrrible')).toBeInTheDocument();
    });
  });
});
