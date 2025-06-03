import { Icon } from '@terra-ui-packages/components';
import React, { useEffect, useState } from 'react';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { Pipeline, PipelineWithDetails, UserPipelineQuotaDetails } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { useCancellation } from 'src/libs/react-utils';
import { cond, DEFAULT } from 'src/libs/utils';

export const QuotaRemainingWidget = ({ selectedPipeline }: { selectedPipeline?: Pipeline }) => {
  const signal = useCancellation();
  const [quota, setQuota] = useState<UserPipelineQuotaDetails>();
  const [pipelineDetails, setPipelineDetails] = useState<PipelineWithDetails>();

  useEffect(() => {
    async function fetchUserQuota() {
      if (!selectedPipeline) return;
      const response = await Teaspoons(signal).getQuotaForPipeline(selectedPipeline.pipelineName);
      setQuota(response);
    }

    async function fetchPipelineDetails() {
      if (!selectedPipeline) return;
      const response = await Teaspoons(signal).getPipelineDetails(
        selectedPipeline.pipelineName,
        selectedPipeline.pipelineVersion
      );
      setPipelineDetails(response);
    }

    fetchPipelineDetails();
    fetchUserQuota();
  }, [selectedPipeline, signal]);

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
                {quota!.pipelineName}:{' '}
                <span style={{ fontWeight: 'bold' }}>
                  {quota.quotaLimit - quota.quotaConsumed} {quota.quotaUnits}
                </span>
                {pipelineDetails && (
                  <div style={{ marginTop: '1rem' }}>
                    <span style={{ fontWeight: 'bold' }}>
                      {`Every submitted job will consume at least ${pipelineDetails.pipelineQuota.minQuotaConsumed} ${quota.quotaUnits} from your quota.`}
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
          href='mailto:dsp-scientific-services@broadinstitute.org?subject=Imputation%20Quota%20Increase%20Request'
          style={{ color: '#46A3E9', textDecoration: 'underline', fontWeight: 'bold' }}
        >
          Apply
        </a>
        &nbsp;for more quota.
      </div>
      <div style={{ marginTop: '1rem' }}>
        <a
          href='mailto:dsp-scientific-services@broadinstitute.org?subject=Imputation%20Quota%20Dispute'
          style={{ color: '#46A3E9', textDecoration: 'underline', fontWeight: 'bold' }}
        >
          Get help
        </a>
        &nbsp;with quota.
      </div>
    </div>
  );
};
