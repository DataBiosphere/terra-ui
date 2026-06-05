import React from 'react';
import bclLogo from 'src/images/brands/scientificServices/bcl-logo-primary.svg';

export const ScientificServicesWelcomeHeader = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', paddingTop: '0rem' }}>
      <span style={{ fontSize: '24px', marginBottom: '1rem', fontWeight: 700 }}>
        Welcome to Data Science Services from
      </span>
      <img src={bclLogo} alt='Broad Clinical Laboratories' style={{ width: '200px' }} />
    </div>
  );
};
