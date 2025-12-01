import { Spinner } from '@terra-ui-packages/components';
import React from 'react';
import FooterWrapper from 'src/components/FooterWrapper';
import { pipelinesTopBar } from 'src/pages/scientificServices/pipelines/common/scientific-services-common';
import { DocsKey, zendeskUrl } from 'src/pages/scientificServices/pipelines/common/zendeskUtils';
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
          <a
            href={zendeskUrl(DocsKey.GETTING_STARTED)}
            target='_blank'
            style={{ color: '#46A3E9', textDecoration: 'underline', fontWeight: 'bold' }}
            rel='noreferrer'
          >
            Get Started
          </a>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <a
            target='_blank'
            href={zendeskUrl(DocsKey.ABOUT_SERVICE)}
            style={{ color: '#46A3E9', textDecoration: 'underline', fontWeight: 'bold' }}
            rel='noreferrer'
          >
            About this Service
          </a>
        </div>
      </div>
    </FooterWrapper>
  );
};
