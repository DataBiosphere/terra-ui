import { Icon } from '@terra-ui-packages/components';
import React from 'react';
import colors from 'src/libs/colors';
import { SCIENTIFIC_SERVICES_SUPPORT_EMAIL } from 'src/pages/scientificServices/pipelines/common/scientific-services-common';

export const ServiceUnavailableView = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 2rem',
        textAlign: 'center',
      }}
    >
      <Icon icon='warning-standard' size={64} style={{ color: colors.warning(), marginBottom: '1.5rem' }} />
      <h2 style={{ marginBottom: '0.75rem', color: colors.dark() }}>Service Unavailable</h2>
      <p style={{ maxWidth: 500, color: colors.dark(0.7), marginBottom: '1rem' }}>
        We&apos;re having trouble connecting to our services right now. Please try refreshing the page. If the problem
        persists, contact us at{' '}
        <a href={`mailto:${SCIENTIFIC_SERVICES_SUPPORT_EMAIL}`} style={{ color: '#46A3E9' }}>
          {SCIENTIFIC_SERVICES_SUPPORT_EMAIL}
        </a>
        .
      </p>
    </div>
  );
};
