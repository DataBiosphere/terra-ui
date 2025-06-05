import { ButtonPrimary } from '@terra-ui-packages/components';
import React from 'react';

export const ScientificServicesDescription = () => {
  return (
    <>
      <div>
        Our scientific services provide the community with fast, scalable, and secure analysis capabilities that
        leverage valuable data resources.
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
        href='#services/pipelines'
      >
        Get started
      </ButtonPrimary>
    </>
  );
};
