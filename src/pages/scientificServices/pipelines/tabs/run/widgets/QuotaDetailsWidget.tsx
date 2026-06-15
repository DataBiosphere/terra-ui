import { Spinner } from '@terra-ui-packages/components';
import React from 'react';
import { Pipeline } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { cond, DEFAULT } from 'src/libs/utils';
import { SCIENTIFIC_SERVICES_SUPPORT_EMAIL } from 'src/pages/scientificServices/pipelines/common/scientific-services-common';
import { DocsKey, ZendeskLink } from 'src/pages/scientificServices/pipelines/common/zendeskUtils';
import { useUserQuota } from 'src/pages/scientificServices/pipelines/hooks/useUserQuota';

import { PipelineWidgetContainer } from './PipelineWidgetContainer';

export const QuotaDetailsWidget = ({ selectedPipeline }: { selectedPipeline?: Pipeline }) => {
  const { quota, pipelineDetails, meetsMinimumQuota, isLoading } = useUserQuota(selectedPipeline);

  return (
    <PipelineWidgetContainer title='Quota Details' marginBottom='1rem'>
      {cond(
        [
          isLoading,
          () => (
            <div
              style={{
                marginTop: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Spinner size={16} /> Loading quota details...
            </div>
          ),
        ],
        [!selectedPipeline, () => <div style={{ marginTop: '1rem' }}>Select a pipeline to see quota</div>],
        [
          !!quota,
          () => {
            if (!quota) {
              // this should never happen because of the cond predicate above, but typescript
              // has no idea what cond is doing, so we sadly need the extra type guard
              return <div style={{ marginTop: '1rem' }}>No quota information available for this pipeline.</div>;
            }

            return (
              <div style={{ marginTop: '1rem' }}>
                <div
                  style={{
                    borderLeft: `3px solid ${meetsMinimumQuota ? '#5CC88D' : colors.warning(0.7)}`,
                    paddingLeft: '1rem',
                  }}
                >
                  <div style={{ marginTop: '0.5rem', gap: '5rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: 16 }}>{quota.quotaLimit - quota.quotaConsumed}</div>
                      <div style={{ color: '#6B6C6E', marginTop: '0.125rem', fontSize: 13 }}>
                        {quota.quotaUnits} remaining
                      </div>
                    </div>
                    <div
                      style={{
                        marginTop: '0.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: 16 }}>{quota.quotaConsumed}</div>
                      <div style={{ color: '#6B6C6E', marginTop: '0.125rem', fontSize: 13 }}>
                        {quota.quotaUnits} used
                      </div>
                    </div>
                  </div>
                </div>
                {pipelineDetails && (
                  <>
                    <div style={{ marginTop: '1rem' }}>
                      <span style={{ fontWeight: 600 }}>
                        {`Every submitted job will consume at least ${pipelineDetails.pipelineQuota?.minQuotaConsumed} ${quota.quotaUnits} from your quota.`}
                      </span>
                    </div>
                    {pipelineDetails.pipelineQuota?.maxQuotaConsumed && (
                      <div style={{ marginTop: '1rem' }}>
                        <span style={{ fontWeight: 600 }}>
                          {`There is a maximum of ${pipelineDetails.pipelineQuota.maxQuotaConsumed} ${quota.quotaUnits} allowed per job.`}
                        </span>
                      </div>
                    )}
                  </>
                )}
                <div style={{ marginTop: '1rem' }}>
                  <a
                    href={`mailto:${SCIENTIFIC_SERVICES_SUPPORT_EMAIL}?subject=Request%20a%20quote%20for%20quota`}
                    style={{ color: '#46A3E9', textDecoration: 'underline', fontWeight: 'bold' }}
                  >
                    Request a quote
                  </a>
                  &nbsp;for quota.
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <ZendeskLink docsKey={DocsKey.QUOTA_DETAILS} additionalStyle={{ fontWeight: 'bold' }}>
                    Get help
                  </ZendeskLink>
                  &nbsp;with quota.
                </div>
              </div>
            );
          },
        ],
        [
          DEFAULT,
          () => (
            <div
              style={{
                marginTop: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Spinner size={16} /> Loading quota details...
            </div>
          ),
        ]
      )}
    </PipelineWidgetContainer>
  );
};
