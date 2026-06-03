import React from 'react';
import { BasicAccountInfoDisplay } from 'src/pages/scientificServices/pipelines/account/sections/BasicAccountInfoDisplay';
import { ProxyGroupDisplay } from 'src/pages/scientificServices/pipelines/account/sections/ProxyGroupDisplay';
import { PipelinesLayout } from 'src/pages/scientificServices/pipelines/common/PipelinesLayout';
import { PipelineWidgetContainer } from 'src/pages/scientificServices/pipelines/tabs/run/widgets/PipelineWidgetContainer';

export const ProfileView = () => {
  return (
    <PipelinesLayout>
      <div style={{ margin: '1rem 2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexDirection: 'column' }}>
          <PipelineWidgetContainer title='Account Information' width='50%' marginTop='0' marginBottom='0'>
            <BasicAccountInfoDisplay />
          </PipelineWidgetContainer>

          <PipelineWidgetContainer title='Proxy Group' width='50%' marginTop='0' marginBottom='0'>
            <ProxyGroupDisplay />
          </PipelineWidgetContainer>
        </div>
      </div>
    </PipelinesLayout>
  );
};
