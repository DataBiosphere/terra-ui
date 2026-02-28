import { ButtonPrimary, Icon, Spinner } from '@terra-ui-packages/components';
import React from 'react';
import { Pipeline } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { usePipelinesList } from 'src/pages/scientificServices/pipelines/hooks/usePipelinesList';
import { useUserQuota } from 'src/pages/scientificServices/pipelines/hooks/useUserQuota';
import { AoUStylizedString } from 'src/pages/scientificServices/pipelines/utils/AoUStylizedString';

export const PipelineQuotaDisplay: React.FC = () => {
  const { pipelines, isLoading } = usePipelinesList();

  // There can be more than one version of a pipeline so we need to de-duplicate based on pipelineName
  const uniquePipelines = pipelines.reduce((acc: Pipeline[], pipeline) => {
    if (!acc.some((p) => p.pipelineName === pipeline.pipelineName)) {
      acc.push(pipeline);
    }
    return acc;
  }, []);

  if (isLoading) {
    return <div>Loading pipelines...</div>;
  }

  if (uniquePipelines.length === 0) {
    return <div>No pipelines available</div>;
  }

  return (
    <div>
      {uniquePipelines.map((pipeline) => (
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

  if (!quota && !isLoading) {
    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <strong>{pipeline.displayName}</strong>
        <div>No quota information available</div>
      </div>
    );
  }

  const remaining = quota ? quota.quotaLimit - quota.quotaConsumed : 0;
  let quotaColor = '#ccc';
  if (!isLoading) {
    quotaColor = meetsMinimumQuota ? colors.success() : colors.danger();
  }

  const getMinimumRequiredText = () => {
    if (isLoading) {
      return 'Loading...';
    }
    if (pipelineDetails?.pipelineQuota?.minQuotaConsumed) {
      return `${pipelineDetails.pipelineQuota.minQuotaConsumed} ${quota?.quotaUnits}`;
    }
    return 'No minimum';
  };

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
          {isLoading ? (
            <Spinner size={32} />
          ) : (
            <Icon
              icon={meetsMinimumQuota ? 'success-standard' : 'warning-standard'}
              size={32}
              style={{ color: meetsMinimumQuota ? colors.success() : colors.danger() }}
            />
          )}
        </div>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '120px' }}>
            <div style={{ fontWeight: 600 }}>Quota Consumed</div>
            <div style={{ color: '#666' }}>
              {isLoading ? 'Loading...' : `${quota?.quotaConsumed} ${quota?.quotaUnits}`}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '120px' }}>
            <div style={{ fontWeight: 600 }}>Remaining</div>
            <div style={{ color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isLoading ? 'Loading...' : `${remaining} ${quota?.quotaUnits}`}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '120px' }}>
            <div style={{ fontWeight: 600 }}>Minimum Required</div>
            <div style={{ color: '#666' }}>{getMinimumRequiredText()}</div>
          </div>
        </div>
        <div style={{ borderLeft: '1px solid #d6d9dc', paddingLeft: '2rem', flexShrink: 0 }}>
          <ButtonPrimary
            onClick={() => {
              // TODO: open whatever quota increase request flow we decide on. Stripe? ZenDesk doc?
            }}
          >
            Request Quota Increase
          </ButtonPrimary>
        </div>
      </div>
    </div>
  );
};
