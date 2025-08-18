import { Spinner } from '@terra-ui-packages/components';
import React, { useEffect, useState } from 'react';
import FooterWrapper from 'src/components/FooterWrapper';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { PipelineList } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { pipelinesTopBar } from 'src/pages/scientificServices/pipelines/common/scientific-services-common';
import { ImputationPrivatePreviewGate } from 'src/pages/scientificServices/pipelines/components/ImputationPrivatePreviewGate';

export const About = () => {
  const [pipelines, setPipelines] = useState<PipelineList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPipelines = async () => {
      try {
        const pipelineData = await Teaspoons().getPipelines();
        setPipelines(pipelineData);
        setLoading(false);
      } catch (e) {
        setError('Failed to load pipeline information');
        setLoading(false);
      }
    };

    fetchPipelines();
  }, []);

  return (
    <FooterWrapper alwaysShow>
      {pipelinesTopBar('about')}
      <ImputationPrivatePreviewGate>
        <div style={{ marginLeft: '2rem', marginTop: '1rem' }}>
          <h1>Scientific Services from the Broad Data Sciences Platform</h1>
          <h2 style={{ marginTop: '2rem' }}>Pipelines</h2>

          {loading && <Spinner />}

          {error && <div style={{ color: 'red' }}>{error}</div>}

          {pipelines &&
            pipelines.results.map((pipeline) => (
              <div key={pipeline.pipelineName}>
                <h3>{pipeline.displayName}</h3>
                <div style={{ width: '50%' }}>
                  {pipeline.description ? pipeline.description : <em>No description available</em>}
                </div>
              </div>
            ))}

          <h2 style={{ marginTop: '2rem' }}>User Documentation</h2>
          <div style={{ marginTop: '1rem' }}>
            <a
              href='/#pipelines/imputation'
              style={{ color: '#46A3E9', textDecoration: 'underline', fontWeight: 'bold' }}
            >
              Get Started
            </a>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <a
              href='/#pipelines/imputation'
              style={{ color: '#46A3E9', textDecoration: 'underline', fontWeight: 'bold' }}
            >
              About this Service
            </a>
          </div>
        </div>
      </ImputationPrivatePreviewGate>
    </FooterWrapper>
  );
};
