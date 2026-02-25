import { Icon, Spinner } from '@terra-ui-packages/components';
import React, { ReactNode, useState } from 'react';
import { ClipboardButton } from 'src/components/ClipboardButton';
import { PipelineInput } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { getConfig } from 'src/libs/config';
import { getTerraUser } from 'src/libs/state';
import { DocsKey, ZendeskLink } from 'src/pages/scientificServices/pipelines/common/zendeskUtils';
import { useProxyGroup } from 'src/profile/personal-info/useProxyGroup';

const renderProxyGroupContent = (isLoading: boolean, proxyGroupEmail: string | null) => {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        <Spinner size={16} />
        <span style={{ color: '#666' }}>Loading proxy group...</span>
      </div>
    );
  }

  if (proxyGroupEmail) {
    return (
      <>
        <code
          style={{
            flex: 1,
            padding: '0.5rem',
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {proxyGroupEmail}
        </code>
        <ClipboardButton text={proxyGroupEmail} />
      </>
    );
  }

  return (
    <div style={{ color: '#d00', display: 'flex', alignItems: 'center' }}>
      <Icon icon='warning-standard' size={16} style={{ color: '#d00', marginRight: '0.25rem' }} />
      Failed to load proxy group information
    </div>
  );
};

interface SharingInstructionsProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
  proxyGroupEmail: string | null;
  isLoadingProxyGroup: boolean;
}

const SharingInstructions: React.FC<SharingInstructionsProps> = ({
  isExpanded,
  onToggleExpand,
  proxyGroupEmail,
  isLoadingProxyGroup,
}) => {
  const serviceAccountEmail = getTeaspoonsServiceAccountEmail();

  return (
    <>
      <div style={{ marginTop: '0.5rem' }}>
        <button
          type='button'
          onClick={onToggleExpand}
          style={{
            background: 'none',
            border: 'none',
            color: '#46A3E9',
            cursor: 'pointer',
            fontSize: '14px',
            textDecoration: 'underline',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          <Icon icon={isExpanded ? 'angle-down' : 'angle-right'} size={16} style={{ flexShrink: 0 }} />
          View sharing instructions
        </button>
      </div>
      {isExpanded && (
        <div
          style={{
            marginTop: '0.5rem',
            padding: '0.75rem',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            border: '1px solid #e0e0e0',
          }}
        >
          <div style={{ fontSize: '14px', color: '#333', marginBottom: '1rem' }}>
            To ensure that your input file can be properly accessed by Broad Scientific Services, please share your
            input file with the following accounts:
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '0.5rem' }}>Service account</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <code
              style={{
                flex: 1,
                padding: '0.5rem',
                backgroundColor: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {serviceAccountEmail}
            </code>
            <ClipboardButton text={serviceAccountEmail} />
          </div>
          <div
            style={{
              fontSize: '14px',
              marginBottom: '0.5rem',
              marginTop: '1rem',
              fontWeight: 600,
            }}
          >
            Your proxy group
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            {renderProxyGroupContent(isLoadingProxyGroup, proxyGroupEmail)}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '0.5rem',
              gap: '0.5rem',
            }}
          >
            <div style={{ fontSize: '14px', color: '#666' }}>
              <ZendeskLink docsKey={DocsKey.INPUT_REQ}>Learn more</ZendeskLink> about file sharing requirements.
            </div>
            <ClipboardButton
              text={`${serviceAccountEmail}, ${proxyGroupEmail || ''}`}
              style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
            >
              Copy all
            </ClipboardButton>
          </div>
        </div>
      )}
    </>
  );
};

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
  const [showDetails, setShowDetails] = useState(false);
  const { isRequired, fileSuffix } = input;
  const GCS_PATH_VALIDATION_REGEX = /^gs:\/\/[a-z0-9._-]+\/.+/;

  const userEmail = getTerraUser().email;
  const { proxyGroup } = useProxyGroup(userEmail);

  const proxyGroupEmail = proxyGroup.status === 'Ready' ? proxyGroup.state : null;
  const isLoadingProxyGroup = proxyGroup.status === 'Loading';

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
            <span style={{ fontSize: '14px', lineHeight: '1.4', flex: 1 }}>
              I confirm that I have shared this file with Broad Scientific Services.{' '}
              <span style={{ color: colors.danger(), fontWeight: 'bold' }}>*</span>
            </span>
          </label>
          <SharingInstructions
            isExpanded={showDetails}
            onToggleExpand={() => setShowDetails(!showDetails)}
            proxyGroupEmail={proxyGroupEmail}
            isLoadingProxyGroup={isLoadingProxyGroup}
          />
        </div>
      </div>
    </div>
  );
};

const getTeaspoonsServiceAccountEmail = (): string => {
  if (getConfig().isProd) {
    return 'broad-scientific-services@firecloud.org';
  }

  return 'broad-scientific-services@dev.test.firecloud.org';
};
