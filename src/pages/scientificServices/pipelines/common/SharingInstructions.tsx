import { Icon, Spinner } from '@terra-ui-packages/components';
import React, { useState } from 'react';
import { ClipboardButton } from 'src/components/ClipboardButton';
import { getConfig } from 'src/libs/config';
import { getTerraUser } from 'src/libs/state';
import { DocsKey, ZendeskLink } from 'src/pages/scientificServices/pipelines/common/zendeskUtils';
import { BucketConsoleLink } from 'src/pages/scientificServices/pipelines/tabs/run/inputs/file/BucketConsoleLink';
import { useProxyGroup } from 'src/profile/personal-info/useProxyGroup';

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

const ACCESS_TYPE_CONFIG: Record<'inputs' | 'outputs', { instructions: string; docsKey: DocsKey }> = {
  inputs: {
    instructions:
      'To ensure that your input file can be properly accessed by Broad Scientific Services, please share your input file with the following accounts:',
    docsKey: DocsKey.CLOUD_INPUTS,
  },
  outputs: {
    instructions:
      'To ensure that Broad Scientific Services can deliver your outputs to the destination, please share the destination bucket with the following accounts:',
    docsKey: DocsKey.CLOUD_INPUTS,
  },
};

export interface SharingInstructionsProps {
  /** Optional GCS path used to render a direct link to the bucket in the Cloud Console. */
  cloudPath?: string;
  /** Whether these instructions are for input files or output delivery. Defaults to 'inputs'. */
  cloudAccessType: 'inputs' | 'outputs';
}

export const SharingInstructions: React.FC<SharingInstructionsProps> = ({ cloudPath, cloudAccessType }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const serviceAccountEmail = getTeaspoonsServiceAccountEmail();
  const { instructions, docsKey } = ACCESS_TYPE_CONFIG[cloudAccessType];

  const userEmail = getTerraUser().email;
  const { proxyGroup } = useProxyGroup(userEmail);
  const proxyGroupEmail = proxyGroup.status === 'Ready' ? proxyGroup.state : null;
  const isLoadingProxyGroup = proxyGroup.status === 'Loading';

  return (
    <>
      <div style={{ marginTop: '0.5rem' }}>
        <button
          type='button'
          onClick={() => setIsExpanded(!isExpanded)}
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
