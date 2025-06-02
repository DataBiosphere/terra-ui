import React from 'react';

export const ScientificServicesWelcomeHeader = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', paddingTop: '0rem' }}>
      <span style={{ fontSize: '24px', marginBottom: '1rem', fontWeight: 700 }}>
        Welcome to Scientific Services from the
      </span>
      <img
        src='src/images/brands/scientificServices/dspLogo.svg'
        alt='Broad Data Science Services logo'
        style={{ width: '200px' }}
      />
    </div>
  );
};
