import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { PipelineInput } from 'src/libs/ajax/teaspoons/teaspoons-models';

import { GcsFileInput } from './GcsFileInput';

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

      expect(onValidation).toHaveBeenCalledWith('Cloud path must start with gs://');
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
});
