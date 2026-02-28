import React from 'react';
import FooterWrapper from 'src/components/FooterWrapper';
import { getTerraUser, getTerraUserProfile } from 'src/libs/state';
import { AccountInfoDisplay } from 'src/pages/scientificServices/pipelines/account/sections/AccountInfoDisplay';
import { PipelineQuotaDisplay } from 'src/pages/scientificServices/pipelines/account/sections/PipelineQuotaDisplay';
import { ProxyGroupDisplay } from 'src/pages/scientificServices/pipelines/account/sections/ProxyGroupDisplay';
import { pipelinesTopBar } from 'src/pages/scientificServices/pipelines/common/scientific-services-common';
import { usePipelinesList } from 'src/pages/scientificServices/pipelines/hooks/usePipelinesList';
import { PipelineWidgetContainer } from 'src/pages/scientificServices/pipelines/tabs/run/widgets/PipelineWidgetContainer';
import { useProxyGroup } from 'src/profile/personal-info/useProxyGroup';

export const AccountAndQuotas = () => {
  const terraUser = getTerraUser();
  const userProfile = getTerraUserProfile();
  const userEmail = terraUser.email;

  const { proxyGroup } = useProxyGroup(userEmail);
  const { pipelines, isLoading: pipelinesLoading } = usePipelinesList();

  return (
    <FooterWrapper alwaysShow>
      {pipelinesTopBar()}
      <div style={{ margin: '2rem' }}>
        <h3>Account & Quotas</h3>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <PipelineWidgetContainer title='Account Info' width='50%' marginTop='0' marginBottom='0'>
            <AccountInfoDisplay firstName={userProfile.firstName} lastName={userProfile.lastName} email={userEmail} />
          </PipelineWidgetContainer>

          <PipelineWidgetContainer title='Proxy Group' width='50%' marginTop='0' marginBottom='0'>
            <ProxyGroupDisplay proxyGroup={proxyGroup} />
          </PipelineWidgetContainer>
        </div>

        <PipelineWidgetContainer title='Pipeline Quotas' width='100%'>
          <PipelineQuotaDisplay pipelines={pipelines} isLoading={pipelinesLoading} />
        </PipelineWidgetContainer>
      </div>
    </FooterWrapper>
  );
};
