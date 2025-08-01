import { Icon } from '@terra-ui-packages/components';
import React, { useRef } from 'react';

interface PipelineInputSelectorProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
}

export const PipelineInputSelector: React.FC<PipelineInputSelectorProps> = ({ selectedFile, onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBrowseClick = () => {
    // Only open file picker if no file is selected
    if (!selectedFile) {
      fileInputRef.current?.click();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !selectedFile) {
      e.preventDefault();
      handleBrowseClick();
    }
  };

  const handleFileInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

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

  const handleFilePickerClick = (e: React.MouseEvent) => {
    // Prevent file picker from opening if a file is already selected
    if (selectedFile) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    handleBrowseClick();
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
      <div
        role='button'
        tabIndex={0}
        style={{
          borderRadius: '8px',
          border: '1px dashed #46A3E9',
          padding: '2rem',
          background: 'rgba(128, 198, 236, 0.20)',
          textAlign: 'center',
          cursor: selectedFile ? 'default' : 'pointer',
          height: '120px',
        }}
        onClick={handleFilePickerClick}
        onKeyDown={handleKeyPress}
      >
        <input
          ref={fileInputRef}
          type='file'
          onChange={handleFileChange}
          onClick={handleFileInputClick}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            opacity: 0,
            cursor: 'pointer',
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
                <Icon icon='success-standard' size={24} style={{ color: '#74AE43', marginLeft: '1rem' }} />
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
                  // UX: padding here to make the clickable area larger
                  padding: '1rem',
                }}
                aria-label='Remove selected file'
              >
                <Icon icon='times' size={24} color='#4D72AA' />
              </button>
            </div>
          ) : (
            <div style={{ fontWeight: 600, paddingTop: '1.25rem' }}>
              Drop file or{' '}
              <span
                style={{
                  color: '#46A3E9',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                }}
              >
                browse
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
