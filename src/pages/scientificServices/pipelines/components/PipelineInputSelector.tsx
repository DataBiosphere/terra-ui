import { Icon } from '@terra-ui-packages/components';
import React, { useRef } from 'react';
import Dropzone from 'src/components/Dropzone';

interface PipelineInputSelectorProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  requiredSuffix?: string;
}

export const PipelineInputSelector: React.FC<PipelineInputSelectorProps> = ({
  selectedFile,
  onFileSelect,
  requiredSuffix,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFileValid = selectedFile?.name.endsWith(requiredSuffix || '');

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

  return (
    <div
      style={{
        width: 500,
        marginBottom: '1rem',
        border: '1px solid #8f95a0',
        padding: '1rem',
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Dropzone
        onDrop={handleDrop}
        disabled={!!selectedFile}
        style={{
          borderRadius: '8px',
          border: '1px dashed #46A3E9',
          padding: '2rem',
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
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'left' }}>
                    {isFileValid ? (
                      <Icon icon='success-standard' size={24} style={{ color: '#74AE43', marginLeft: '1rem' }} />
                    ) : (
                      <Icon icon='warning-standard' size={24} style={{ color: '#DB3214', marginLeft: '1rem' }} />
                    )}
                    <span style={{ color: '#333', paddingLeft: '0.5rem', fontWeight: 600 }}>{selectedFile.name}</span>
                  </div>
                  <button
                    type='button'
                    onClick={handleClearFile}
                    style={{
                      zIndex: 1,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#666',
                      alignItems: 'center',
                      justifyContent: 'center',
                      // UX consideration: the padding is here to make the clickable area larger
                      padding: '1rem',
                    }}
                    aria-label='Remove selected file'
                  >
                    <Icon icon='times' size={24} color='#4D72AA' />
                  </button>
                </div>
              ) : (
                <div style={{ fontWeight: 600, paddingTop: '1.25rem' }}>
                  {dragging ? 'Drop file here' : 'Drop file or'}{' '}
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
    </div>
  );
};
