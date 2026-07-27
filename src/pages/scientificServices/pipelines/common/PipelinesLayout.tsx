import { Spinner } from '@terra-ui-packages/components';
import React, { ReactNode, useEffect } from 'react';
import FooterWrapper from 'src/components/FooterWrapper';
import * as Nav from 'src/libs/nav';
import {
  getInProgressPurchase,
  InProgressPurchase,
  storeInProgressPurchase,
} from 'src/pages/scientificServices/pipelines/common/purchaseQuotaUtils';
import { pipelinesTopBar } from 'src/pages/scientificServices/pipelines/common/scientific-services-common';
import { ServiceUnavailableView } from 'src/pages/scientificServices/pipelines/common/ServiceUnavailableView';
import {
  usePipelinesList,
  UsePipelinesListResult,
} from 'src/pages/scientificServices/pipelines/hooks/usePipelinesList';

interface PipelinesLayoutProps {
  activeTab?: string;
  children?: ReactNode;
  render?: (result: UsePipelinesListResult) => ReactNode;
}

export const PipelinesLayout = ({ activeTab, children, render }: PipelinesLayoutProps) => {
  const pipelinesResult = usePipelinesList();
  const { isLoading, error } = pipelinesResult;
  const { query } = Nav.useRoute();

  useEffect(() => {
    const { nonProfitActivities, nonProfitOrganization, pipeline, ...remainingQuery } = query as {
      nonProfitActivities?: string;
      nonProfitOrganization?: string;
      pipeline?: string;
      [key: string]: any;
    };

    // Only store if all relevant query params exist
    if (nonProfitActivities && nonProfitOrganization && pipeline) {
      const inProgressPurchase: InProgressPurchase = {
        nonProfitActivities: nonProfitActivities === 'true',
        nonProfitOrganization: nonProfitOrganization === 'true',
        pipeline,
      };

      storeInProgressPurchase(inProgressPurchase);

      console.log('removing');

      // Clear these params from the URL bar, keeping any other query params
      Nav.updateSearch(remainingQuery);
    }
  }, [query]);

  // If a purchase is still in progress (stored in local storage), navigate to the quota purchase
  // page for that pipeline so its values can be pre-filled.
  useEffect(() => {
    const inProgressPurchase = getInProgressPurchase();
    if (inProgressPurchase && query.pipeline !== inProgressPurchase.pipeline) {
      Nav.goToPath('pipelines-quotas', {}, { pipeline: inProgressPurchase.pipeline });
    }
  }, [query]);

  return (
    <FooterWrapper alwaysShow>
      {pipelinesTopBar(activeTab)}
      {isLoading && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '75vh',
            padding: '3rem',
            gap: '1rem',
            fontSize: 32,
          }}
        >
          <Spinner size={32} /> <span>Loading Data Science Services...</span>
        </div>
      )}
      {!isLoading && error && <ServiceUnavailableView />}
      {!isLoading && !error && (render ? render(pipelinesResult) : children)}
    </FooterWrapper>
  );
};
