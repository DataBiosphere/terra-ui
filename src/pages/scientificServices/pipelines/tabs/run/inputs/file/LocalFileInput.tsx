import { ButtonPrimary, Icon } from '@terra-ui-packages/components';
import React, { ReactNode } from 'react';
import Dropzone from 'src/components/Dropzone';
import colors from 'src/libs/colors';
import { formatBytes } from 'src/libs/utils';
import { uploadTimeRemainingDisplayText } from 'src/pages/scientificServices/pipelines/utils/upload-utils';

import { PipelineInputFileUploadState } from './PipelineFileInput';

interface LocalFileInputProps {
  selectedFile: File | null;
  uploadState?: PipelineInputFileUploadState;
  fileSuffix?: string;
  validationError?: ReactNode;
  inputName: string;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearFile: (e: React.MouseEvent) => void;
  onDrop: (acceptedFiles: File[]) => void;
  onBrowseClick: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onResumeUpload: () => void;
  onBackToSelection: () => void;
}

export const LocalFileInput: React.FC<LocalFileInputProps> = ({
  selectedFile,
  uploadState,
  fileSuffix,
  validationError,
  inputName,
  fileInputRef,
  onFileChange,
  onClearFile,
  onDrop,
  onBrowseClick,
  onKeyPress,
  onResumeUpload,
  onBackToSelection,
}) => {
  if (!uploadState?.progress) {
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div style={{ fontWeight: 600 }}>Upload File</div>
          <button
            type='button'
            onClick={onBackToSelection}
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
        <Dropzone
          onDrop={onDrop}
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
                onChange={onFileChange}
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
                      onClick={onClearFile}
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
                      <Icon icon='times' size={24} color={uploadState?.progress ? colors.disabled() : '#4D72AA'} />
                    </button>
                  </div>
                ) : (
                  <div style={{ fontWeight: 600, paddingTop: '1.25rem', textAlign: 'center' }}>
                    {dragging ? `Drop ${fileSuffix} file here` : `Drop ${fileSuffix} file or`}{' '}
                    {!dragging && (
                      <button
                        type='button'
                        onClick={onBrowseClick}
                        onKeyDown={onKeyPress}
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
      </>
    );
  }

  return (
    <>
      <div style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Upload status</div>
      {uploadState.progress < 100 ? (
        <>
          {!uploadState.errorMessage ? (
            <div>
              <span style={{ fontWeight: 'bold' }}>In progress</span>, this may take a few minutes depending on your
              input file size. <span style={{ fontWeight: 'bold' }}>Please do not close this browser tab.</span>
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
                <Icon icon='warning-standard' size={24} style={{ color: colors.danger(), verticalAlign: 'middle' }} />{' '}
                <div>There was an error uploading the file.</div>
              </div>
              <ButtonPrimary type='button' onClick={onResumeUpload}>
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
          <div key={inputName} style={{ marginTop: '1rem' }}>
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
  );
};
