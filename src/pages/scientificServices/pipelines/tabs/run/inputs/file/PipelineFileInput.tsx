import { Icon } from '@terra-ui-packages/components';
import React, { Dispatch, ReactNode, SetStateAction, useRef, useState } from 'react';
import { CloudProviderIcon } from 'src/components/CloudProviderIcon';
import { PipelineInput } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { notify } from 'src/libs/notifications';
import { formatBytes } from 'src/libs/utils';
import { TEASPOONS_MAX_FILE_UPLOAD_SIZE_BYTES } from 'src/pages/scientificServices/pipelines/common/teaspoons-service-constants';
import { DocsKey, ZendeskLink } from 'src/pages/scientificServices/pipelines/common/zendeskUtils';
import { resumeUpload } from 'src/pages/scientificServices/pipelines/utils/upload-utils';

import { GcsFileInput } from './GcsFileInput';
import { LocalFileInput } from './LocalFileInput';

export interface PipelineInputFileUploadState {
  signedUrl?: string; // The resumable upload session URL
  progress: number; // Progress percentage (0-100)
  uploadEtaSeconds?: number; // Estimated time remaining in seconds
  errorMessage?: string; // Optional error message
}

interface FileSourceSelectorProps {
  onSourceSelect: (source: 'local' | 'cloud') => void;
}

const FileSourceSelector: React.FC<FileSourceSelectorProps> = ({ onSourceSelect }) => {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: '1rem' }}>Select a file source</div>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
        <button
          type='button'
          onClick={() => onSourceSelect('local')}
          style={{
            padding: '1.5rem 1rem',
            border: '1px solid #46A3E9',
            borderBottomLeftRadius: '8px',
            borderTopLeftRadius: '8px',
            background: '#e7f3fb',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            flex: 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#d0e8f7';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#e7f3fb';
          }}
        >
          <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon icon='upload-cloud' size={64} style={{ color: '#094770' }} />
          </div>
          <span style={{ fontWeight: 600, color: '#333', fontSize: '15px' }}>Upload File</span>
        </button>
        <button
          type='button'
          onClick={() => onSourceSelect('cloud')}
          style={{
            padding: '1.5rem 1rem',
            border: '1px solid #46A3E9',
            borderBottomRightRadius: '8px',
            borderTopRightRadius: '8px',
            background: '#e7f3fb',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            flex: 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#d0e8f7';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#e7f3fb';
          }}
        >
          <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CloudProviderIcon cloudProvider='GCP' style={{ transform: 'scale(3)' }} />
          </div>
          <span style={{ fontWeight: 600, color: '#333', fontSize: '15px' }}>Google Cloud Storage</span>
        </button>
      </div>
    </div>
  );
};

interface PipelineInputSelectorProps {
  input: PipelineInput;
  selectedFile: File | string | null;
  uploadState?: PipelineInputFileUploadState;
  onFileSelect: (file: File | string | null) => void;
  onValidation(error?: ReactNode): void;
  validationError?: ReactNode;
  onUploadComplete?: () => void;
  setUploadState?: Dispatch<SetStateAction<Record<string, PipelineInputFileUploadState>>>;
}

export const PipelineFileInput: React.FC<PipelineInputSelectorProps> = ({
  input,
  selectedFile,
  uploadState,
  onFileSelect,
  onValidation,
  validationError,
  onUploadComplete,
  setUploadState,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { name, displayName, isRequired, fileSuffix } = input;
  const FILE_NAME_VALIDATION_REGEX = '^[a-zA-Z0-9_.-]+$';
  const [sourceType, setSourceType] = useState<'local' | 'cloud' | null>(null);
  const [cloudPath, setCloudPath] = useState('');

  const validateCloudPath = (path: string) => {
    if (!path) {
      onValidation(isRequired ? 'This file is required.' : undefined);
      return;
    }

    if (!path.startsWith('gs://')) {
      onValidation('Cloud path must start with gs://');
      return;
    }

    if (fileSuffix && !path.endsWith(fileSuffix)) {
      onValidation(`Invalid file type. Please provide a path to a ${fileSuffix} file.`);
      return;
    }

    onValidation(undefined);
  };

  const validateFile = (file: File | null) => {
    // Check if a file is selected, if required
    if (!file) {
      onValidation(input.isRequired ? 'This file is required.' : undefined);
      return;
    }

    // Validate file size
    if (file.size > TEASPOONS_MAX_FILE_UPLOAD_SIZE_BYTES) {
      onValidation(
        <>
          <span>
            File size exceeds the {formatBytes(TEASPOONS_MAX_FILE_UPLOAD_SIZE_BYTES)} limit. Please upload a smaller
            file.{' '}
          </span>
          <div style={{ marginTop: '0.5rem' }}>
            <Icon icon='info-circle' size={16} style={{ color: colors.primary(), verticalAlign: 'middle' }} />{' '}
            <ZendeskLink docsKey={DocsKey.INPUT_REQ}>Learn more about how to reduce your file size.</ZendeskLink>
          </div>
        </>
      );
      return;
    }

    // Validate file type based on suffix
    if (fileSuffix && !file.name.endsWith(fileSuffix)) {
      onValidation(`Invalid file type. Please upload a ${fileSuffix} file.`);
      return;
    }

    // Validate file name against regex
    if (!new RegExp(FILE_NAME_VALIDATION_REGEX).test(file.name)) {
      onValidation('File names may only contain alphanumeric characters, dashes, underscores, and periods.');
      return;
    }

    // All validations have passed
    onValidation(undefined);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      validateFile(file);
    }
  };

  const handleClearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onFileSelect(null);
    setCloudPath('');
    onValidation(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0 && !selectedFile) {
      onFileSelect(acceptedFiles[0]);
      validateFile(acceptedFiles[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleBrowseClick();
    }
  };

  const handleResumeUpload = async () => {
    if (selectedFile && typeof selectedFile !== 'string' && uploadState?.signedUrl && setUploadState) {
      try {
        await resumeUpload(input.name, selectedFile, uploadState.signedUrl, setUploadState);
        if (onUploadComplete) {
          onUploadComplete();
        }
      } catch (error) {
        notify('error', `Failed to resume upload for ${input.name}: ${error}`);
      }
    }
  };

  const handleSourceSelect = (source: 'local' | 'cloud') => {
    setSourceType(source);
    onFileSelect(null);
    setCloudPath('');
    onValidation(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCloudPathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const path = e.target.value;
    setCloudPath(path);
    validateCloudPath(path);

    if (path && path.startsWith('gs://') && (!fileSuffix || path.endsWith(fileSuffix))) {
      onFileSelect(path);
    } else {
      onFileSelect(null);
    }
  };

  const handleBackToSelection = () => {
    setSourceType(null);
    onFileSelect(null);
    setCloudPath('');
    onValidation(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <h3 style={{ marginBottom: '0.5rem' }}>
        Select a {displayName || name} {isRequired ? <span style={{ color: colors.danger() }}>*</span> : null}
      </h3>
      <div
        style={{
          width: 500,
          marginBottom: '1rem',
          border: '1px solid #8f95a0',
          backgroundColor: '#fff',
          padding: '1rem',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {sourceType === null && <FileSourceSelector onSourceSelect={handleSourceSelect} />}
        {sourceType === 'cloud' && (
          <GcsFileInput
            cloudPath={cloudPath}
            fileSuffix={fileSuffix}
            validationError={validationError}
            onCloudPathChange={handleCloudPathChange}
            onBackToSelection={handleBackToSelection}
          />
        )}
        {sourceType === 'local' && (
          <LocalFileInput
            selectedFile={typeof selectedFile === 'string' ? null : selectedFile}
            uploadState={uploadState}
            fileSuffix={fileSuffix}
            validationError={validationError}
            inputName={name}
            fileInputRef={fileInputRef}
            onFileChange={handleFileChange}
            onClearFile={handleClearFile}
            onDrop={handleDrop}
            onBrowseClick={handleBrowseClick}
            onKeyPress={handleKeyPress}
            onResumeUpload={handleResumeUpload}
            onBackToSelection={handleBackToSelection}
          />
        )}
        {validationError && <div style={{ color: colors.danger(), paddingTop: '0.5rem' }}>{validationError}</div>}
      </div>
    </div>
  );
};
