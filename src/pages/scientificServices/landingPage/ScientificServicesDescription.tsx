import { ButtonPrimary, Icon, useStore } from '@terra-ui-packages/components';
import React, { useState } from 'react';
import * as Nav from 'src/libs/nav';
import { getCurrentLocation } from 'src/libs/nav/location-utils';
import { authStore } from 'src/libs/state';

export const ScientificServicesDescription = () => {
  const { signInStatus } = useStore(authStore);

  const [buttonVisible, setButtonVisible] = useState(() => {
    return !getCurrentLocation().hash.includes('pipelines/imputation');
  });

  // If the user is already signed in, redirect to the pipelines run page so they don't
  // have to click "Get started"
  if (signInStatus === 'userLoaded') {
    Nav.history.push({
      pathname: Nav.getPath('pipelines-run'),
    });
  }

  return (
    <>
      <div>
        Our scientific services provide the community with fast, scalable, and secure analysis capabilities that
        leverage valuable data resources.
      </div>
      <div style={{ fontWeight: 'bold', marginTop: '2rem', marginBottom: '1rem' }} />
      {buttonVisible && (
        <ButtonPrimary
          height={100}
          style={{ marginTop: '0.25rem', marginBottom: '0.5rem', width: '9.4rem', height: '3.2rem', fontSize: '1rem' }}
          href='#pipelines/imputation/run'
          onClick={() => setButtonVisible(false)}
        >
          Get started
        </ButtonPrimary>
      )}
      <div style={{ fontWeight: 'bold', marginTop: '2rem' }}>Learn more about our current offerings:</div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
        }}
      >
        <a
          href='https://allofus-anvil-imputation.terra.bio/'
          target='_blank'
          rel='noopener noreferrer'
          style={{ textDecoration: 'underline' }}
        >
          <span style={{ fontStyle: 'italic' }}>All of Us</span> + AnVIL Imputation Service
        </a>
        <Icon icon='pop-out' size={16} style={{ marginLeft: '0.25rem' }} />
      </div>
    </>
  );
};
