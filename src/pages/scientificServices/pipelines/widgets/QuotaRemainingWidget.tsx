import { Icon } from '@terra-ui-packages/components';
import React from 'react';
import { Pipeline } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { cond, DEFAULT } from 'src/libs/utils';
import { SCIENTIFIC_SERVICES_SUPPORT_EMAIL } from 'src/pages/scientificServices/pipelines/common/scientific-services-common';
import { useUserQuota } from 'src/pages/scientificServices/pipelines/hooks/useUserQuota';

export const QuotaRemainingWidget = ({ selectedPipeline }: { selectedPipeline?: Pipeline }) => {
  const { quota, pipelineDetails, meetsMinimumQuota } = useUserQuota(selectedPipeline);

  return (
    <div
      style={{
        marginBottom: '1rem',
        backgroundColor: '#f4f6f9',
        width: 400,
        padding: '1rem',
        borderRadius: '4px',
      }}
    >
      <h3 style={{ marginTop: '0.5rem' }}>
        <Icon icon='info-circle' style={{ color: '#5CC88D' }} /> Quota Remaining
      </h3>
      {cond(
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
                <div style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{quota.quotaUnits}</div>
                <div style={{ marginTop: '0.5rem' }}>
                  <div
                    style={{
                      backgroundColor: '#e4e5e6',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      aria-label={`quota: ${quota.quotaLimit - quota.quotaConsumed} remaining, ${
                        quota.quotaConsumed
                      } used`}
                      role='progressbar'
                      style={{
                        width: `${((quota.quotaLimit - quota.quotaConsumed) / quota.quotaLimit) * 100}%`,
                        height: '6px',
                        backgroundColor: meetsMinimumQuota ? '#5CC88D' : colors.warning(0.6),
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', gap: '5rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{ fontWeight: 'bold' }}>{quota.quotaLimit - quota.quotaConsumed}</div>
                    <div style={{ color: '#6B6C6E', marginTop: '0.125rem' }}>Remaining</div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                    }}
                  >
                    <div style={{ fontWeight: 'bold' }}>{quota.quotaConsumed}</div>
                    <div style={{ color: '#6B6C6E', marginTop: '0.125rem' }}>Used</div>
                  </div>
                </div>
                {pipelineDetails && (
                  <div style={{ marginTop: '1rem' }}>
                    <span style={{ fontWeight: 600 }}>
                      {`Every submitted job will consume at least ${pipelineDetails.pipelineQuota?.minQuotaConsumed} ${quota.quotaUnits} from your quota.`}
                    </span>
                  </div>
                )}
              </div>
            );
          },
        ],
        [DEFAULT, () => <div style={{ marginTop: '1rem' }}>Loading quota...</div>]
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
        <a
          href={`mailto:${SCIENTIFIC_SERVICES_SUPPORT_EMAIL}?subject=Imputation%20quota%20help`}
          style={{ color: '#46A3E9', textDecoration: 'underline', fontWeight: 'bold' }}
        >
          Get help
        </a>
        &nbsp;with quota.
      </div>
    </div>
  );
};
