import { Spinner } from '@terra-ui-packages/components';
import React from 'react';
import FooterWrapper from 'src/components/FooterWrapper';
import { pipelinesTopBar } from 'src/pages/scientificServices/pipelines/common/scientific-services-common';
import { DocsKey, ZendeskLink } from 'src/pages/scientificServices/pipelines/common/zendeskUtils';
import { usePipelinesList } from 'src/pages/scientificServices/pipelines/hooks/usePipelinesList';
import { AoUStylizedString } from 'src/pages/scientificServices/pipelines/utils/AoUStylizedString';

export const About = () => {
  const { isLoading, error, pipelines } = usePipelinesList();

  return (
    <FooterWrapper alwaysShow>
      {pipelinesTopBar('about')}
      <div style={{ marginLeft: '2rem', marginTop: '1rem' }}>
        <h1>Scientific Services from the Broad Data Sciences Platform</h1>
        <h2 style={{ marginTop: '2rem' }}>Pipelines</h2>

        {isLoading && <Spinner />}

        {error && <div style={{ color: 'red' }}>{error.message}</div>}

        {pipelines?.map((pipeline) => (
          <div key={pipeline.pipelineName}>
            <h3>
              <AoUStylizedString text={pipeline.displayName} />
            </h3>
            <div style={{ width: '50%' }}>
              {pipeline.description ? (
                <AoUStylizedString text={pipeline.description} />
              ) : (
                <em>No description available</em>
              )}
            </div>
          </div>
        ))}

        <h2 style={{ marginTop: '2rem' }}>User Documentation</h2>
        <div style={{ marginTop: '1rem' }}>
          <ZendeskLink docsKey={DocsKey.GETTING_STARTED} additionalStyle={{ fontWeight: 'bold' }}>
            Get Started
          </ZendeskLink>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <ZendeskLink docsKey={DocsKey.ABOUT_SERVICE} additionalStyle={{ fontWeight: 'bold' }}>
            About this Service
          </ZendeskLink>
        </div>
      </div>
    </FooterWrapper>
  );
};
