import { Icon } from '@terra-ui-packages/components';
import React, { Dispatch, ReactNode, SetStateAction, useState } from 'react';
import { CloudProviderIcon } from 'src/components/CloudProviderIcon';
import { PipelineInput } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';

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
  onSharingConfirmationChange?: (inputName: string, isConfirmed: boolean) => void;
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
  onSharingConfirmationChange,
}) => {
  const { name, displayName, isRequired } = input;
  const [sourceType, setSourceType] = useState<'local' | 'cloud' | null>(null);
  const [sharingConfirmed, setSharingConfirmed] = useState(false);

  const handleSharingConfirmationChange = (isConfirmed: boolean) => {
    setSharingConfirmed(isConfirmed);
    onSharingConfirmationChange?.(name, isConfirmed);
  };

  const handleSourceSelect = (source: 'local' | 'cloud') => {
    setSourceType(source);
    onFileSelect(null);
    onValidation(undefined);
  };

  const handleBackToSelection = () => {
    setSourceType(null);
    onFileSelect(null);
    onValidation(undefined);
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
            input={input}
            validationError={validationError}
            onFileSelect={onFileSelect}
            onValidation={onValidation}
            onBackToSelection={handleBackToSelection}
            onSharingConfirmationChange={handleSharingConfirmationChange}
            sharingConfirmed={sharingConfirmed}
          />
        )}
        {sourceType === 'local' && (
          <LocalFileInput
            input={input}
            selectedFile={typeof selectedFile === 'string' ? null : selectedFile}
            uploadState={uploadState}
            validationError={validationError}
            onFileSelect={onFileSelect}
            onValidation={onValidation}
            onUploadComplete={onUploadComplete}
            setUploadState={setUploadState}
            onBackToSelection={handleBackToSelection}
          />
        )}
        {validationError && <div style={{ color: colors.danger(), paddingTop: '0.5rem' }}>{validationError}</div>}
      </div>
    </div>
  );
};
