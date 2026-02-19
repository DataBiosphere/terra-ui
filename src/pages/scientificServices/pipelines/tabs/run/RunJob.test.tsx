import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Teaspoons, TeaspoonsContract } from 'src/libs/ajax/teaspoons/Teaspoons';
import { Pipeline, PipelineInput, PipelineList } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { notify } from 'src/libs/notifications';
import {
  mockPipelineWithDetails,
  mockUserPipelineQuotaDetails,
} from 'src/pages/scientificServices/pipelines/utils/mock-utils';
import {
  preparePipelineRun,
  startPipelineRun,
  uploadPipelineFiles,
} from 'src/pages/scientificServices/pipelines/utils/submission-utils';
import { asMockedFn, partial, renderWithAppContexts as render } from 'src/testing/test-utils';

import { RunJob } from './RunJob';

// Mock dependencies
jest.mock('src/libs/ajax/teaspoons/Teaspoons');

// Mock page navigation functions
jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getPath: jest.fn(() => '/test/'),
  getLink: jest.fn(() => '/'),
}));

jest.mock('src/libs/notifications', () => ({
  ...jest.requireActual('src/libs/notifications'),
  notify: jest.fn(),
}));

jest.mock('src/pages/scientificServices/pipelines/utils/submission-utils', () => ({
  ...jest.requireActual('src/pages/scientificServices/pipelines/utils/submission-utils'),
  preparePipelineRun: jest.fn(),
  uploadPipelineFiles: jest.fn(),
  startPipelineRun: jest.fn(),
}));

// Mock global fetch for file upload testing
global.fetch = jest.fn();

// Mock XMLHttpRequest for file upload testing
class MockXMLHttpRequest {
  upload = {
    addEventListener: jest.fn(),
  };

  addEventListener = jest.fn();

  open = jest.fn();

  setRequestHeader = jest.fn();

  send = jest.fn();
}

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

  const mockPipelineList: PipelineList = {
    results: [mockPipeline],
  };

  const mockTeaspoonsContract = partial<TeaspoonsContract>({
    getPipelines: jest.fn().mockResolvedValue(mockPipelineList),
    getPipelineDetails: jest.fn().mockResolvedValue(mockPipelineWithDetails('array_imputation')),
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

    await waitFor(() => {
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    // Check for main headings and form elements
    expect(screen.getByText('Select a pipeline version')).toBeInTheDocument();
    expect(screen.getByText('Enter output basename')).toBeInTheDocument();
    expect(screen.getByText('Enter minimum imputation quality for inclusion')).toBeInTheDocument();
    expect(screen.getByText(/Enter description/)).toBeInTheDocument();
    expect(screen.getByText('Select a multi-sample VCF file')).toBeInTheDocument();
    expect(screen.getByText('Allow chunk failures')).toBeInTheDocument();

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

    // Wait for submit button to appear, indicating page has loaded
    await waitFor(() => {
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    // Enter output file prefix
    const outputPrefixInput = screen.getByLabelText('output basename text input');
    await user.type(outputPrefixInput, 'test_output');

    expect(outputPrefixInput).toHaveValue('test_output');

    // Enter minDr2ForInclusion
    const minDr2Input = screen.getByLabelText('minimum imputation quality for inclusion float input');
    await user.type(minDr2Input, '0.3');

    expect(minDr2Input).toHaveValue('0.3');

    // Enter description
    const descriptionTextArea = screen.getByLabelText('description');
    await user.type(descriptionTextArea, 'Test description for pipeline run');

    expect(descriptionTextArea).toHaveValue('Test description for pipeline run');

    // Toggle allowChunkFailures
    const allowChunkFailuresCheckbox = screen.getByLabelText('Allow chunk failures');
    // initially assert unchecked because the default is false
    expect(allowChunkFailuresCheckbox).not.toBeChecked();

    await user.click(allowChunkFailuresCheckbox);

    expect(allowChunkFailuresCheckbox).toBeChecked();
  });

  it('handles file selection and triggers upload process', async () => {
    render(<RunJob />);

    // Wait for submit button to appear, indicating page has loaded
    await waitFor(() => {
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    // clicks the Upload File button for local uploads
    const selectLocalInputButton = screen.getByText('Upload File');
    await userEvent.click(selectLocalInputButton);

    // Get the file input directly (it should be present even without pipeline selected)
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    // The test just verifies the file input exists and can be interacted with
    // Full integration testing would require more complex Select component mocking
  });

  it('validates required fields before allowing submission', async () => {
    render(<RunJob />);

    // Wait for submit button to appear, indicating page has loaded
    await waitFor(() => {
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockTeaspoonsContract.getPipelineDetails).toHaveBeenCalledWith('array_imputation', 1);
    });

    const submitButton = screen.getByText('Submit');

    // Submit button should be disabled initially due to missing required fields
    expect(submitButton).toHaveAttribute('aria-disabled', 'true');

    // Fill in the output prefix
    const outputPrefixInput = screen.getByLabelText('output basename text input');
    await userEvent.type(outputPrefixInput, 'test_output');
    expect(outputPrefixInput).toHaveValue('test_output');

    // Still disabled because other required fields are empty
    expect(submitButton).toHaveAttribute('aria-disabled', 'true');

    // select a valid file
    const selectLocalInputButton = screen.getByText('Upload File');
    await userEvent.click(selectLocalInputButton);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'test.vcf.gz', { type: 'text/plain' });
    await waitFor(() => userEvent.upload(fileInput, file));
    expect(fileInput.files?.[0]).toBe(file);

    // the submit button should be enabled now that all required fields are filled and valid
    expect(submitButton).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('disables the submit button if an invalid file type is selected', async () => {
    render(<RunJob />);

    // Wait for submit button to appear, indicating page has loaded
    await waitFor(() => {
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockTeaspoonsContract.getPipelineDetails).toHaveBeenCalledWith('array_imputation', 1);
    });

    const submitButton = screen.getByText('Submit');

    // Fill in the output prefix, since it's required
    const outputPrefixInput = screen.getByLabelText('output basename text input');
    await userEvent.type(outputPrefixInput, 'test_output');
    expect(outputPrefixInput).toHaveValue('test_output');

    // select an invalid text file for vcf input
    const selectLocalInputButton = screen.getByText('Upload File');
    await userEvent.click(selectLocalInputButton);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    await waitFor(() => userEvent.upload(fileInput, invalidFile));
    expect(fileInput.files?.[0]).toBe(invalidFile);

    // The submit button should remain disabled due to invalid file type
    expect(submitButton).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText(/Invalid file type/)).toBeInTheDocument();
  });

  it('handleSubmit filters out empty optional inputs', async () => {
    asMockedFn(preparePipelineRun).mockResolvedValue({
      jobId: 'mock-job-id',
      fileInputUploadUrls: {
        multiSampleVcf: { signedUrl: 'https://mock-signed-url.com/upload' },
      },
    });

    const user = userEvent.setup();
    render(<RunJob />);

    // Wait for submit button to appear, indicating page has loaded
    await waitFor(() => {
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    // confirm that the optional input field is rendered
    expect(screen.getByLabelText('minimum imputation quality for inclusion float input')).toBeInTheDocument();

    // only fill in the two required fields
    const outputPrefixInput = screen.getByLabelText('output basename text input');
    await user.type(outputPrefixInput, 'test_output');
    expect(outputPrefixInput).toHaveValue('test_output');

    const selectLocalInputButton = screen.getByText('Upload File');
    await userEvent.click(selectLocalInputButton);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'test.vcf.gz', { type: 'text/plain' });
    await waitFor(() => userEvent.upload(fileInput, file));
    expect(fileInput.files?.[0]).toBe(file);

    const submitButton = screen.getByText('Submit');
    await waitFor(() => user.click(submitButton));

    // verify that preparePipelineRun was called with filtered inputs
    expect(preparePipelineRun).toHaveBeenCalledWith(
      'array_imputation',
      1,
      {
        multiSampleVcf: expect.any(File),
        outputBasename: 'test_output',
        // minDr2ForInclusion not present
      },
      expect.any(String)
    );
  });

  it('handles error when preparePipelineRun fails', async () => {
    const mockError = new Error('Failed to prepare pipeline');
    asMockedFn(preparePipelineRun).mockRejectedValue(mockError);

    const user = userEvent.setup();
    render(<RunJob />);

    await waitFor(() => {
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    // Fill in required fields
    const outputPrefixInput = screen.getByLabelText('output basename text input');
    await user.type(outputPrefixInput, 'test_output');

    const selectLocalInputButton = screen.getByText('Upload File');
    await userEvent.click(selectLocalInputButton);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'test.vcf.gz', { type: 'text/plain' });
    await waitFor(() => userEvent.upload(fileInput, file));

    const submitButton = screen.getByText('Submit');
    await waitFor(() => user.click(submitButton));

    await waitFor(() => {
      expect(notify).toHaveBeenCalledWith('error', 'Error: Failed to prepare pipeline');
    });

    // Verify submit button is re-enabled after error
    expect(submitButton).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('handles error when uploadPipelineFiles fails', async () => {
    asMockedFn(preparePipelineRun).mockResolvedValue({
      jobId: 'mock-job-id',
      fileInputUploadUrls: {
        multiSampleVcf: { signedUrl: 'https://mock-signed-url.com/upload' },
      },
    });

    const mockError = new Error('Upload failed :(');
    asMockedFn(uploadPipelineFiles).mockRejectedValue(mockError);

    const user = userEvent.setup();
    render(<RunJob />);

    await waitFor(() => {
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    // Fill in required fields
    const outputPrefixInput = screen.getByLabelText('output basename text input');
    await user.type(outputPrefixInput, 'test_output');

    const selectLocalInputButton = screen.getByText('Upload File');
    await userEvent.click(selectLocalInputButton);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'test.vcf.gz', { type: 'text/plain' });
    await waitFor(() => userEvent.upload(fileInput, file));

    const submitButton = screen.getByText('Submit');
    await waitFor(() => user.click(submitButton));

    await waitFor(() => {
      expect(notify).toHaveBeenCalledWith('error', 'Error: Upload failed :(');
    });

    // Verify submit button is re-enabled after error
    expect(submitButton).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('handles error when startPipelineRun fails', async () => {
    asMockedFn(preparePipelineRun).mockResolvedValue({
      jobId: 'mock-job-id',
      fileInputUploadUrls: {
        multiSampleVcf: { signedUrl: 'https://mock-signed-url.com/upload' },
      },
    });

    asMockedFn(uploadPipelineFiles).mockResolvedValue(undefined);

    const mockError = new Error('Failed to start run');
    asMockedFn(startPipelineRun).mockRejectedValue(mockError);

    const user = userEvent.setup();
    render(<RunJob />);

    await waitFor(() => {
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    // Fill in required fields
    const outputPrefixInput = screen.getByLabelText('output basename text input');
    await user.type(outputPrefixInput, 'test_output');

    const selectLocalInputButton = screen.getByText('Upload File');
    await userEvent.click(selectLocalInputButton);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['test'], 'test.vcf.gz', { type: 'text/plain' });
    await waitFor(() => userEvent.upload(fileInput, file));

    const submitButton = screen.getByText('Submit');
    await waitFor(() => user.click(submitButton));

    await waitFor(() => {
      expect(notify).toHaveBeenCalledWith('error', 'Error: Failed to start run');
    });

    // Verify submit button is re-enabled after error
    expect(submitButton).not.toHaveAttribute('aria-disabled', 'true');
  });
});

describe('uploadPipelineFiles function', () => {
  const mockFile = new File(['test content'], 'test.vcf', { type: 'text/plain' });
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
  const mockUserPipelineInputs = { multiSampleVcf: mockFile, outputBasename: 'test_output' };

  beforeEach(() => {
    jest.clearAllMocks();

    const mockLocationUrl = 'https://mock-session-url.com/upload';
    (global.fetch as jest.Mock).mockResolvedValue({
      headers: {
        get: (header: string) => (header === 'Location' ? mockLocationUrl : null),
      },
      ok: true,
      status: 200,
    } as Response);
    // Reset the crypto mock
    (global.crypto.randomUUID as jest.Mock).mockReturnValue('mock-uuid-1234');
  });

  it('successfully initiates a resumable upload session for file inputs', async () => {
    const mockXHR = new MockXMLHttpRequest();

    // Simulate successful upload
    mockXHR.addEventListener = jest.fn((event, callback) => {
      if (event === 'load') {
        setTimeout(() => callback({ status: 200 }), 0);
      }
    });

    Object.defineProperty(mockXHR, 'status', {
      value: 200,
      writable: true,
    });

    global.XMLHttpRequest = jest.fn(() => mockXHR) as any;

    // this test needs the actual implementation of uploadPipelineFiles
    const { uploadPipelineFiles } = jest.requireActual('src/pages/scientificServices/pipelines/utils/submission-utils');

    await uploadPipelineFiles(
      'array_imputation',
      1,
      mockPipelineInputs,
      mockUserPipelineInputs,
      {
        multiSampleVcf: { signedUrl: 'https://mock-signed-url.com/upload' },
      },
      jest.fn()
    );

    // Verify that the file upload was initiated
    expect(global.fetch).toHaveBeenCalledWith('https://mock-signed-url.com/upload', {
      method: 'POST',
      headers: { 'x-goog-resumable': 'start', 'Content-Type': 'application/octet-stream' },
    });

    // Verify that XMLHttpRequest was used for file upload
    expect(global.XMLHttpRequest).toHaveBeenCalled();
    expect(mockXHR.open).toHaveBeenCalledWith('PUT', 'https://mock-session-url.com/upload');
    expect(mockXHR.setRequestHeader).toHaveBeenCalledWith('Content-Type', 'application/octet-stream');
    expect(mockXHR.send).toHaveBeenCalledWith(mockFile);
  });

  it('handles errors during file upload', async () => {
    const mockSend = jest.fn(() => {
      throw new Error('Network error');
    });

    const mockXHR = new MockXMLHttpRequest();
    mockXHR.send = mockSend;

    global.XMLHttpRequest = jest.fn(() => mockXHR) as any;

    // this test needs the actual implementation of uploadPipelineFiles
    const { uploadPipelineFiles } = jest.requireActual('src/pages/scientificServices/pipelines/utils/submission-utils');

    await expect(
      uploadPipelineFiles(
        'array_imputation',
        1,
        mockPipelineInputs,
        mockUserPipelineInputs,
        {
          multiSampleVcf: { signedUrl: 'https://mock-signed-url.com/upload' },
        },
        jest.fn()
      )
    ).rejects.toThrow('Network error');
  });
});
