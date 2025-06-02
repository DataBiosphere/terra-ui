import { Icon } from '@terra-ui-packages/components';
import React, { ReactNode } from 'react';

export const PIPELINE_TIPS: Record<string, { id: string; content: ReactNode }[]> = {
  // Add tips for new pipelines here, and they'll automatically be displayed
  // If a pipeline doesn't have any tips, this widget won't be rendered at all
  array_imputation: [
    { id: 'vcf-valid', content: 'Ensure that your file is a valid vcf file' },
    { id: 'grch38', content: 'VCFs must be generated from GRCh38/hg38' },
    { id: 'quota-check', content: 'Ensure your multi-sample file contains no more than your remaining quota.' },
    { id: 'format-guidelines', content: 'More guidelines for data formatting' },
  ],
};

export const HelpfulTipsWidget = ({ pipelineName }: { pipelineName: keyof typeof PIPELINE_TIPS }) => {
  const pipelineTips = PIPELINE_TIPS[pipelineName];
  if (!pipelineTips || pipelineTips.length === 0) return null;

  return (
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
        {pipelineTips.map((tip) => (
          <li key={tip.id} data-testid={`tip-${tip.id}`} style={{ marginTop: '1rem' }}>
            {tip.content}
          </li>
        ))}
      </ul>
    </div>
  );
};
