import { Icon } from '@terra-ui-packages/components';
import React from 'react';
import * as Nav from 'src/libs/nav';

export const ScientificServicesDescription = () => {
  // We do this redirect for two reasons:
  // 1. To ensure that logged in users never see the landing page
  // 2. To bypass Terra UI's default behavior of showing the landing page without a Sign In button, requiring
  //    users to click through to an authed paged (pipelines-run in our case) before seeing the Sign In button
  Nav.history.push({
    pathname: Nav.getPath('pipelines-run'),
  });

  return (
    <>
      <div>
        Our scientific services provide the community with fast, scalable, and secure analysis capabilities that
        leverage valuable data resources.
      </div>
      <div style={{ fontWeight: 'bold', marginTop: '2rem', marginBottom: '1rem' }} />
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
