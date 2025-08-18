import { ButtonPrimary, Icon } from '@terra-ui-packages/components';
import React, { ReactNode } from 'react';
import colors from 'src/libs/colors';
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews';
import { IMPUTATION_UI } from 'src/libs/feature-previews-config';
import { SCIENTIFIC_SERVICES_SUPPORT_EMAIL } from 'src/pages/scientificServices/pipelines/common/scientific-services-common';

/* TODO: Delete this entire component once the Imputation UI is generally available. */

interface FeaturePreviewLandingProps {
  children: ReactNode;
}

export const ImputationPrivatePreviewGate = ({ children }: FeaturePreviewLandingProps): ReactNode => {
  const isFeatureEnabled = isFeaturePreviewEnabled(IMPUTATION_UI);
  return isFeatureEnabled ? (
    children
  ) : (
    <div
      style={{
        margin: '4rem 3rem',
        padding: '1rem',
        width: '40%',
        minWidth: '600px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '1rem' }}>
        <Icon icon='info-circle-regular' size={32} style={{ color: colors.primary(), marginRight: '0.5rem' }} />
        <h2>
          Thank you for registering for the{' '}
          <span
            style={{
              fontStyle: 'italic',
            }}
          >
            All of Us
          </span>{' '}
          + AnVIL Imputation Service.{' '}
        </h2>
      </div>
      <div style={{ marginLeft: '2.5rem', marginTop: '1rem' }}>
        The{' '}
        <span
          style={{
            fontStyle: 'italic',
          }}
        >
          All of Us
        </span>{' '}
        + AnVIL Imputation Service user interface is currently in private preview and is not yet available to all users.
        If you have any questions or would like to inquire about early access, please contact us at{' '}
        <a
          style={{ textDecoration: 'underline', color: '#46A3E9', fontWeight: 'bold' }}
          href={`mailto:${SCIENTIFIC_SERVICES_SUPPORT_EMAIL}`}
        >
          {SCIENTIFIC_SERVICES_SUPPORT_EMAIL}
        </a>
        .
        <div style={{ marginTop: '1rem' }}>
          In the meantime, we invite you to use the{' '}
          <span
            style={{
              fontStyle: 'italic',
            }}
          >
            All of Us
          </span>{' '}
          + AnVIL Imputation Service using the Command Line Interface (CLI).
        </div>
        <ButtonPrimary
          style={{ marginTop: '1.5rem' }}
          href='https://pypi.org/project/terralab-cli/'
          target='_blank'
          rel='noopener noreferrer'
        >
          Try the CLI
        </ButtonPrimary>
      </div>
    </div>
  );
};
