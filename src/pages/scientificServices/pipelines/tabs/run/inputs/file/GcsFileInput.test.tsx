import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { PipelineInput } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { renderWithAppContexts } from 'src/testing/test-utils';

import { GcsFileInput } from './GcsFileInput';

jest.mock('src/profile/personal-info/useProxyGroup', () => ({
  useProxyGroup: () => ({
    proxyGroup: {
      status: 'Ready' as const,
      state: 'PROXY_1234567890@example.com',
    },
  }),
}));

jest.mock('src/libs/state', () => ({
  ...jest.requireActual('src/libs/state'),
  getTerraUser: () => ({
    email: 'test@example.com',
  }),
}));

const mockInput: PipelineInput = {
  name: 'multiSampleVcf',
  displayName: 'multi-sample VCF file',
  type: 'FILE',
  isRequired: true,
  fileSuffix: '.vcf.gz',
};

const optionalInput: PipelineInput = {
  name: 'optionalFile',
  type: 'FILE',
  isRequired: false,
  fileSuffix: '.vcf.gz',
};

describe('GcsFileInput', () => {
  const defaultProps = {
    input: mockInput,
    onFileSelect: jest.fn(),
    onValidation: jest.fn(),
    onBackToSelection: jest.fn(),
    validationError: undefined,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the cloud storage path input', () => {
    render(<GcsFileInput {...defaultProps} />);
    expect(screen.getByText('Cloud Storage Path')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('gs://bucket/path/to/file.vcf.gz')).toBeInTheDocument();
  });

  it('renders "Change source" button', () => {
    render(<GcsFileInput {...defaultProps} />);
    expect(screen.getByText('Change source')).toBeInTheDocument();
  });

  it('calls onBackToSelection when "Change source" is clicked', async () => {
    const onBackToSelection = jest.fn();
    render(<GcsFileInput {...defaultProps} onBackToSelection={onBackToSelection} />);

    const changeSourceButton = screen.getByText('Change source');
    await userEvent.click(changeSourceButton);

    expect(onBackToSelection).toHaveBeenCalledTimes(1);
  });

  describe('validation', () => {
    it('validates empty path for required input', async () => {
      const onValidation = jest.fn();
      render(<GcsFileInput {...defaultProps} onValidation={onValidation} />);

      const input = screen.getByPlaceholderText('gs://bucket/path/to/file.vcf.gz');
      await userEvent.type(input, 'test');
      await userEvent.clear(input);

      expect(onValidation).toHaveBeenCalledWith('This file is required.');
    });

    it('does not show validation error for empty optional input', async () => {
      const onValidation = jest.fn();
      render(<GcsFileInput {...defaultProps} input={optionalInput} onValidation={onValidation} />);

      const input = screen.getByPlaceholderText('gs://bucket/path/to/file.vcf.gz');
      await userEvent.type(input, 'test');
      await userEvent.clear(input);

      expect(onValidation).toHaveBeenCalledWith(undefined);
    });

    it('validates that path starts with gs://', async () => {
      const onValidation = jest.fn();
      render(<GcsFileInput {...defaultProps} onValidation={onValidation} />);

      const input = screen.getByPlaceholderText('gs://bucket/path/to/file.vcf.gz');
      await userEvent.type(input, 's3://bucket/file.vcf.gz');

      expect(onValidation).toHaveBeenCalledWith(
        'Invalid Google Cloud Storage path. It should start with gs:// followed by the bucket name and file path.'
      );
    });

    it('validates that gs path has a bucket after gs://', async () => {
      const onValidation = jest.fn();
      render(<GcsFileInput {...defaultProps} onValidation={onValidation} />);

      const input = screen.getByPlaceholderText('gs://bucket/path/to/file.vcf.gz');
      await userEvent.type(input, 'gs://');

      expect(onValidation).toHaveBeenCalledWith(
        'Invalid Google Cloud Storage path. It should start with gs:// followed by the bucket name and file path.'
      );
    });

    it('validates that gs path has a blob path after gs:// prefix and bucket name', async () => {
      const onValidation = jest.fn();
      render(<GcsFileInput {...defaultProps} onValidation={onValidation} />);

      const input = screen.getByPlaceholderText('gs://bucket/path/to/file.vcf.gz');
      await userEvent.type(input, 'gs://bucketName');

      expect(onValidation).toHaveBeenCalledWith(
        'Invalid Google Cloud Storage path. It should start with gs:// followed by the bucket name and file path.'
      );
    });

    it('validates file suffix when provided', async () => {
      const onValidation = jest.fn();
      render(<GcsFileInput {...defaultProps} onValidation={onValidation} />);

      const input = screen.getByPlaceholderText('gs://bucket/path/to/file.vcf.gz');
      await userEvent.type(input, 'gs://bucket/file.txt');

      expect(onValidation).toHaveBeenCalledWith('Invalid file type. Please provide a path to a .vcf.gz file.');
    });

    it('accepts valid GCS path with correct suffix', async () => {
      const onValidation = jest.fn();
      const onFileSelect = jest.fn();
      render(<GcsFileInput {...defaultProps} onValidation={onValidation} onFileSelect={onFileSelect} />);

      const input = screen.getByPlaceholderText('gs://bucket/path/to/file.vcf.gz');
      const validPath = 'gs://my-bucket/data/sample.vcf.gz';
      await userEvent.type(input, validPath);

      expect(onValidation).toHaveBeenCalledWith(undefined);
      expect(onFileSelect).toHaveBeenCalledWith(validPath);
    });

    it('accepts valid GCS path without suffix requirement', async () => {
      const inputWithoutSuffix: PipelineInput = {
        ...mockInput,
        fileSuffix: undefined,
      };
      const onValidation = jest.fn();
      const onFileSelect = jest.fn();
      render(
        <GcsFileInput
          {...defaultProps}
          input={inputWithoutSuffix}
          onValidation={onValidation}
          onFileSelect={onFileSelect}
        />
      );

      const input = screen.getByPlaceholderText('gs://bucket/path/to/file');
      const validPath = 'gs://my-bucket/data/sample.txt';
      await userEvent.type(input, validPath);

      expect(onValidation).toHaveBeenCalledWith(undefined);
      expect(onFileSelect).toHaveBeenCalledWith(validPath);
    });
  });

  describe('file selection', () => {
    it('calls onFileSelect with null when path is invalid', async () => {
      const onFileSelect = jest.fn();
      render(<GcsFileInput {...defaultProps} onFileSelect={onFileSelect} />);

      const input = screen.getByPlaceholderText('gs://bucket/path/to/file.vcf.gz');
      await userEvent.type(input, 'invalid-path');

      expect(onFileSelect).toHaveBeenCalledWith(null);
    });

    it('calls onFileSelect with null when path has wrong suffix', async () => {
      const onFileSelect = jest.fn();
      render(<GcsFileInput {...defaultProps} onFileSelect={onFileSelect} />);

      const input = screen.getByPlaceholderText('gs://bucket/path/to/file.vcf.gz');
      await userEvent.type(input, 'gs://bucket/file.txt');

      expect(onFileSelect).toHaveBeenCalledWith(null);
    });

    it('calls onFileSelect with path when valid', async () => {
      const onFileSelect = jest.fn();
      render(<GcsFileInput {...defaultProps} onFileSelect={onFileSelect} />);

      const input = screen.getByPlaceholderText('gs://bucket/path/to/file.vcf.gz');
      const validPath = 'gs://my-bucket/data/sample.vcf.gz';
      await userEvent.type(input, validPath);

      expect(onFileSelect).toHaveBeenCalledWith(validPath);
    });

    it('updates input value as user types', async () => {
      render(<GcsFileInput {...defaultProps} />);

      const input = screen.getByPlaceholderText('gs://bucket/path/to/file.vcf.gz') as HTMLInputElement;
      const testPath = 'gs://test-bucket/file.vcf.gz';
      await userEvent.type(input, testPath);

      expect(input.value).toBe(testPath);
    });
  });

  describe('sharing instructions', () => {
    it('renders the sharing instructions button', () => {
      render(<GcsFileInput {...defaultProps} />);
      expect(screen.getByText('View sharing instructions')).toBeInTheDocument();
    });

    it('expands sharing instructions when button is clicked', async () => {
      renderWithAppContexts(<GcsFileInput {...defaultProps} />);
      const button = screen.getByText('View sharing instructions');

      await userEvent.click(button);

      expect(
        screen.getByText(
          'To ensure that your input file can be properly accessed by Broad Scientific Services, please share your input file with the following accounts:'
        )
      ).toBeInTheDocument();
      expect(screen.getByText('Service account')).toBeInTheDocument();
      expect(screen.getByText('Your proxy group')).toBeInTheDocument();
    });

    it('displays service account email', async () => {
      renderWithAppContexts(<GcsFileInput {...defaultProps} />);
      const button = screen.getByText('View sharing instructions');

      await userEvent.click(button);

      expect(screen.getByText('broad-scientific-services@dev.test.firecloud.org')).toBeInTheDocument();
    });

    it('displays proxy group email', async () => {
      renderWithAppContexts(<GcsFileInput {...defaultProps} />);
      const button = screen.getByText('View sharing instructions');

      await userEvent.click(button);

      expect(screen.getByText('PROXY_1234567890@example.com')).toBeInTheDocument();
    });

    it('renders the "Learn more" link', async () => {
      renderWithAppContexts(<GcsFileInput {...defaultProps} />);
      const button = screen.getByText('View sharing instructions');

      await userEvent.click(button);

      expect(screen.getByText('Learn more')).toBeInTheDocument();
      expect(screen.getByText(/about file sharing requirements/)).toBeInTheDocument();
    });

    it('renders checkbox for sharing confirmation', () => {
      renderWithAppContexts(<GcsFileInput {...defaultProps} />);

      const checkbox = screen.getByRole('checkbox', {
        name: /I confirm that I have shared this file with Broad Scientific Services/,
      });
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('calls onSharingConfirmationChange when checkbox is toggled', async () => {
      const onSharingConfirmationChange = jest.fn();
      const { rerender } = renderWithAppContexts(
        <GcsFileInput
          {...defaultProps}
          onSharingConfirmationChange={onSharingConfirmationChange}
          sharingConfirmed={false}
        />
      );

      const checkbox = screen.getByRole('checkbox', {
        name: /I confirm that I have shared this file with Broad Scientific Services/,
      });

      await userEvent.click(checkbox);
      expect(onSharingConfirmationChange).toHaveBeenLastCalledWith(true);

      rerender(
        <GcsFileInput {...defaultProps} onSharingConfirmationChange={onSharingConfirmationChange} sharingConfirmed />
      );

      await userEvent.click(checkbox);
      expect(onSharingConfirmationChange).toHaveBeenLastCalledWith(false);
    });
  });
});
