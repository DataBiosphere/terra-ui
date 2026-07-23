import { ButtonPrimary, Icon, Link, Spinner } from '@terra-ui-packages/components';
import React from 'react';
import { Metrics } from 'src/libs/ajax/Metrics';
import { Pipeline } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import Events from 'src/libs/events';
import * as Nav from 'src/libs/nav';
import { SCIENTIFIC_SERVICES_SUPPORT_EMAIL } from 'src/pages/scientificServices/pipelines/common/scientific-services-common';
import { useUserQuota } from 'src/pages/scientificServices/pipelines/hooks/useUserQuota';
import { AoUStylizedString } from 'src/pages/scientificServices/pipelines/utils/AoUStylizedString';

interface QuotaMetricProps {
  label: string;
  value: string;
}

const QuotaMetric: React.FC<QuotaMetricProps> = ({ label, value }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '120px' }}>
      <div style={{ fontWeight: 600 }}>{label}</div>
      <div style={{ color: '#666' }}>{value}</div>
    </div>
  );
};

interface PipelineQuotaCardProps {
  pipeline: Pipeline;
  showPurchaseButton?: boolean;
}

export const PipelineQuotaCard: React.FC<PipelineQuotaCardProps> = ({ pipeline, showPurchaseButton = true }) => {
  const { quota, isLoading, meetsMinimumQuota, pipelineDetails } = useUserQuota(pipeline);

  if (!quota && !isLoading) {
    return (
      <div
        style={{
          marginBottom: '1.5rem',
          background: 'linear-gradient(to right, #f5f6f9, #e0e0e0)',
          border: '1px solid #d6d9dc',
          borderRadius: '4px',
          padding: '1rem',
        }}
      >
        <div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}
        >
          <div style={{ fontSize: '16px', fontWeight: 600 }}>
            <AoUStylizedString text={pipeline.displayName} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div style={{ flexShrink: 0, paddingTop: '0.25rem' }}>
            <Icon icon='warning-standard' size={32} style={{ color: '#999' }} />
          </div>
          <div style={{ color: '#666', fontSize: '14px' }}>
            No quota information available for this pipeline. Please contact{' '}
            <a
              href={`mailto:${SCIENTIFIC_SERVICES_SUPPORT_EMAIL}`}
              style={{ color: '#46A3E9', textDecoration: 'underline', fontWeight: 'bold' }}
            >
              {SCIENTIFIC_SERVICES_SUPPORT_EMAIL}
            </a>{' '}
            for more information.
          </div>
        </div>
      </div>
    );
  }

  const remaining = quota ? quota.quotaLimit - quota.quotaConsumed : 0;
  let quotaColor = '#ccc';
  if (!isLoading) {
    quotaColor = meetsMinimumQuota ? colors.success() : colors.warning();
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

  const getQuotaValueText = (value: number | undefined) => {
    if (isLoading) {
      return 'Loading...';
    }
    return `${value} ${quota?.quotaUnits}`;
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
        <Link
          href={Nav.getLink('pipelines-history', {}, { pipelineName: pipeline.pipelineName })}
          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
        >
          View your jobs
          <Icon icon='pop-out' size={16} style={{ marginLeft: '0.25rem' }} />
        </Link>
      </div>
      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flexShrink: 0, paddingTop: '0.25rem' }}>
          {isLoading ? (
            <Spinner size={32} />
          ) : (
            <Icon
              icon={meetsMinimumQuota ? 'success-standard' : 'warning-standard'}
              size={32}
              style={{ color: meetsMinimumQuota ? colors.success() : colors.warning() }}
            />
          )}
        </div>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', flex: 1 }}>
          <QuotaMetric label='Quota Remaining' value={getQuotaValueText(remaining)} />
          <QuotaMetric label='Quota Consumed' value={getQuotaValueText(quota?.quotaConsumed)} />
          <QuotaMetric label='Minimum Required' value={getMinimumRequiredText()} />
        </div>
        {showPurchaseButton && (
          <div
            style={{
              borderLeft: '1px solid #d6d9dc',
              paddingLeft: '2rem',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'flex-start',
            }}
          >
            <ButtonPrimary
              onClick={() => {
                Metrics().captureEvent(Events.teaspoons.viewPurchaseQuotaOptionsClick, {
                  pipelineName: pipeline.pipelineName,
                  pipelineVersion: pipeline.pipelineVersion,
                });

                Nav.goToPath('pipelines-quotas', {}, { pipeline: pipeline.pipelineName });
              }}
            >
              Purchase Quota
            </ButtonPrimary>
          </div>
        )}
      </div>
    </div>
  );
};
