import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { PipelineInput } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { renderWithAppContexts } from 'src/testing/test-utils';

import { PipelineFileInput, PipelineInputFileUploadState } from './PipelineFileInput';

jest.mock('src/pages/scientificServices/pipelines/utils/pipeline-input-utils', () => ({
  INPUT_DESCRIPTIONS: {
    multiSampleVcf: {
      label: 'Select a multi-sample VCF file',
      validationRegex: '^[a-zA-Z0-9_.-]+$',
    },
  },
}));

const mockInput: PipelineInput = {
  name: 'multiSampleVcf',
  type: 'FILE',
  isRequired: true,
  fileSuffix: '.vcf.gz',
};

const optionalInput: PipelineInput = {
  name: 'favoriteDog',
  type: 'FILE',
  isRequired: false,
  fileSuffix: '.vcf.gz',
};

describe('PipelineFileInput', () => {
  const defaultProps = {
    input: mockInput,
    value: '',
    onChange: jest.fn(),
    onValidation: jest.fn(),
    selectedFile: null,
    onFileSelect: jest.fn(),
    validationError: undefined,
  };

  it('renders label and required indicator', () => {
    render(
      <PipelineFileInput
        input={mockInput}
        selectedFile={null}
        onFileSelect={jest.fn()}
        validationError={undefined}
        onValidation={jest.fn()}
      />
    );
    expect(screen.getByText(/Select a multi-sample VCF file/i)).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('shows required indicator for required inputs', () => {
    render(<PipelineFileInput {...defaultProps} />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('does not show required indicator for optional inputs', () => {
    render(<PipelineFileInput {...defaultProps} input={optionalInput} />);
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('calls onFileSelect when file is selected via input', async () => {
    const onFileSelect = jest.fn();
    render(
      <PipelineFileInput
        input={mockInput}
        selectedFile={null}
        onFileSelect={onFileSelect}
        validationError={undefined}
        onValidation={jest.fn()}
      />
    );
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    const file = new File(['test'], 'test.vcf.gz', { type: 'text/plain' });
    await waitFor(() => userEvent.upload(fileInput, file));
    expect(onFileSelect).toHaveBeenCalledWith(file);
  });

  it('shows valid file icon and info for valid file', () => {
    const file = new File(['test'], 'test.vcf.gz', { type: 'text/plain' });
    render(
      <PipelineFileInput
        input={mockInput}
        selectedFile={file}
        onFileSelect={jest.fn()}
        validationError={undefined}
        onValidation={jest.fn()}
      />
    );
    expect(screen.getByText(file.name)).toBeInTheDocument();
    expect(screen.getByLabelText('Remove selected file')).toBeInTheDocument();
    expect(screen.queryByText(/Invalid file type/)).not.toBeInTheDocument();
  });

  it('shows invalid file icon and error for files with validation errors', () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    render(
      <PipelineFileInput
        input={mockInput}
        selectedFile={file}
        onFileSelect={jest.fn()}
        validationError={"Invalid file type. Expected '.vcf.gz'"}
        onValidation={jest.fn()}
      />
    );
    expect(screen.getByText(file.name)).toBeInTheDocument();
    expect(screen.getByText(/Invalid file type/)).toBeInTheDocument();
  });

  it('clears file when clear button is clicked', () => {
    const file = new File(['test'], 'test.vcf.gz', { type: 'text/plain' });
    const onFileSelect = jest.fn();
    render(
      <PipelineFileInput
        input={mockInput}
        selectedFile={file}
        onFileSelect={onFileSelect}
        validationError={undefined}
        onValidation={jest.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText('Remove selected file'));
    expect(onFileSelect).toHaveBeenCalledWith(null);
  });

  it('shows upload progress and success', () => {
    const uploadState: PipelineInputFileUploadState = { progress: 100 };

    render(
      <PipelineFileInput
        input={mockInput}
        selectedFile={new File(['test'], 'test.vcf.gz')}
        uploadState={uploadState}
        onFileSelect={jest.fn()}
        validationError={undefined}
        onValidation={jest.fn()}
      />
    );

    expect(screen.getByText(/Upload successful/)).toBeInTheDocument();
  });

  it('shows upload ETA as Calculating when no ETA is ready yet', () => {
    const uploadState: PipelineInputFileUploadState = { progress: 1, signedUrl: 'http://signed.url' };

    render(
      <PipelineFileInput
        input={mockInput}
        selectedFile={new File(['test'], 'test.vcf.gz')}
        uploadState={uploadState}
        onFileSelect={jest.fn()}
        validationError={undefined}
        onValidation={jest.fn()}
      />
    );

    expect(screen.getByText('Estimated time remaining:')).toBeInTheDocument();
    expect(screen.getByText('Calculating...')).toBeInTheDocument();
  });

  it('shows upload progress with ETA', () => {
    const uploadState: PipelineInputFileUploadState = {
      progress: 50,
      signedUrl: 'http://signed.url',
      uploadEtaSeconds: 121,
    };

    render(
      <PipelineFileInput
        input={mockInput}
        selectedFile={new File(['test'], 'test.vcf.gz')}
        uploadState={uploadState}
        onFileSelect={jest.fn()}
        validationError={undefined}
        onValidation={jest.fn()}
      />
    );

    expect(screen.getByText('Estimated time remaining:')).toBeInTheDocument();
    expect(screen.getByText('2 minutes')).toBeInTheDocument();
  });

  it('shows upload error and retry button', () => {
    const uploadState: PipelineInputFileUploadState = {
      progress: 50,
      errorMessage: 'Network error',
      signedUrl: 'http://signed.url',
    };
    const onFileSelect = jest.fn();
    const onUploadComplete = jest.fn();
    const setUploadState = jest.fn();

    renderWithAppContexts(
      <PipelineFileInput
        input={mockInput}
        selectedFile={new File(['test'], 'test.vcf.gz')}
        uploadState={uploadState}
        onFileSelect={onFileSelect}
        onUploadComplete={onUploadComplete}
        setUploadState={setUploadState}
        validationError={undefined}
        onValidation={jest.fn()}
      />
    );

    expect(screen.getByText(/There was an error uploading/)).toBeInTheDocument();
    expect(screen.getByText(/Retry/)).toBeInTheDocument();
  });
});
