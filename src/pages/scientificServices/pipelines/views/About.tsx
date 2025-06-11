import React from 'react';
import FooterWrapper from 'src/components/FooterWrapper';
import { pipelinesTopBar } from 'src/pages/scientificServices/pipelines/common/scientific-services-common';

export const About = () => {
  return (
    <FooterWrapper alwaysShow>
      {pipelinesTopBar('about')}
      <div style={{ marginLeft: '2rem', marginTop: '1rem' }}>
        <h1>Scientific Services from the Broad Data Sciences Platform</h1>
        <h2>Reference Panel</h2>
        <div style={{ width: '50%' }}>
          The imputation service leverages the <i>All of Us</i> + AnVIL reference panel of genomes from more than
          515,000 All of Us Research Program and AnVIL participants, including more than 250,000 genomes from
          non-European inferred genetic ancestries.
        </div>
        <h2 style={{ marginTop: '2rem' }}>Pipelines</h2>
        <h3>Array Imputation</h3>
        <div style={{ width: '50%' }}>
          Phase and impute genotypes using Beagle 5.4 with the <i>All of Us</i> + AnVIL reference panel of 515,579
          samples.
        </div>
        <h2 style={{ marginTop: '2rem' }}>User Documentation</h2>
        <div style={{ marginTop: '1rem' }}>
          <a href='services/pipelines' style={{ color: '#46A3E9', textDecoration: 'underline', fontWeight: 'bold' }}>
            Get Started
          </a>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <a href='services/pipelines' style={{ color: '#46A3E9', textDecoration: 'underline', fontWeight: 'bold' }}>
            About this Service
          </a>
        </div>
      </div>
    </FooterWrapper>
  );
};
