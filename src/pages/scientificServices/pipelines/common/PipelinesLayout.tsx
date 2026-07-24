import { Spinner } from '@terra-ui-packages/components';
import React, { ReactNode, useEffect } from 'react';
import FooterWrapper from 'src/components/FooterWrapper';
import { getLocalStorage, setStatic } from 'src/libs/browser-storage';
import * as Nav from 'src/libs/nav';
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

interface InProgressPurchase {
  nonProfitActivities: boolean;
  nonProfitOrganization: boolean;
  numSamples: number;
  pipeline: string;
}

export const PipelinesLayout = ({ activeTab, children, render }: PipelinesLayoutProps) => {
  const pipelinesResult = usePipelinesList();
  const { isLoading, error } = pipelinesResult;
  const { query } = Nav.useRoute();

  useEffect(() => {
    const { nonProfitActivities, nonProfitOrganization, numSamples, pipeline, ...remainingQuery } = query as {
      nonProfitActivities?: string;
      nonProfitOrganization?: string;
      numSamples?: string;
      pipeline?: string;
      [key: string]: any;
    };

    // Only store if at least one relevant query param exists
    if (nonProfitActivities && nonProfitOrganization && numSamples && pipeline) {
      const inProgressPurchase: InProgressPurchase = {
        nonProfitActivities: nonProfitActivities === 'true',
        nonProfitOrganization: nonProfitOrganization === 'true',
        numSamples: Number.parseInt(numSamples),
        pipeline,
      };

      setStatic(getLocalStorage(), 'inProgressPurchase', inProgressPurchase);

      // Clear these params from the URL bar, keeping any other query params
      Nav.updateSearch(remainingQuery);
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
