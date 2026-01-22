import { ButtonPrimary, Icon } from '@terra-ui-packages/components';
import React, { Dispatch, ReactNode, SetStateAction, useRef, useState } from 'react';
import { CloudProviderIcon } from 'src/components/CloudProviderIcon';
import Dropzone from 'src/components/Dropzone';
import { PipelineInput } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { notify } from 'src/libs/notifications';
import { formatBytes } from 'src/libs/utils';
import { TEASPOONS_MAX_FILE_UPLOAD_SIZE_BYTES } from 'src/pages/scientificServices/pipelines/common/teaspoons-service-constants';
import { DocsKey, ZendeskLink } from 'src/pages/scientificServices/pipelines/common/zendeskUtils';
import {
  resumeUpload,
  uploadTimeRemainingDisplayText,
} from 'src/pages/scientificServices/pipelines/utils/upload-utils';
import { getCloudProviderFromWorkspace } from 'src/workspaces/utils';

export interface PipelineInputFileUploadState {
  signedUrl?: string; // The resumable upload session URL
  progress: number; // Progress percentage (0-100)
  uploadEtaSeconds?: number; // Estimated time remaining in seconds
  errorMessage?: string; // Optional error message
}

interface PipelineInputSelectorProps {
  input: PipelineInput;
  selectedFile: File | null;
  uploadState?: PipelineInputFileUploadState;
  onFileSelect: (file: File | null) => void;
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
    if (selectedFile && uploadState?.signedUrl && setUploadState) {
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
        {sourceType === null ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '1rem' }}>Select a file source</div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button
                type='button'
                onClick={() => handleSourceSelect('local')}
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
              >
                <Icon icon='upload-cloud' size={64} style={{ color: '#094770' }} />
                <span style={{ fontWeight: 600, color: '#333', fontSize: '15px' }}>Upload File</span>
              </button>
              <button
                type='button'
                onClick={() => handleSourceSelect('cloud')}
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
              >
                <CloudProviderIcon
                  cloudProvider='GCP'
                  style={{ transform: 'scale(3)', marginTop: '1.5rem', marginBottom: '1.25rem' }}
                />
                <span style={{ fontWeight: 600, color: '#333', fontSize: '15px' }}>Google Cloud Storage</span>
                {/* <span style={{ fontSize: '12px', color: '#666' }}>Use gs:// path</span> */}
              </button>
            </div>
          </div>
        ) : sourceType === 'cloud' ? (
          <div>
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}
            >
              <div style={{ fontWeight: 600 }}>Cloud Storage Path</div>
              <button
                type='button'
                onClick={handleBackToSelection}
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
            <div style={{ marginTop: '0.5rem', color: '#666' }}>
              <ZendeskLink docsKey={DocsKey.INPUT_REQ}>Learn more</ZendeskLink> about providing a valid Google Cloud
              Storage path.
            </div>
            {/* {cloudPath && !validationError && ( */}
            {/*   <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}> */}
            {/*     <Icon icon='success-standard' size={24} style={{ color: colors.success() }} /> */}
            {/*     <span style={{ color: colors.success(), fontWeight: 600 }}>Valid cloud path</span> */}
            {/*   </div> */}
            {/* )} */}
          </div>
        ) : (
          <>
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}
            >
              <div style={{ fontWeight: 600 }}>Upload File</div>
              <button
                type='button'
                onClick={handleBackToSelection}
                disabled={!!uploadState?.progress}
                style={{
                  background: 'none',
                  border: 'none',
                  color: uploadState?.progress ? colors.disabled() : '#46A3E9',
                  cursor: uploadState?.progress ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  textDecoration: 'underline',
                }}
              >
                Change source
              </button>
            </div>
            {!uploadState?.progress ? (
              <Dropzone
                onDrop={handleDrop}
                disabled={!!selectedFile}
                style={{
                  borderRadius: '8px',
                  border: `1px #46A3E9 ${selectedFile ? 'none' : 'dashed'}`,
                  padding: '2rem 0.5rem',
                  background: 'rgba(128, 198, 236, 0.20)',
                  textAlign: 'center',
                  cursor: selectedFile ? 'default' : 'pointer',
                  height: '120px',
                  outline: 'none',
                }}
                activeStyle={{
                  border: '1px dashed #4D72AA',
                  background: 'rgba(77, 114, 170, 0.20)',
                }}
              >
                {({ dragging }) => (
                  <>
                    <input
                      ref={fileInputRef}
                      type='file'
                      onChange={handleFileChange}
                      accept={fileSuffix}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        opacity: 0,
                        pointerEvents: 'none',
                      }}
                    />
                    <div>
                      {selectedFile ? (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'left',
                            }}
                          >
                            {validationError ? (
                              <Icon
                                icon='warning-standard'
                                size={36}
                                style={{ color: colors.danger(), marginLeft: '1rem' }}
                              />
                            ) : (
                              <Icon
                                icon='success-standard'
                                size={36}
                                style={{ color: colors.success(), marginLeft: '1rem' }}
                              />
                            )}
                            <div
                              style={{
                                color: '#333',
                                paddingLeft: '0.5rem',
                                fontWeight: 600,
                                overflowWrap: 'anywhere',
                                textAlign: 'left',
                              }}
                            >
                              {selectedFile.name}{' '}
                              <span style={{ fontStyle: 'italic', fontWeight: 'lighter' }}>
                                ({formatBytes(selectedFile?.size)})
                              </span>
                            </div>
                          </div>
                          <button
                            type='button'
                            onClick={handleClearFile}
                            disabled={!!uploadState?.progress}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: uploadState?.progress ? 'not-allowed' : 'pointer',
                              color: '#666',
                              alignItems: 'center',
                              justifyContent: 'center',
                              // UX consideration: the padding is here to make the clickable area larger
                              padding: '1rem',
                            }}
                            aria-label='Remove selected file'
                          >
                            <Icon
                              icon='times'
                              size={24}
                              color={uploadState?.progress ? colors.disabled() : '#4D72AA'}
                            />
                          </button>
                        </div>
                      ) : (
                        <div style={{ fontWeight: 600, paddingTop: '1.25rem', textAlign: 'center' }}>
                          {dragging ? `Drop ${fileSuffix} file here` : `Drop ${fileSuffix} file or`}{' '}
                          {!dragging && (
                            <button
                              type='button'
                              onClick={handleBrowseClick}
                              onKeyDown={handleKeyPress}
                              style={{
                                color: '#46A3E9',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                font: 'inherit',
                                fontWeight: 'inherit',
                              }}
                            >
                              browse
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </Dropzone>
            ) : (
              <>
                <div style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Upload status</div>
                {uploadState.progress < 100 ? (
                  <>
                    {!uploadState.errorMessage ? (
                      <div>
                        <span style={{ fontWeight: 'bold' }}>In progress</span>, this may take a few minutes depending
                        on your input file size.{' '}
                        <span style={{ fontWeight: 'bold' }}>Please do not close this browser tab.</span>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Icon
                            icon='warning-standard'
                            size={24}
                            style={{ color: colors.danger(), verticalAlign: 'middle' }}
                          />{' '}
                          <div>There was an error uploading the file.</div>
                        </div>
                        <ButtonPrimary type='button' onClick={handleResumeUpload}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                            }}
                          >
                            <Icon icon='sync' />
                            Retry
                          </div>
                        </ButtonPrimary>
                      </div>
                    )}
                    <div key={name} style={{ marginTop: '1rem' }}>
                      <div
                        style={{
                          backgroundColor: '#e4e5e6',
                          borderRadius: '4px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${uploadState.progress}%`,
                            height: '21px',
                            backgroundColor: uploadState.errorMessage ? colors.danger() : '#5CC88D',
                            transition: 'width 0.3s ease-in-out',
                          }}
                        />
                      </div>
                      <div style={{ marginTop: '0.5rem', display: 'flex' }}>
                        <div style={{ fontWeight: 'bold', marginRight: '0.25rem' }}>Estimated time remaining:</div>
                        {uploadTimeRemainingDisplayText(uploadState.uploadEtaSeconds)}
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Icon icon='success-standard' size={24} style={{ color: colors.success() }} />{' '}
                    <span style={{ fontWeight: 'bold' }}>Upload successful.</span>
                  </div>
                )}
              </>
            )}
          </>
        )}
        {validationError && <div style={{ color: colors.danger(), paddingTop: '0.5rem' }}>{validationError}</div>}
      </div>
    </div>
  );
};
