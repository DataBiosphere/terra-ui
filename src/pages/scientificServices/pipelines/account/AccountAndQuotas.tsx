import { Spinner } from '@terra-ui-packages/components';
import React from 'react';
import { ClipboardButton } from 'src/components/ClipboardButton';
import FooterWrapper from 'src/components/FooterWrapper';
import { Pipeline } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { getTerraUser, getTerraUserProfile } from 'src/libs/state';
import { pipelinesTopBar } from 'src/pages/scientificServices/pipelines/common/scientific-services-common';
import { usePipelinesList } from 'src/pages/scientificServices/pipelines/hooks/usePipelinesList';
import { useUserQuota } from 'src/pages/scientificServices/pipelines/hooks/useUserQuota';
import { PipelineWidgetContainer } from 'src/pages/scientificServices/pipelines/tabs/run/widgets/PipelineWidgetContainer';
import { AoUStylizedString } from 'src/pages/scientificServices/pipelines/utils/AoUStylizedString';
import { useProxyGroup } from 'src/profile/personal-info/useProxyGroup';

export const AccountAndQuotas = () => {
  const terraUser = getTerraUser();
  const userProfile = getTerraUserProfile();
  const userEmail = terraUser.email;
  const { proxyGroup } = useProxyGroup(userEmail);

  const { pipelines, isLoading: pipelinesLoading } = usePipelinesList();

  return (
    <FooterWrapper alwaysShow>
      {pipelinesTopBar()}
      <div style={{ margin: '2rem' }}>
        <h3>Account & Quotas</h3>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <PipelineWidgetContainer title='Account Info' width='50%' marginTop='0' marginBottom='0'>
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>First Name:</strong> {userProfile.firstName || 'N/A'}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Last Name:</strong> {userProfile.lastName || 'N/A'}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Email:</strong> {userEmail || 'N/A'}
              </div>
            </div>
          </PipelineWidgetContainer>

          <PipelineWidgetContainer title='Proxy Group' width='50%' marginTop='0' marginBottom='0'>
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
                For more information about proxy groups, see the{' '}
                <button
                  type='button'
                  onClick={() => {
                    // TODO: Link to actual user guide
                  }}
                  style={{
                    color: colors.accent(),
                    textDecoration: 'underline',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    font: 'inherit',
                  }}
                >
                  user guide
                </button>
                .
              </div>
            </div>
          </PipelineWidgetContainer>
        </div>

        <PipelineWidgetContainer title='Pipeline Quotas' width='100%'>
          <div>
            {pipelinesLoading && <div>Loading pipelines...</div>}
            {!pipelinesLoading && pipelines.length > 0 ? (
              <div>
                {pipelines.map((pipeline) => (
                  <PipelineQuotaDisplay key={pipeline.pipelineName} pipeline={pipeline} />
                ))}
              </div>
            ) : (
              !pipelinesLoading && <div>No pipelines available</div>
            )}
          </div>
        </PipelineWidgetContainer>
      </div>
    </FooterWrapper>
  );
};

const PipelineQuotaDisplay = ({ pipeline }: { pipeline: Pipeline }) => {
  const { quota, isLoading, meetsMinimumQuota, pipelineDetails } = useUserQuota(pipeline);

  if (isLoading) {
    return <div style={{ marginBottom: '1.5rem' }}>Loading quota for {pipeline.displayName}...</div>;
  }

  if (!quota) {
    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <strong>{pipeline.displayName}</strong>
        <div>No quota information available</div>
      </div>
    );
  }

  const remaining = quota.quotaLimit - quota.quotaConsumed;
  const quotaColor = meetsMinimumQuota ? colors.success() : colors.danger();
  const quotaStatusMessage = meetsMinimumQuota
    ? 'You have sufficient quota remaining to run this pipeline.'
    : 'You do not have enough quota remaining to run this pipeline. Please request a quota increase.';

  return (
    <div
      style={{
        marginBottom: '1.5rem',
        background: `linear-gradient(to right, #f5f6f9, ${quotaColor}15)`,
        border: '1px solid #d6d9dc',
        borderRadius: '4px',
        padding: '1rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '0.5rem' }}>
            <AoUStylizedString text={pipeline.displayName} />
          </div>
          <div style={{ fontSize: '14px', color: colors.dark(0.7), marginBottom: '0.75rem' }}>{quotaStatusMessage}</div>
        </div>
        <button
          type='button'
          onClick={() => {
            // TODO: Open quota increase request modal
          }}
          style={{
            marginLeft: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: colors.accent(),
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          Request Quota Increase
        </button>
      </div>
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ fontWeight: 600 }}>Quota Consumed</div>
          <div style={{ color: '#666' }}>
            {quota.quotaConsumed} {quota.quotaUnits}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ fontWeight: 600 }}>Remaining</div>
          <div style={{ color: quotaColor, fontWeight: 600 }}>
            {remaining} {quota.quotaUnits}
          </div>
        </div>
        {pipelineDetails?.pipelineQuota?.minQuotaConsumed && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ fontWeight: 600 }}>Minimum Required</div>
            <div style={{ color: '#666' }}>
              {pipelineDetails.pipelineQuota.minQuotaConsumed} {quota.quotaUnits}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
