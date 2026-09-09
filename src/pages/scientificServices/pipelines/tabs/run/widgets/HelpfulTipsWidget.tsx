import React, { ReactNode } from 'react';
import { Pipeline } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { DocsKey, ZendeskLink } from 'src/pages/scientificServices/pipelines/common/zendeskUtils';

import { PipelineWidgetContainer } from './PipelineWidgetContainer';

export const PIPELINE_TIPS: Record<string, { id: string; content: ReactNode }[]> = {
  // Add tips for new pipelines here, and they'll automatically be displayed.
  // If a pipeline doesn't have any tips, this widget won't be rendered at all.
  // This supports ReactNodes in case you want to include links or other non-string elements in the tips.
  array_imputation: [
    { id: 'quota-check', content: 'Ensure your multi-sample file contains no more samples than your remaining quota' },
    {
      id: 'format-guidelines',
      content: (
        <>
          View{' '}
          <ZendeskLink docsKey={DocsKey.ARRAY_IMPUTATION_INPUT_REQ} additionalStyle={{ color: '#0b5394' }}>
            formatting guidelines
          </ZendeskLink>{' '}
          for input VCF files
        </>
      ),
    },
  ],
  low_pass_imputation: [
    {
      id: 'quota-check',
      content: 'Ensure your manifest file contains no more cram file paths than your remaining quota',
    },
    {
      id: 'format-guidelines',
      content: (
        <>
          View{' '}
          <ZendeskLink docsKey={DocsKey.LOW_PASS_IMPUTATION_INPUT_REQ} additionalStyle={{ color: '#0b5394' }}>
            guidelines
          </ZendeskLink>{' '}
          for the manifest file
        </>
      ),
    },
  ],
};

// Tips shown for every pipeline
const COMMON_TIPS: { id: string; content: ReactNode }[] = [
  {
    id: 'cloud-inputs',
    content: (
      <>
        Learn how{' '}
        <ZendeskLink docsKey={DocsKey.CLOUD_INPUTS} additionalStyle={{ color: '#0b5394' }}>
          provide inputs from Google Cloud
        </ZendeskLink>
      </>
    ),
  },
  {
    id: 'cloud-outputs',
    content: (
      <>
        Learn how{' '}
        <ZendeskLink docsKey={DocsKey.CLOUD_OUTPUTS} additionalStyle={{ color: '#0b5394' }}>
          outputs can be delivered to the Google Cloud
        </ZendeskLink>
      </>
    ),
  },
];

export const HelpfulTipsWidget = ({ selectedPipeline }: { selectedPipeline?: Pipeline }) => {
  if (!selectedPipeline) return null;

  const pipelineTips = PIPELINE_TIPS[selectedPipeline.pipelineName] ?? [];

  return (
    <PipelineWidgetContainer title='Getting Started + Helpful Hints' padding='1rem' backgroundColor='#eaf3fb'>
      <ul style={{ paddingInlineStart: '1.5rem' }}>
        {pipelineTips.length > 0 && (
          <li style={{ marginTop: '1rem' }}>
            Input requirements:
            <ul style={{ paddingInlineStart: '1.5rem' }}>
              {pipelineTips.map((tip) => (
                <li key={tip.id} data-testid={`tip-${tip.id}`} style={{ marginTop: '0.5rem' }}>
                  {tip.content}
                </li>
              ))}
            </ul>
          </li>
        )}
        {COMMON_TIPS.map((tip) => (
          <li key={tip.id} data-testid={`tip-${tip.id}`} style={{ marginTop: '1rem' }}>
            {tip.content}
          </li>
        ))}
      </ul>
    </PipelineWidgetContainer>
  );
};
