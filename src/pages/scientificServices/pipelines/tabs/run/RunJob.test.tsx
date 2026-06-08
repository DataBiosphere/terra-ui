import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Teaspoons, TeaspoonsContract } from 'src/libs/ajax/teaspoons/Teaspoons';
import { Pipeline, PipelineInput, PipelineList } from 'src/libs/ajax/teaspoons/teaspoons-models';
import * as Nav from 'src/libs/nav';
import { notify } from 'src/libs/notifications';
import { usePipelinesList } from 'src/pages/scientificServices/pipelines/hooks/usePipelinesList';
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

jest.mock('src/pages/scientificServices/pipelines/hooks/usePipelinesList', () => ({
  usePipelinesList: jest.fn(),
}));

// Mock page navigation functions
jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getPath: jest.fn(() => '/test/'),
  getLink: jest.fn(() => '/#pipelines/terms-of-service?document=termsOfService'),
  useRoute: jest.fn(() => ({ query: {} })),
  updateSearch: jest.fn(),
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

// Helper function to select local file input and upload a file
const selectAndUploadLocalFile = async (fileName: string, inputDisplayName: string) => {
  const fileSection = screen.getByText(`Select a ${inputDisplayName}`).closest('div');
  const uploadButton = within(fileSection!).getByText('Upload File');
  await userEvent.click(uploadButton);
  const fileInput = fileSection!.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(['test'], fileName, { type: 'text/plain' });
  await waitFor(() => userEvent.upload(fileInput, file));
  expect(fileInput.files?.[0]).toBe(file);
  return file;
};

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
    asMockedFn(usePipelinesList).mockReturnValue({
      pipelines: [mockPipeline],
      uniquePipelines: [mockPipeline],
      isLoading: false,
      error: undefined,
    });
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
    expect(screen.getByText('Select a manifest file')).toBeInTheDocument();
    expect(screen.getByText(/I have read and agree to /)).toBeInTheDocument();
  });

  it('loads and displays pipeline options', async () => {
    render(<RunJob />);

    await waitFor(() => {
      expect(screen.getByText('Array Imputation - v1')).toBeInTheDocument();
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

  it('handles VCF file selection and triggers upload process', async () => {
    render(<RunJob />);

    // Wait for submit button to appear, indicating page has loaded
    await waitFor(() => {
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    // clicks the Upload File button for local uploads
    const vcfFileSection = screen.getByText('Select a multi-sample VCF file').closest('div');
    const vcfUploadButton = within(vcfFileSection!).getByText('Upload File');
    await userEvent.click(vcfUploadButton);

    // Get the file input directly (it should be present even without pipeline selected)
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    // The test just verifies the file input exists and can be interacted with
    // Full integration testing would require more complex Select component mocking
  });

  // The test just verifies the manifest file input exists and can be interacted with
  // Full integration testing would require more complex Select component mocking
  it('handles manifest file selection and triggers upload process', async () => {
    render(<RunJob />);

    // Wait for submit button to appear, indicating page has loaded
    await waitFor(() => {
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    // clicks the Upload File button for local uploads
    const manifestFileSection = screen.getByText('Select a manifest file').closest('div');
    const manifestUploadButton = within(manifestFileSection!).getByText('Upload File');
    await userEvent.click(manifestUploadButton);

    // Get the file input directly (it should be present even without pipeline selected)
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
  });

  it('validates required fields before allowing submission', async () => {
    render(<RunJob />);

    // Wait for submit button to appear
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
    await selectAndUploadLocalFile('test.vcf.gz', 'multi-sample VCF file');

    // Still disabled because Terms of Service checkbox is not checked
    expect(submitButton).toHaveAttribute('aria-disabled', 'true');

    // Check the Terms of Service checkbox
    const tosCheckbox = screen.getByRole('checkbox', {
      name: /I have read and agree to the/,
    });
    await userEvent.click(tosCheckbox);

    // the submit button should be enabled now that all required fields are filled and valid
    expect(submitButton).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('disables the submit button if multiSampleVCF cloud file is selected without sharing confirmation', async () => {
    const user = userEvent.setup();
    render(<RunJob />);

    // Wait for submit button to appear
    await waitFor(() => {
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockTeaspoonsContract.getPipelineDetails).toHaveBeenCalledWith('array_imputation', 1);
    });

    const submitButton = screen.getByText('Submit');

    // Fill in the output prefix (required field)
    const outputPrefixInput = screen.getByLabelText('output basename text input');
    await user.type(outputPrefixInput, 'test_output');
    expect(outputPrefixInput).toHaveValue('test_output');

    // Select cloud storage as the source for multi-sample VCF file
    const vcfFileSection = screen.getByText('Select a multi-sample VCF file').closest('div');
    const selectCloudInputButton = within(vcfFileSection!).getByText('Google Cloud Storage');
    await user.click(selectCloudInputButton);

    // Enter a valid GCS path
    const gcsPathInput = screen.getByPlaceholderText('gs://bucket/path/to/file.vcf.gz');
    await user.type(gcsPathInput, 'gs://my-bucket/data/multiSampleVcf.vcf.gz');

    // At this point, submit button should still be disabled because sharing confirmation is unchecked
    expect(submitButton).toHaveAttribute('aria-disabled', 'true');

    // Now check the sharing confirmation checkbox
    const sharingConfirmationCheckbox = screen.getByRole('checkbox', {
      name: /I have shared this file with Broad Scientific Services/,
    });
    await user.click(sharingConfirmationCheckbox);

    // Still disabled because Terms of Service checkbox is not checked
    expect(submitButton).toHaveAttribute('aria-disabled', 'true');

    // Check the Terms of Service checkbox
    const tosCheckbox = screen.getByRole('checkbox', {
      name: /I have read and agree to the/,
    });
    await user.click(tosCheckbox);

    // Now the submit button should be enabled
    expect(submitButton).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('disables the submit button if manifest cloud file is selected without sharing confirmation', async () => {
    const user = userEvent.setup();
    render(<RunJob />);

    // Wait for submit button to appear
    await waitFor(() => {
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockTeaspoonsContract.getPipelineDetails).toHaveBeenCalledWith('array_imputation', 1);
    });

    const submitButton = screen.getByText('Submit');

    // Fill in the output prefix (required field)
    const outputPrefixInput = screen.getByLabelText('output basename text input');
    await user.type(outputPrefixInput, 'test_output');
    expect(outputPrefixInput).toHaveValue('test_output');

    // Fill in the required multi-sample VCF file input with a local file (required field)
    await selectAndUploadLocalFile('test.vcf.gz', 'multi-sample VCF file');

    // Select cloud storage as the source for manifest file
    const manifestFileSection = screen.getByText('Select a manifest file').closest('div');
    const selectCloudInputButton = within(manifestFileSection!).getByText('Google Cloud Storage');
    await user.click(selectCloudInputButton);

    // Enter a valid GCS path
    const gcsPathInput = screen.getByPlaceholderText('gs://bucket/path/to/file.tsv');
    await user.type(gcsPathInput, 'gs://my-bucket/data/manifest.tsv');

    // At this point, submit button should still be disabled because sharing confirmation is unchecked
    expect(submitButton).toHaveAttribute('aria-disabled', 'true');

    // Now check the sharing confirmation checkbox
    const sharingConfirmationCheckbox = screen.getByRole('checkbox', {
      name: /I have shared this file with Broad Scientific Services/,
    });
    await user.click(sharingConfirmationCheckbox);

    // Check the Terms of Service checkbox
    const tosCheckbox = screen.getByRole('checkbox', {
      name: /I have read and agree to the/,
    });
    await user.click(tosCheckbox);

    // Now the submit button should be enabled
    expect(submitButton).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('disables the submit button if an invalid file type is selected for multi-sample VCF', async () => {
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
    await selectAndUploadLocalFile('test.txt', 'multi-sample VCF file');

    // The submit button should remain disabled due to invalid file type
    expect(submitButton).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText(/Invalid file type/)).toBeInTheDocument();
  });

  it('disables the submit button if an invalid file type is selected for manifest file', async () => {
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

    // Fill in the required multi-sample VCF file input with a local file (required field)
    await selectAndUploadLocalFile('test.vcf.gz', 'multi-sample VCF file');

    // select an invalid text file for manifest input
    await selectAndUploadLocalFile('test.txt', 'manifest file');

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

    await selectAndUploadLocalFile('test.vcf.gz', 'multi-sample VCF file');

    // Check the Terms of Service checkbox
    const tosCheckbox = screen.getByRole('checkbox', {
      name: /I have read and agree to the/,
    });
    await user.click(tosCheckbox);

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
      expect.any(String),
      true
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

    await selectAndUploadLocalFile('test.vcf.gz', 'multi-sample VCF file');

    // Check the Terms of Service checkbox
    const tosCheckbox = screen.getByRole('checkbox', {
      name: /I have read and agree to the/,
    });
    await user.click(tosCheckbox);

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

    await selectAndUploadLocalFile('test.vcf.gz', 'multi-sample VCF file');

    // Check the Terms of Service checkbox
    const tosCheckbox = screen.getByRole('checkbox', {
      name: /I have read and agree to the/,
    });
    await user.click(tosCheckbox);

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

    await selectAndUploadLocalFile('test.vcf.gz', 'multi-sample VCF file');

    // Check the Terms of Service checkbox
    const tosCheckbox = screen.getByRole('checkbox', {
      name: /I have read and agree to the/,
    });
    await user.click(tosCheckbox);

    const submitButton = screen.getByText('Submit');
    await waitFor(() => user.click(submitButton));

    await waitFor(() => {
      expect(notify).toHaveBeenCalledWith('error', 'Error: Failed to start run');
    });

    // Verify submit button is re-enabled after error
    expect(submitButton).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('resets Terms of Service checkbox when "Run another job" is clicked', async () => {
    asMockedFn(preparePipelineRun).mockResolvedValue({
      jobId: 'mock-job-id',
      fileInputUploadUrls: {
        multiSampleVcf: { signedUrl: 'https://mock-signed-url.com/upload' },
      },
    });
    asMockedFn(uploadPipelineFiles).mockResolvedValue(undefined);
    asMockedFn(startPipelineRun).mockResolvedValue('mock-job-id');

    const user = userEvent.setup();
    render(<RunJob />);

    await waitFor(() => {
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    // Fill in required fields
    const outputPrefixInput = screen.getByLabelText('output basename text input');
    await user.type(outputPrefixInput, 'test_output');

    await selectAndUploadLocalFile('test.vcf.gz', 'multi-sample VCF file');

    // Check the Terms of Service checkbox
    const tosCheckbox = screen.getByRole('checkbox', {
      name: /I have read and agree to the/,
    });
    await user.click(tosCheckbox);
    expect(tosCheckbox).toBeChecked();

    // Submit the form
    const submitButton = screen.getByText('Submit');
    await user.click(submitButton);

    // Wait for job submission to complete
    await waitFor(() => {
      expect(screen.getByText('Run another job')).toBeInTheDocument();
    });

    // Click "Run another job" button
    const runAnotherJobButton = screen.getByText('Run another job');
    await user.click(runAnotherJobButton);

    // Verify that ToS checkbox is unchecked after reset
    await waitFor(() => {
      const resetTosCheckbox = screen.getByRole('checkbox', {
        name: /I have read and agree to the/,
      });
      expect(resetTosCheckbox).not.toBeChecked();
    });

    // Verify submit button is disabled again
    await waitFor(() => {
      expect(screen.getByText('Submit')).toHaveAttribute('aria-disabled', 'true');
    });
  });

  it('displays Terms of Service link that opens in a new tab', async () => {
    render(<RunJob />);

    await waitFor(() => {
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    // Find the ToS link
    const tosLink = screen.getByText('Scientific Services Terms of Service and Acceptable Use Policy');
    expect(tosLink).toBeInTheDocument();
    expect(tosLink.closest('a')).toHaveAttribute('href', '/#pipelines/terms-of-service?document=termsOfService');
    expect(tosLink.closest('a')).toHaveAttribute('href', '/#pipelines/terms-of-service?document=termsOfService');
    expect(tosLink.closest('a')).toHaveAttribute('target', '_blank');
    expect(tosLink.closest('a')).toHaveAttribute('rel', 'noopener noreferrer');

    // Verify Nav.getLink was called with correct parameters
    expect(Nav.getLink).toHaveBeenCalledWith(
      'scientific-services-terms-of-service',
      {},
      { document: 'termsOfService' }
    );
  });

  it('displays insufficient quota warning and disables all input fields when user lacks quota', async () => {
    // Mock insufficient quota: user has consumed most of their quota
    const insufficientQuotaDetails = {
      pipelineName: 'array_imputation',
      quotaLimit: 2000,
      quotaConsumed: 2000,
      quotaUnits: 'units',
    };

    asMockedFn(mockTeaspoonsContract.getQuotaForPipeline).mockResolvedValue(insufficientQuotaDetails);

    render(<RunJob />);

    await waitFor(() => {
      expect(mockTeaspoonsContract.getPipelineDetails).toHaveBeenCalledWith('array_imputation', 1);
    });

    await waitFor(() => {
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    expect(screen.getByText('Submit')).toHaveAttribute('aria-disabled', 'true');

    expect(screen.getByText(/You do not have enough quota remaining to run this pipeline/)).toBeInTheDocument();

    const outputPrefixInput = screen.getByLabelText('output basename text input');
    expect(outputPrefixInput).toBeDisabled();

    const minDr2Input = screen.getByLabelText('minimum imputation quality for inclusion float input');
    expect(minDr2Input).toBeDisabled();

    const descriptionTextArea = screen.getByLabelText('description');
    expect(descriptionTextArea).toBeDisabled();

    const allowChunkFailuresCheckbox = screen.getByLabelText('Allow chunk failures');
    expect(allowChunkFailuresCheckbox).toHaveAttribute('disabled');

    const fileInputs = screen.getAllByText(/Select a/);
    expect(fileInputs.length).toBeGreaterThan(0);

    const tosCheckbox = screen.getByRole('checkbox', {
      name: /I have read and agree to the/,
    });
    expect(tosCheckbox).toHaveAttribute('disabled');
  });

  describe('Query parameter pre-selection', () => {
    const lowPassPipeline: Pipeline = {
      pipelineName: 'low_pass_imputation',
      displayName: 'Low Pass Imputation',
      pipelineVersion: 1,
      description: 'Test pipeline for low pass imputation',
    };

    const lowPassPipelineV2: Pipeline = {
      pipelineName: 'low_pass_imputation',
      displayName: 'Low Pass Imputation',
      pipelineVersion: 2,
      description: 'Test pipeline for low pass imputation v2',
    };

    const multiplePipelines = [mockPipeline, lowPassPipelineV2, lowPassPipeline];

    beforeEach(() => {
      asMockedFn(usePipelinesList).mockReturnValue({
        pipelines: multiplePipelines,
        uniquePipelines: [mockPipeline, lowPassPipeline],
        isLoading: false,
        error: undefined,
      });
      asMockedFn(mockTeaspoonsContract.getPipelineDetails).mockResolvedValue(
        mockPipelineWithDetails('low_pass_imputation')
      );
    });

    it('defaults to the first pipeline when no query params are provided', async () => {
      asMockedFn(Nav.useRoute).mockReturnValue({ query: {} } as any);

      render(<RunJob />);

      await waitFor(() => {
        expect(screen.getByText('Array Imputation - v1')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockTeaspoonsContract.getPipelineDetails).toHaveBeenCalledWith('array_imputation', 1);
      });
    });

    it('pre-selects a pipeline by pipelineName query param', async () => {
      asMockedFn(Nav.useRoute).mockReturnValue({
        query: { pipelineName: 'low_pass_imputation' },
      } as any);

      render(<RunJob />);

      await waitFor(() => {
        expect(mockTeaspoonsContract.getPipelineDetails).toHaveBeenCalledWith('low_pass_imputation', 2);
      });
    });

    it('pre-selects the correct version when both pipelineName and version query params are provided', async () => {
      asMockedFn(Nav.useRoute).mockReturnValue({
        query: { pipelineName: 'low_pass_imputation', version: '2' },
      } as any);

      render(<RunJob />);

      await waitFor(() => {
        expect(mockTeaspoonsContract.getPipelineDetails).toHaveBeenCalledWith('low_pass_imputation', 2);
      });
    });

    it('falls back to the first matching pipeline when the specified version is not found', async () => {
      asMockedFn(Nav.useRoute).mockReturnValue({
        query: { pipelineName: 'low_pass_imputation', version: '99' },
      } as any);

      render(<RunJob />);

      // Should fall back to v2 (first match) since v99 doesn't exist
      await waitFor(() => {
        expect(mockTeaspoonsContract.getPipelineDetails).toHaveBeenCalledWith('low_pass_imputation', 2);
      });
    });

    it('defaults to the first pipeline when pipelineName query param does not match any pipeline', async () => {
      asMockedFn(Nav.useRoute).mockReturnValue({
        query: { pipelineName: 'nonexistent_pipeline' },
      } as any);

      render(<RunJob />);

      await waitFor(() => {
        expect(mockTeaspoonsContract.getPipelineDetails).toHaveBeenCalledWith('array_imputation', 1);
      });
    });

    it('updates the URL when the user manually selects a pipeline from the dropdown', async () => {
      const user = userEvent.setup();
      asMockedFn(Nav.useRoute).mockReturnValue({ query: {} } as any);

      render(<RunJob />);

      // Wait for the dropdown to be populated
      await waitFor(() => {
        expect(screen.getByText('Array Imputation - v1')).toBeInTheDocument();
      });

      // Open the pipeline selector dropdown and pick Low Pass Imputation
      const select = screen.getByRole('combobox');
      await user.click(select);
      await user.click(screen.getByText('Low Pass Imputation - v1'));

      expect(asMockedFn(Nav.updateSearch)).toHaveBeenCalledWith({ pipelineName: 'low_pass_imputation', version: 1 });
    });
  });
});

describe('uploadPipelineFiles function with multi-sample VCF', () => {
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

describe('uploadPipelineFiles function with manifest file', () => {
  const mockFile = new File(['test content'], 'test.tsv', { type: 'text/plain' });
  const mockPipelineInputs: PipelineInput[] = [
    {
      name: 'testManifestInput',
      type: 'MANIFEST',
      isRequired: true,
      fileSuffix: '.tsv',
    },
  ];
  const mockUserPipelineInputs = { testManifestInput: mockFile };

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
        testManifestInput: { signedUrl: 'https://mock-signed-url.com/upload' },
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
          testManifestInput: { signedUrl: 'https://mock-signed-url.com/upload' },
        },
        jest.fn()
      )
    ).rejects.toThrow('Network error');
  });
});
