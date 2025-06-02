import { Icon } from '@terra-ui-packages/components';
import React, { useEffect, useState } from 'react';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { PipelineQuotaWithDetails } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { useCancellation } from 'src/libs/react-utils';

export const QuotaRemainingWidget = ({ pipelineName }: { pipelineName: string }) => {
  const signal = useCancellation();
  const [quota, setQuota] = useState<PipelineQuotaWithDetails>();

  useEffect(() => {
    async function fetchQuota() {
      const response = await Teaspoons(signal).getQuotaForPipeline(pipelineName);
      setQuota(response);
    }
    fetchQuota();
  }, [pipelineName, signal]);

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
      {quota ? (
        <div style={{ marginTop: '1rem' }}>
          {quota.pipelineName}:{' '}
          <span style={{ fontWeight: 'bold' }}>
            {quota.quotaLimit - quota.quotaConsumed} {quota.quotaUnits}
          </span>
        </div>
      ) : (
        <div style={{ marginTop: '1rem' }}>Loading quota...</div>
      )}
      <div style={{ marginTop: '1rem' }}>
        <span style={{ fontWeight: 'bold' }}>
          {`Every submitted job will consume at least 500 ${quota ? quota.quotaUnits : 'units'} from your quota.`}
        </span>
      </div>
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
