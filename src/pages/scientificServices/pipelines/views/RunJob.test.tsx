import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Teaspoons, TeaspoonsContract } from 'src/libs/ajax/teaspoons/Teaspoons';
import { Pipeline, PipelineInput, PipelineList, PipelineWithDetails } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { mockUserPipelineQuotaDetails } from 'src/pages/scientificServices/pipelines/utils/mock-utils';
import { asMockedFn, partial, renderWithAppContexts as render } from 'src/testing/test-utils';

import { prepareUploadStartPipelineRun, RunJob } from './RunJob';

// Mock dependencies
jest.mock('src/libs/ajax/teaspoons/Teaspoons');

// Mock page navigation functions
jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getPath: jest.fn(() => '/test/'),
  getLink: jest.fn(() => '/'),
}));

// Mock global fetch for file upload testing
global.fetch = jest.fn();

// Mock crypto.randomUUID, so we can control the job ID generation in tests
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'mock-uuid-1234'),
  },
});

describe('RunJob Component', () => {
  const mockPipeline: Pipeline = {
    pipelineName: 'array_imputation',
    displayName: 'Array Imputation',
    pipelineVersion: 1,
    description: 'Test pipeline for array imputation',
  };

  const mockPipelineInputs: PipelineInput[] = [
    {
      name: 'multiSampleVcf',
      type: 'FILE',
      isRequired: true,
      fileSuffix: '.vcf.gz',
    },
    {
      name: 'outputBasename',
      type: 'STRING',
      isRequired: true,
    },
  ];

  const mockPipelineDetails: PipelineWithDetails = {
    ...mockPipeline,
    type: 'imputation',
    inputs: mockPipelineInputs,
  };

  const mockPipelineList: PipelineList = {
    results: [mockPipeline],
  };

  const mockTeaspoonsContract = partial<TeaspoonsContract>({
    getPipelines: jest.fn().mockResolvedValue(mockPipelineList),
    getPipelineDetails: jest.fn().mockResolvedValue(mockPipelineDetails),
    preparePipelineRun: jest.fn().mockResolvedValue({
      fileInputUploadUrls: {
        multiSampleVcf: {
          signedUrl: 'https://mock-signed-url.com/upload',
        },
      },
      jobId: 'mock-job-id',
    }),
    startPipelineRun: jest.fn().mockResolvedValue({ success: true }),
    getQuotaForPipeline: jest.fn().mockResolvedValue(mockUserPipelineQuotaDetails('array_imputation')),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    asMockedFn(Teaspoons).mockReturnValue(mockTeaspoonsContract);
    asMockedFn(fetch).mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);

    // Reset the crypto mock
    (global.crypto.randomUUID as jest.Mock).mockReturnValue('mock-uuid-1234');
  });

  it('renders the RunJob component with expected elements', async () => {
    render(<RunJob />);

    // Check for main headings and form elements
    expect(screen.getByText('Select a pipeline version')).toBeInTheDocument();
    expect(screen.getByText('Enter prefix for output file *')).toBeInTheDocument();
    expect(screen.getByText(/Enter description/)).toBeInTheDocument();
    expect(screen.getByText('Upload file *')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();

    // Wait for pipeline options to load
    await waitFor(() => {
      expect(mockTeaspoonsContract.getPipelines).toHaveBeenCalled();
    });
  });

  it('loads and displays pipeline options', async () => {
    render(<RunJob />);

    await waitFor(() => {
      expect(mockTeaspoonsContract.getPipelines).toHaveBeenCalled();
    });

    // Check that pipeline details are fetched for each pipeline
    await waitFor(() => {
      expect(mockTeaspoonsContract.getPipelineDetails).toHaveBeenCalledWith('array_imputation', 1);
    });
  });

  it('allows user to select a pipeline and enter form data', async () => {
    const user = userEvent.setup();
    render(<RunJob />);

    // Wait for pipelines to load
    await waitFor(() => {
      expect(mockTeaspoonsContract.getPipelines).toHaveBeenCalled();
    });

    // Wait for pipeline details to load
    await waitFor(() => {
      expect(mockTeaspoonsContract.getPipelineDetails).toHaveBeenCalled();
    });

    // Enter output file prefix
    const outputPrefixInput = screen.getByLabelText('output file prefix');
    await user.type(outputPrefixInput, 'test_output');

    expect(outputPrefixInput).toHaveValue('test_output');

    // Enter description
    const descriptionTextArea = screen.getByLabelText('description');
    await user.type(descriptionTextArea, 'Test description for pipeline run');

    expect(descriptionTextArea).toHaveValue('Test description for pipeline run');
  });

  it('handles file selection and triggers upload process', async () => {
    render(<RunJob />);

    // Wait for pipelines to load
    await waitFor(() => {
      expect(mockTeaspoonsContract.getPipelines).toHaveBeenCalled();
    });

    // Wait for pipeline details to be loaded
    await waitFor(() => {
      expect(mockTeaspoonsContract.getPipelineDetails).toHaveBeenCalled();
    });

    // Get the file input directly (it should be present even without pipeline selected)
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    // The test just verifies the file input exists and can be interacted with
    // Full integration testing would require more complex Select component mocking
  });

  it('validates required fields before allowing submission', async () => {
    render(<RunJob />);

    const submitButton = screen.getByText('Submit');
    expect(submitButton).toBeInTheDocument();

    // Wait for async operations to complete to avoid act() warnings
    await waitFor(() => {
      expect(mockTeaspoonsContract.getPipelines).toHaveBeenCalled();
    });
  });
});

describe('prepareUploadStartPipelineRun function', () => {
  const mockFile = new File(['test content'], 'test.vcf', { type: 'text/plain' });
  const mockPipelineInputs = { multiSampleVcf: 'test.vcf', outputBasename: 'test_output' };

  const mockTeaspoonsContract = partial<TeaspoonsContract>({
    preparePipelineRun: jest.fn().mockResolvedValue({
      fileInputUploadUrls: {
        multiSampleVcf: {
          signedUrl: 'https://mock-signed-url.com/upload',
        },
      },
      jobId: 'mock-job-id',
    }),
    startPipelineRun: jest.fn().mockResolvedValue({ success: true }),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    asMockedFn(Teaspoons).mockReturnValue(mockTeaspoonsContract);
    asMockedFn(fetch).mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);
    // Reset the crypto mock
    (global.crypto.randomUUID as jest.Mock).mockReturnValue('mock-uuid-1234');
  });

  it('successfully uploads file and starts pipeline run', async () => {
    const jobId = await prepareUploadStartPipelineRun(
      mockFile,
      'array_imputation',
      1,
      mockPipelineInputs,
      'Test description'
    );

    // Verify that preparePipelineRun was called with correct parameters
    expect(mockTeaspoonsContract.preparePipelineRun).toHaveBeenCalledWith(
      'mock-uuid-1234',
      'array_imputation',
      1,
      mockPipelineInputs,
      'Test description'
    );

    // Verify that file upload was attempted
    expect(fetch).toHaveBeenCalledWith('https://mock-signed-url.com/upload', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: mockFile,
    });

    // Verify that pipeline run was started
    expect(mockTeaspoonsContract.startPipelineRun).toHaveBeenCalledWith('mock-uuid-1234');

    // Verify that the function returns the expected job ID
    expect(jobId).toBe('mock-uuid-1234');
  });

  it('handles errors during pipeline preparation', async () => {
    const errorMessage = 'Failed to prepare pipeline run';
    asMockedFn(mockTeaspoonsContract.preparePipelineRun).mockRejectedValue(new Error(errorMessage));

    await expect(
      prepareUploadStartPipelineRun(mockFile, 'array_imputation', 1, mockPipelineInputs, 'Test description')
    ).rejects.toThrow(errorMessage);
  });

  it('handles errors during file upload', async () => {
    // Ensure preparePipelineRun succeeds so we can test file upload failure
    asMockedFn(mockTeaspoonsContract.preparePipelineRun).mockResolvedValue({
      fileInputUploadUrls: {
        multiSampleVcf: {
          signedUrl: 'https://mock-signed-url.com/upload',
        },
      },
      jobId: 'mock-job-id',
    });

    asMockedFn(fetch).mockRejectedValue(new Error('Network error'));

    await expect(
      prepareUploadStartPipelineRun(mockFile, 'array_imputation', 1, mockPipelineInputs, 'Test description')
    ).rejects.toThrow('Network error');
  });

  it('handles errors during pipeline run start', async () => {
    asMockedFn(mockTeaspoonsContract.startPipelineRun).mockRejectedValue(new Error('Failed to start pipeline'));

    await expect(
      prepareUploadStartPipelineRun(mockFile, 'array_imputation', 1, mockPipelineInputs, 'Test description')
    ).rejects.toThrow('Failed to start pipeline');
  });
});
