import React from 'react';
import { PipelinesLayout } from 'src/pages/scientificServices/pipelines/common/PipelinesLayout';
import { DocsKey, ZendeskLink } from 'src/pages/scientificServices/pipelines/common/zendeskUtils';
import { AoUStylizedString } from 'src/pages/scientificServices/pipelines/utils/AoUStylizedString';

export const About = () => {
  return (
    <PipelinesLayout
      activeTab='about'
      render={({ uniquePipelines }) => (
        <div style={{ marginLeft: '2rem', marginTop: '1rem' }}>
          <h1>Data Science Services from Broad Clinical Laboratories</h1>
          <h2 style={{ marginTop: '2rem' }}>Pipelines</h2>

          {uniquePipelines?.map((pipeline) => (
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
      )}
    />
  );
};
