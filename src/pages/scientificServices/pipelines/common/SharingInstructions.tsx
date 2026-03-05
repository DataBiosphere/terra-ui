import { Icon, Spinner } from '@terra-ui-packages/components';
import React from 'react';
import { ClipboardButton } from 'src/components/ClipboardButton';
import { getConfig } from 'src/libs/config';
import { DocsKey, ZendeskLink } from 'src/pages/scientificServices/pipelines/common/zendeskUtils';
import { BucketConsoleLink } from 'src/pages/scientificServices/pipelines/tabs/run/inputs/file/BucketConsoleLink';

export const getTeaspoonsServiceAccountEmail = (): string => {
  if (getConfig().isProd) {
    return 'broad-scientific-services@firecloud.org';
  }
  return 'broad-scientific-services@dev.test.firecloud.org';
};

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
            whiteSpace: 'nowrap',
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
      Failed to load proxy group information. Please refresh the page.
    </div>
  );
};

export interface SharingInstructionsProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
  proxyGroupEmail: string | null;
  isLoadingProxyGroup: boolean;
  /** Optional GCS path used to render a direct link to the bucket in the Cloud Console. */
  cloudPath?: string;
  /** The body text explaining why sharing is required. Defaults to input-file instructions. */
  instructions?: string;
  /** The Zendesk docs key to link to. Defaults to DocsKey.CLOUD_INPUTS. */
  docsKey?: DocsKey;
}

export const SharingInstructions: React.FC<SharingInstructionsProps> = ({
  isExpanded,
  onToggleExpand,
  proxyGroupEmail,
  isLoadingProxyGroup,
  cloudPath,
  instructions = 'To ensure that your input file can be properly accessed by Broad Scientific Services, please share your input file with the following accounts:',
  docsKey = DocsKey.CLOUD_INPUTS,
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
          {`${isExpanded ? 'Hide' : 'View'} sharing instructions`}
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
          <div style={{ fontSize: '14px', color: '#333', marginBottom: '1rem' }}>{instructions}</div>
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
                whiteSpace: 'nowrap',
              }}
            >
              {serviceAccountEmail}
            </code>
            <ClipboardButton text={serviceAccountEmail} />
          </div>
          <div style={{ fontSize: '14px', marginBottom: '0.5rem', marginTop: '1rem', fontWeight: 600 }}>
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
              <ZendeskLink docsKey={docsKey}>Learn more</ZendeskLink> about file sharing requirements.
            </div>
            <ClipboardButton
              text={`${serviceAccountEmail}, ${proxyGroupEmail || ''}`}
              style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
            >
              Copy all
            </ClipboardButton>
          </div>
          <BucketConsoleLink cloudPath={cloudPath} />
        </div>
      )}
    </>
  );
};
