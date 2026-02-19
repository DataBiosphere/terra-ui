import React, { ReactNode } from 'react';
import colors from 'src/libs/colors';
import { DocsKey, ZendeskLink } from 'src/pages/scientificServices/pipelines/common/zendeskUtils';

interface GcsFileInputProps {
  cloudPath: string;
  fileSuffix?: string;
  validationError?: ReactNode;
  onCloudPathChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBackToSelection: () => void;
}

export const GcsFileInput: React.FC<GcsFileInputProps> = ({
  cloudPath,
  fileSuffix,
  validationError,
  onCloudPathChange,
  onBackToSelection,
}) => {
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
        onChange={onCloudPathChange}
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
        <ZendeskLink docsKey={DocsKey.INPUT_REQ}>Learn more</ZendeskLink> about providing a valid Google Cloud Storage
        path.
      </div>
    </div>
  );
};
