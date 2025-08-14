import React from 'react';
import dspLogo from 'src/images/brands/scientificServices/dspLogo.svg';

export const ScientificServicesWelcomeHeader = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', paddingTop: '0rem' }}>
      <span style={{ fontSize: '24px', marginBottom: '1rem', fontWeight: 700 }}>
        Welcome to Scientific Services from the
      </span>
      <img src={dspLogo} alt='Broad Institute Data Sciences Platform' style={{ width: '200px' }} />
    </div>
  );
};
