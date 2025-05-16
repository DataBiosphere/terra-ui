import { ButtonPrimary } from '@terra-ui-packages/components';
import React from 'react';

export const ScientificServicesLandingPage = () => {
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', paddingTop: '0rem' }}>
        <span style={{ fontSize: '32px', marginBottom: '0.5rem' }}>Welcome to</span>
        {/* TODO for a11y, probably want to break the text `Broad Data Science Services` out of the below .svg */}
        <img
          src='src/images/brands/scientificServices/welcomeLogo.svg'
          alt='Broad Data Science Services logo'
          style={{ width: '400px', marginBottom: '1.5rem' }}
        />
      </div>
      <div>
        The Broad Data Science Services on Terra provide the community with fast, scalable, and secure analysis
        capabilities against valuable data resources.
      </div>
      <div style={{ fontWeight: 'bold', marginTop: '2rem' }}>Our current offerings:</div>
      <div>
        <span style={{ fontStyle: 'italic' }}>All of Us</span> + AnVIL Imputation Service
      </div>
      <div style={{ fontWeight: 'bold', marginTop: '2rem', marginBottom: '1rem' }}>First time using this service?</div>
      <div>You’ll be directed to create a Terra account and complete the registration process.</div>
      <ButtonPrimary
        height={100}
        style={{ marginTop: '2rem', width: '9.4rem', height: '3.2rem', fontSize: '1rem' }}
        href='#services/imputation'
      >
        Get started
      </ButtonPrimary>
    </>
  );
};
