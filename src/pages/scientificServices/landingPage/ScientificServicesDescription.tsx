import { ButtonPrimary } from '@terra-ui-packages/components';
import React, { useState } from 'react';
import { getCurrentLocation } from 'src/libs/nav/location-utils';

export const ScientificServicesDescription = () => {
  const [buttonVisible, setButtonVisible] = useState(() => {
    return !getCurrentLocation().hash.includes('services/pipelines');
  });

  return (
    <>
      <div>
        Our scientific services provide the community with fast, scalable, and secure analysis capabilities that
        leverage valuable data resources.
      </div>
      <div style={{ fontWeight: 'bold', marginTop: '2rem' }}>Our current offerings:</div>
      <div>
        <a
          href='https://allofus-anvil-imputation.terra.bio/'
          target='_blank'
          rel='noopener noreferrer'
          style={{ textDecoration: 'underline' }}
        >
          <span style={{ fontStyle: 'italic' }}>All of Us</span> + AnVIL Imputation Service
        </a>
      </div>
      <div style={{ fontWeight: 'bold', marginTop: '2rem', marginBottom: '1rem' }}>First time using this service?</div>
      {buttonVisible && (
        <ButtonPrimary
          height={100}
          style={{ marginTop: '0.25rem', marginBottom: '0.5rem', width: '9.4rem', height: '3.2rem', fontSize: '1rem' }}
          href='#services/pipelines'
          onClick={() => setButtonVisible(false)}
        >
          Get started
        </ButtonPrimary>
      )}
      <div>You’ll be directed to create a Terra account and complete the registration process.</div>
    </>
  );
};
