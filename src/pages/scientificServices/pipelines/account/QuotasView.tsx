import React from 'react';
import { PipelineQuotaDisplay } from 'src/pages/scientificServices/pipelines/account/sections/PipelineQuotaDisplay';
import { PipelinesLayout } from 'src/pages/scientificServices/pipelines/common/PipelinesLayout';
import { PipelineWidgetContainer } from 'src/pages/scientificServices/pipelines/tabs/run/widgets/PipelineWidgetContainer';

export const QuotasView = () => {
  return (
    <PipelinesLayout activeTab='pipelines-quotas'>
      <div style={{ margin: '1rem 2rem' }}>
        <PipelineWidgetContainer title='Pipeline Quotas' width='100%'>
          <PipelineQuotaDisplay />
        </PipelineWidgetContainer>
      </div>
    </PipelinesLayout>
  );
};
