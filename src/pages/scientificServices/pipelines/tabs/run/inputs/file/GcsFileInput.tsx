import React, { ReactNode, useState } from 'react';
import { PipelineInput } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { CloudDataAccessInstructions } from 'src/pages/scientificServices/pipelines/common/CloudDataAccessInstructions';
import { GCS_PATH_VALIDATION_REGEX } from 'src/pages/scientificServices/pipelines/utils/upload-utils';

interface GcsFileInputProps {
  input: PipelineInput;
  validationError?: ReactNode;
  onFileSelect: (file: string | null) => void;
  onValidation: (error?: ReactNode) => void;
  onBackToSelection: () => void;
  onSharingConfirmationChange?: (isConfirmed: boolean) => void;
  sharingConfirmed?: boolean;
}

export const GcsFileInput: React.FC<GcsFileInputProps> = ({
  input,
  validationError,
  onFileSelect,
  onValidation,
  onBackToSelection,
  onSharingConfirmationChange,
  sharingConfirmed,
}) => {
  const [cloudPath, setCloudPath] = useState('');
  const { isRequired, fileSuffix } = input;

  const validateCloudPath = (path: string) => {
    if (!path) {
      onValidation(isRequired ? 'This file is required.' : undefined);
      return;
    }

    if (!GCS_PATH_VALIDATION_REGEX.test(path)) {
      onValidation(
        'Invalid Google Cloud Storage path. It should start with gs:// followed by the bucket name and file path.'
      );
      return;
    }

    if (fileSuffix && !path.endsWith(fileSuffix)) {
      onValidation(`Invalid file type. Please provide a path to a ${fileSuffix} file.`);
      return;
    }

    onValidation(undefined);
  };

  const handleCloudPathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const path = e.target.value;
    setCloudPath(path);
    validateCloudPath(path);

    if (path && GCS_PATH_VALIDATION_REGEX.test(path) && (!fileSuffix || path.endsWith(fileSuffix))) {
      onFileSelect(path);
    } else {
      onFileSelect(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ fontWeight: 600 }}>Cloud Storage Path</div>
        <button
          type='button'
          onClick={onBackToSelection}
          style={{
            background: 'none',
            border: 'none',
            color: '#46A3E9',
            cursor: 'pointer',
            fontSize: '14px',
            textDecoration: 'underline',
          }}
        >
          Change source
        </button>
      </div>
      <input
        type='text'
        value={cloudPath}
        onChange={handleCloudPathChange}
        placeholder={`gs://bucket/path/to/file${fileSuffix || ''}`}
        style={{
          width: '100%',
          padding: '0.75rem',
          border: `1px solid ${validationError ? colors.danger() : '#8f95a0'}`,
          borderRadius: '4px',
          fontSize: '14px',
          boxSizing: 'border-box',
        }}
      />
      <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
        <div style={{ flex: 1 }}>
          <label
            htmlFor='sharing-confirmation'
            style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}
          >
            <input
              type='checkbox'
              id='sharing-confirmation'
              checked={sharingConfirmed || false}
              onChange={(e) => onSharingConfirmationChange?.(e.target.checked)}
              style={{ marginTop: '0.25rem', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '14px', flex: 1, marginBottom: '0.25rem' }}>
              I have shared this file with Broad Scientific Services.{' '}
              <span style={{ color: colors.danger(), fontWeight: 'bold' }}>*</span>
            </span>
          </label>
          <CloudDataAccessInstructions cloudPath={cloudPath} cloudAccessType='inputs' />
        </div>
      </div>
    </div>
  );
};
