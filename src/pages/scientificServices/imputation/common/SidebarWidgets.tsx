import { Icon } from '@terra-ui-packages/components';
import { useEffect, useState } from 'react';
import React from 'react';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { PipelineQuotaWithDetails } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { useCancellation } from 'src/libs/react-utils';

const QuotaRemaining = () => {
  const signal = useCancellation();
  const [quota, setQuota] = useState<PipelineQuotaWithDetails>();

  useEffect(() => {
    async function fetchQuota() {
      const response = await Teaspoons(signal).getQuotaForPipeline('array_imputation');
      setQuota(response);
    }
    fetchQuota();
  }, [signal]);

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
          Every submitted job will consume at least 500 samples from your quota.
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

const HelpfulTips = () => (
  <div
    style={{
      backgroundColor: '#f4f6f9',
      width: 400,
      padding: '1rem',
      borderRadius: '4px',
    }}
  >
    <h3 style={{ marginTop: '0.5rem' }}>
      <Icon icon='info-circle' style={{ color: '#5CC88D' }} /> Helpful Tips
    </h3>
    <ul style={{ paddingInlineStart: '1.5rem' }}>
      <li style={{ marginTop: '1rem' }}>Ensure that your file is a valid vcf file</li>
      <li style={{ marginTop: '1rem' }}>VCFs must be generated from GRCh38/hg38</li>
      <li style={{ marginTop: '1rem' }}>Ensure your multi-sample file contains no more than your remaining quota.</li>
      <li style={{ marginTop: '1rem' }}>More guidelines for data formatting</li>
    </ul>
  </div>
);

export const SidebarWidgets = () => (
  <div>
    <QuotaRemaining />
    <HelpfulTips />
  </div>
);
