import { Spinner } from '@terra-ui-packages/components';
import React, { ReactNode } from 'react';
import FooterWrapper from 'src/components/FooterWrapper';
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
