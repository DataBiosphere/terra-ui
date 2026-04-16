import { Spinner } from '@terra-ui-packages/components';
import React, { ReactNode } from 'react';
import FooterWrapper from 'src/components/FooterWrapper';
import { pipelinesTopBar } from 'src/pages/scientificServices/pipelines/common/scientific-services-common';
import { ServiceUnavailableView } from 'src/pages/scientificServices/pipelines/common/ServiceUnavailableView';
import {
  PipelinesListContext,
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

  return (
    <FooterWrapper alwaysShow>
      {pipelinesTopBar(activeTab)}
      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Spinner />
        </div>
      )}
      {!isLoading && error && <ServiceUnavailableView />}
      {!isLoading && !error && (
        <PipelinesListContext.Provider value={pipelinesResult}>
          {render ? render(pipelinesResult) : children}
        </PipelinesListContext.Provider>
      )}
    </FooterWrapper>
  );
};
