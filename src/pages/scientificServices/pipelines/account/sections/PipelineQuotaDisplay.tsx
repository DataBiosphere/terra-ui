import { Spinner } from '@terra-ui-packages/components';
import React from 'react';
import { PipelineQuotaCard } from 'src/pages/scientificServices/pipelines/common/PipelineQuotaCard';
import { SCIENTIFIC_SERVICES_SUPPORT_EMAIL } from 'src/pages/scientificServices/pipelines/common/scientific-services-common';
import { usePipelinesList } from 'src/pages/scientificServices/pipelines/hooks/usePipelinesList';

export const PipelineQuotaDisplay: React.FC = () => {
  const { uniquePipelines, isLoading } = usePipelinesList();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Spinner size={16} />
        <span style={{ color: '#666' }}>Loading pipelines...</span>
      </div>
    );
  }

  if (uniquePipelines.length === 0) {
    return (
      <div style={{ color: '#666', fontSize: '14px' }}>
        No pipelines are available for your account. Please contact{' '}
        <a
          href={`mailto:${SCIENTIFIC_SERVICES_SUPPORT_EMAIL}`}
          style={{ color: '#46A3E9', textDecoration: 'underline', fontWeight: 'bold' }}
        >
          {SCIENTIFIC_SERVICES_SUPPORT_EMAIL}
        </a>{' '}
        for more information.
      </div>
    );
  }

  return (
    <div>
      {uniquePipelines.map((pipeline) => (
        <PipelineQuotaCard key={pipeline.pipelineName} pipeline={pipeline} />
      ))}
    </div>
  );
};
