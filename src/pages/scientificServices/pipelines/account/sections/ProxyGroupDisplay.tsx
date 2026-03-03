import { Spinner } from '@terra-ui-packages/components';
import React from 'react';
import { ClipboardButton } from 'src/components/ClipboardButton';
import colors from 'src/libs/colors';
import { getTerraUser } from 'src/libs/state';
import { DocsKey, ZendeskLink } from 'src/pages/scientificServices/pipelines/common/zendeskUtils';
import { useProxyGroup } from 'src/profile/personal-info/useProxyGroup';

export const ProxyGroupDisplay: React.FC = () => {
  const terraUser = getTerraUser();
  const userEmail = terraUser.email;
  const { proxyGroup } = useProxyGroup(userEmail);

  return (
    <div>
      {proxyGroup.status === 'Loading' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Spinner size={16} />
          <span style={{ color: '#666' }}>Loading proxy group...</span>
        </div>
      )}
      {proxyGroup.status === 'Ready' && proxyGroup.state && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
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
            {proxyGroup.state}
          </code>
          <ClipboardButton text={proxyGroup.state} />
        </div>
      )}
      {proxyGroup.status === 'Error' && (
        <div style={{ color: colors.danger(), display: 'flex', alignItems: 'center' }}>
          Error loading proxy group information. Please refresh the page.
        </div>
      )}
      <div style={{ marginTop: '1rem', fontSize: '14px', color: colors.dark(0.7) }}>
        Your personal Terra access group to enable Broad Scientific Services to use your data. For more information, see
        the{' '}
        <ZendeskLink
          docsKey={DocsKey.CLOUD_INPUTS}
          additionalStyle={{
            fontWeight: 'bold',
          }}
        >
          cloud data user guide
        </ZendeskLink>
        .
      </div>
    </div>
  );
};
