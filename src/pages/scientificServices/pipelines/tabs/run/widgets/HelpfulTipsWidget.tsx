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
          <ZendeskLink dockKey={DocsKey.INPUT_REQ} additionalStyle={{ fontWeight: 'bold' }}>
            formatting guidelines
          </ZendeskLink>{' '}
          for input VCF files
        </>
      ),
    },
  ],
};

export const HelpfulTipsWidget = ({ selectedPipeline }: { selectedPipeline?: Pipeline }) => {
  const pipelineTips = selectedPipeline && PIPELINE_TIPS[selectedPipeline.pipelineName];
  if (!pipelineTips || pipelineTips.length === 0) return null;

  return (
    <PipelineWidgetContainer title='Helpful Tips' padding='1rem'>
      <ul style={{ paddingInlineStart: '1.5rem' }}>
        {pipelineTips.map((tip) => (
          <li key={tip.id} data-testid={`tip-${tip.id}`} style={{ marginTop: '1rem' }}>
            {tip.content}
          </li>
        ))}
      </ul>
    </PipelineWidgetContainer>
  );
};
