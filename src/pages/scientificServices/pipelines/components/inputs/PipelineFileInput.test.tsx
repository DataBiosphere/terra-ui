import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { PipelineInput } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { TEASPOONS_MAX_FILE_UPLOAD_SIZE_BYTES } from 'src/pages/scientificServices/pipelines/common/teaspoons-service-constants';
import { renderWithAppContexts } from 'src/testing/test-utils';

import { PipelineFileInput, PipelineInputFileUploadState } from './PipelineFileInput';

const mockInput: PipelineInput = {
  name: 'multiSampleVcf',
  displayName: 'multi-sample VCF file',
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
    const file = new File(['test'], 'test.vcf.gz');
    await waitFor(() => userEvent.upload(fileInput, file));
    expect(onFileSelect).toHaveBeenCalledWith(file);
  });

  it('shows valid file icon and info for valid file', () => {
    const file = new File(['test'], 'test.vcf.gz');
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
    const file = new File(['test'], 'test.txt');
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
    const file = new File(['test'], 'test.vcf.gz');
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

  describe('validateFile', () => {
    it('displays a validation error when the input file exceeds the maximum file size limit', async () => {
      const onValidation = jest.fn();
      const onFileSelect = jest.fn();

      render(
        <PipelineFileInput
          input={mockInput}
          selectedFile={null}
          onFileSelect={onFileSelect}
          validationError={undefined}
          onValidation={onValidation}
        />
      );

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      // Upload a file larger than the size limit
      const fileLargerThanMax = new File(['test'], 'test.vcf.gz');
      Object.defineProperty(fileLargerThanMax, 'size', {
        value: TEASPOONS_MAX_FILE_UPLOAD_SIZE_BYTES * 2,
      }); // double the max size

      await userEvent.upload(fileInput, fileLargerThanMax);

      expect(onFileSelect).toHaveBeenCalledWith(fileLargerThanMax);
      // Here we're just asserting that the onValidation callback was called with some error
      // message because it's a ReactNode and those are hard to assert against directly
      expect(onValidation).toHaveBeenCalledWith(expect.any(Object));
    });

    it('does not display a validation error when the input file is within the maximum file size limit', async () => {
      const onValidation = jest.fn();
      const onFileSelect = jest.fn();

      render(
        <PipelineFileInput
          input={mockInput}
          selectedFile={null}
          onFileSelect={onFileSelect}
          validationError={undefined}
          onValidation={onValidation}
        />
      );

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      // Upload a file smaller than the size limit
      const fileWithinMax = new File(['test'], 'test.vcf.gz');
      Object.defineProperty(fileWithinMax, 'size', {
        value: TEASPOONS_MAX_FILE_UPLOAD_SIZE_BYTES / 2,
      }); // half the max size

      await userEvent.upload(fileInput, fileWithinMax);

      expect(onFileSelect).toHaveBeenCalledWith(fileWithinMax);
      expect(onValidation).toHaveBeenCalledWith(undefined);
    });

    it('displays a validation error when the input file suffix is incorrect', async () => {
      const onValidation = jest.fn();
      const onFileSelect = jest.fn();

      render(
        <PipelineFileInput
          input={mockInput}
          selectedFile={null}
          onFileSelect={onFileSelect}
          validationError={undefined}
          onValidation={onValidation}
        />
      );

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const wrongSuffixFile = new File(['test'], 'test.txt');

      await userEvent.upload(fileInput, wrongSuffixFile);

      expect(onValidation).toHaveBeenCalledWith(`Invalid file type. Please upload a ${mockInput.fileSuffix} file.`);
    });

    it('does not display a validation error when the input file suffix is correct', async () => {
      const onValidation = jest.fn();
      const onFileSelect = jest.fn();

      render(
        <PipelineFileInput
          input={mockInput}
          selectedFile={null}
          onFileSelect={onFileSelect}
          validationError={undefined}
          onValidation={onValidation}
        />
      );

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const correctSuffixFile = new File(['test'], 'test.vcf.gz');

      await userEvent.upload(fileInput, correctSuffixFile);

      expect(onFileSelect).toHaveBeenCalledWith(correctSuffixFile);
      expect(onValidation).toHaveBeenCalledWith(undefined);
    });

    it('displays a validation error when the input file name does not pass validation', async () => {
      const onValidation = jest.fn();
      const onFileSelect = jest.fn();

      render(
        <PipelineFileInput
          input={mockInput}
          selectedFile={null}
          onFileSelect={onFileSelect}
          validationError={undefined}
          onValidation={onValidation}
        />
      );

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const invalidNameFile = new File(['test'], 'really bad file name !#$.vcf.gz');

      await userEvent.upload(fileInput, invalidNameFile);

      expect(onFileSelect).toHaveBeenCalledWith(invalidNameFile);
      expect(onValidation).toHaveBeenCalledWith(
        'File names may only contain alphanumeric characters, dashes, underscores, and periods.'
      );
    });

    it('does not display a validation error when the input file name passes validation', async () => {
      const onValidation = jest.fn();
      const onFileSelect = jest.fn();

      render(
        <PipelineFileInput
          input={mockInput}
          selectedFile={null}
          onFileSelect={onFileSelect}
          validationError={undefined}
          onValidation={onValidation}
        />
      );

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const validFile = new File(['test'], 'valid_file-name.123.vcf.gz');

      await userEvent.upload(fileInput, validFile);

      expect(onFileSelect).toHaveBeenCalledWith(validFile);
      expect(onValidation).toHaveBeenCalledWith(undefined);
    });

    it('clears existing validation error when a new valid file is selected', async () => {
      const onValidation = jest.fn();
      const onFileSelect = jest.fn();

      render(
        <PipelineFileInput
          input={mockInput}
          selectedFile={null}
          onFileSelect={onFileSelect}
          validationError={undefined}
          onValidation={onValidation}
        />
      );

      // First upload an invalid file to trigger a validation error
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const invalidFile = new File(['test'], 'test.txt');

      await userEvent.upload(fileInput, invalidFile);

      expect(onValidation).toHaveBeenCalledWith(`Invalid file type. Please upload a ${mockInput.fileSuffix} file.`);
      expect(onFileSelect).toHaveBeenCalledWith(invalidFile);

      // Now upload a valid file
      const validFile = new File(['test'], 'valid_file.vcf.gz');

      await userEvent.upload(fileInput, validFile);
      expect(onValidation).toHaveBeenCalledWith(undefined);
      expect(onFileSelect).toHaveBeenCalledWith(validFile);
    });
  });
});
