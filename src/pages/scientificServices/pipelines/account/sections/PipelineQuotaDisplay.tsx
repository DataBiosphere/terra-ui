import { ButtonPrimary, Icon } from '@terra-ui-packages/components';
import React from 'react';
import { Pipeline } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { useUserQuota } from 'src/pages/scientificServices/pipelines/hooks/useUserQuota';
import { AoUStylizedString } from 'src/pages/scientificServices/pipelines/utils/AoUStylizedString';

interface PipelineQuotaDisplayProps {
  pipelines: Pipeline[];
  isLoading: boolean;
}

export const PipelineQuotaDisplay: React.FC<PipelineQuotaDisplayProps> = ({ pipelines, isLoading }) => {
  if (isLoading) {
    return <div>Loading pipelines...</div>;
  }

  if (pipelines.length === 0) {
    return <div>No pipelines available</div>;
  }

  return (
    <div>
      {pipelines.map((pipeline) => (
        <PipelineQuotaCard key={pipeline.pipelineName} pipeline={pipeline} />
      ))}
    </div>
  );
};

interface PipelineQuotaCardProps {
  pipeline: Pipeline;
}

const PipelineQuotaCard: React.FC<PipelineQuotaCardProps> = ({ pipeline }) => {
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
        <div style={{ fontSize: '16px', fontWeight: 600 }}>
          <AoUStylizedString text={pipeline.displayName} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flexShrink: 0, paddingTop: '0.25rem' }}>
          <Icon
            icon={meetsMinimumQuota ? 'success-standard' : 'warning-standard'}
            size={32}
            style={{ color: meetsMinimumQuota ? colors.success() : colors.danger() }}
          />
        </div>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '120px' }}>
            <div style={{ fontWeight: 600 }}>Quota Consumed</div>
            <div style={{ color: '#666' }}>
              {quota.quotaConsumed} {quota.quotaUnits}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '120px' }}>
            <div style={{ fontWeight: 600 }}>Remaining</div>
            <div style={{ color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {remaining} {quota.quotaUnits}
            </div>
          </div>
          {pipelineDetails?.pipelineQuota?.minQuotaConsumed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '120px' }}>
              <div style={{ fontWeight: 600 }}>Minimum Required</div>
              <div style={{ color: '#666' }}>
                {pipelineDetails.pipelineQuota.minQuotaConsumed} {quota.quotaUnits}
              </div>
            </div>
          )}
        </div>
        <div style={{ borderLeft: '1px solid #d6d9dc', paddingLeft: '2rem', flexShrink: 0 }}>
          <ButtonPrimary
            onClick={() => {
              // TODO: open whatever quota increase request flow we decide on. Stripe? ZenDesk?
            }}
          >
            Request Quota Increase
          </ButtonPrimary>
        </div>
      </div>
    </div>
  );
};
