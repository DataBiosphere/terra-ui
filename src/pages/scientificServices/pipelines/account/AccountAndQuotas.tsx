import React from 'react';
import FooterWrapper from 'src/components/FooterWrapper';
import { BasicAccountInfoDisplay } from 'src/pages/scientificServices/pipelines/account/sections/BasicAccountInfoDisplay';
import { PipelineQuotaDisplay } from 'src/pages/scientificServices/pipelines/account/sections/PipelineQuotaDisplay';
import { ProxyGroupDisplay } from 'src/pages/scientificServices/pipelines/account/sections/ProxyGroupDisplay';
import { pipelinesTopBar } from 'src/pages/scientificServices/pipelines/common/scientific-services-common';
import { PipelineWidgetContainer } from 'src/pages/scientificServices/pipelines/tabs/run/widgets/PipelineWidgetContainer';

export const AccountAndQuotas = () => {
  return (
    <FooterWrapper alwaysShow>
      {pipelinesTopBar()}
      <div style={{ margin: '1rem 2rem' }}>
        <h3>Account & Quotas</h3>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <PipelineWidgetContainer title='Account Info' width='50%' marginTop='0' marginBottom='0'>
            <BasicAccountInfoDisplay />
          </PipelineWidgetContainer>

          <PipelineWidgetContainer title='Proxy Group' width='50%' marginTop='0' marginBottom='0'>
            <ProxyGroupDisplay />
          </PipelineWidgetContainer>
        </div>

        <PipelineWidgetContainer title='Pipeline Quotas' width='100%'>
          <PipelineQuotaDisplay />
        </PipelineWidgetContainer>
      </div>
    </FooterWrapper>
  );
};
