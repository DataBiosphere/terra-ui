import { ButtonPrimary, Icon } from '@terra-ui-packages/components';
import React, { useRef } from 'react';
import Dropzone from 'src/components/Dropzone';
import { PipelineInput } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { formatBytes } from 'src/libs/utils';
import { INPUT_DESCRIPTIONS } from 'src/pages/scientificServices/pipelines/utils/input-utils';
import { resumeUpload } from 'src/pages/scientificServices/pipelines/utils/upload-utils';
import { InputUploadState } from 'src/pages/scientificServices/pipelines/views/RunJob';

interface PipelineInputSelectorProps {
  input: PipelineInput;
  selectedFile: File | null;
  uploadState?: InputUploadState;
  onFileSelect: (file: File | null) => void;
  setUploadState?: React.Dispatch<React.SetStateAction<Record<string, InputUploadState>>>;
}

export const PipelineFileInput: React.FC<PipelineInputSelectorProps> = ({
  input,
  selectedFile,
  uploadState,
  onFileSelect,
  setUploadState,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFileValid = selectedFile && selectedFile.name.endsWith(input.fileSuffix || '');
  const { label } = INPUT_DESCRIPTIONS[input.name];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleClearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0 && !selectedFile) {
      onFileSelect(acceptedFiles[0]);
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
      } catch (error) {
        console.error('Failed to resume upload:', error);
      }
    }
  };

  return (
    <div>
      <h3 style={{ marginBottom: '0.5rem' }}>
        {label || input.name} {input.isRequired ? <span style={{ color: '#DB3214' }}>*</span> : null}
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
                  accept={input.fileSuffix}
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
                        {isFileValid ? (
                          <Icon icon='success-standard' size={36} style={{ color: '#74AE43', marginLeft: '1rem' }} />
                        ) : (
                          <Icon icon='warning-standard' size={36} style={{ color: '#DB3214', marginLeft: '1rem' }} />
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
                        disabled={uploadState?.progress === 100}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: uploadState?.progress === 100 ? 'not-allowed' : 'pointer',
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
                          color={uploadState?.progress === 100 ? colors.disabled() : '#4D72AA'}
                        />
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontWeight: 600, paddingTop: '1.25rem', textAlign: 'center' }}>
                      {dragging ? `Drop ${input.fileSuffix} file here` : `Drop ${input.fileSuffix} file or`}{' '}
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
                    <span style={{ fontWeight: 'bold' }}>In progress</span>, this may take a few minutes depending on
                    your input file size.{' '}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#DB3214' }}>
                      <Icon icon='warning-standard' size={24} style={{ color: '#DB3214', verticalAlign: 'middle' }} />{' '}
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
                <div key={input.name} style={{ marginTop: '1rem' }}>
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
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icon icon='success-standard' size={24} style={{ color: '#74AE43' }} />{' '}
                <span style={{ fontWeight: 'bold' }}>Upload successful.</span>
              </div>
            )}
          </>
        )}
        {!isFileValid && selectedFile && (
          <div style={{ color: '#DB3214', paddingTop: '0.5rem' }}>
            Invalid file type. Please upload a <strong>{input.fileSuffix}</strong> file.
          </div>
        )}
        {/* {uploadState?.errorMessage && ( */}
        {/*   <ButtonPrimary */}
        {/*     type='button' */}
        {/*     onClick={handleResumeUpload} */}
        {/*     style={{ */}
        {/*       marginTop: '1rem', */}
        {/*     }} */}
        {/*   > */}
        {/*     <div */}
        {/*       style={{ */}
        {/*         display: 'flex', */}
        {/*         alignItems: 'center', */}
        {/*         gap: '0.5rem', */}
        {/*       }} */}
        {/*     > */}
        {/*       <Icon icon='sync' /> */}
        {/*       Retry Upload */}
        {/*     </div> */}
        {/*   </ButtonPrimary> */}
        {/* )} */}
      </div>
    </div>
  );
};
