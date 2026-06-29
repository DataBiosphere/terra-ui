import React from 'react';
import * as Nav from 'src/libs/nav';
import { PipelineQuotaDisplay } from 'src/pages/scientificServices/pipelines/account/sections/PipelineQuotaDisplay';
import { PurchaseQuotaDisplay } from 'src/pages/scientificServices/pipelines/account/sections/PurchaseQuotaDisplay';
import { PipelinesLayout } from 'src/pages/scientificServices/pipelines/common/PipelinesLayout';
import { PipelineWidgetContainer } from 'src/pages/scientificServices/pipelines/tabs/run/widgets/PipelineWidgetContainer';

export const QuotasView = () => {
  const { query } = Nav.useRoute();
  const selectedPipelineName = query.pipeline as string | undefined;

  return (
    <PipelinesLayout activeTab='quotas'>
      <div style={{ margin: '1rem 2rem 2rem' }}>
        {selectedPipelineName ? (
          <PurchaseQuotaDisplay pipelineName={selectedPipelineName} />
        ) : (
          <PipelineWidgetContainer title='Pipeline Quotas' width='100%'>
            <PipelineQuotaDisplay />
          </PipelineWidgetContainer>
        )}
      </div>
    </PipelinesLayout>
  );
};
