import React, { useState } from 'react';
import { loadTerraUser, signOut } from 'src/auth/auth';
import { ButtonPrimary, ButtonSecondary } from 'src/components/common';
import scienceBackground from 'src/images/science-background.jpg';
import { Ajax } from 'src/libs/ajax';
import { reportError } from 'src/libs/error';
import * as Nav from 'src/libs/nav';
import { useStore } from 'src/libs/react-utils';
import { authStore } from 'src/libs/state';
import { RemoteMarkdown } from 'src/libs/util/RemoteMarkdown';
import { docContainerStyles, headerStyles, mainStyles } from 'src/registration/legal-doc-styles';

export const TermsOfServicePage = () => {
  const [busy, setBusy] = useState<boolean>();
  const { signInStatus, termsOfService, terraUserAllowances } = useStore(authStore);
  const acceptedLatestTos = termsOfService.isCurrentVersion === true;
  const usageAllowed = terraUserAllowances.details.termsOfService === true;
  const requiredToAcceptTermsOfService = signInStatus === 'userLoaded' && !(acceptedLatestTos && usageAllowed);

  const accept = async () => {
    try {
      setBusy(true);
      await Ajax().TermsOfService.acceptTermsOfService();
      await loadTerraUser();
      Nav.goToPath('root');
    } catch (error) {
      reportError('Error accepting Terms of Service', error);
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    try {
      setBusy(true);
      await Ajax().TermsOfService.rejectTermsOfService();
    } catch (error) {
      reportError('Error rejecting Terms of Service', error);
    } finally {
      setBusy(false);
      signOut('declinedTos');
    }
  };

  return (
    <div role="main" style={mainStyles}>
      <img src={scienceBackground} alt="" style={{ position: 'fixed', top: 0, left: 0, zIndex: -1 }} />
      <div style={docContainerStyles}>
        <h1 style={headerStyles}>Terra Terms of Service</h1>
        {requiredToAcceptTermsOfService && (
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Please accept the Terms of Service to continue.</h2>
        )}
        <RemoteMarkdown
          style={{ height: '60vh', overflowY: 'auto', lineHeight: 1.5, marginTop: '1rem', paddingRight: '1rem' }}
          getRemoteText={() => Ajax().TermsOfService.getTermsOfServiceText()}
          failureMessage="Could not get Terms of Service"
        />
        {requiredToAcceptTermsOfService ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <ButtonSecondary style={{ marginRight: '1rem' }} onClick={reject} disabled={busy}>
              Decline and Sign Out
            </ButtonSecondary>
            <ButtonPrimary onClick={accept} disabled={busy}>
              Accept
            </ButtonPrimary>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <ButtonPrimary onClick={() => Nav.goToPath('root')} disabled={busy}>
              Back to Terra
            </ButtonPrimary>
          </div>
        )}
      </div>
    </div>
  );
};
export const navPaths = [
  {
    name: 'terms-of-service',
    path: '/terms-of-service',
    component: TermsOfServicePage,
    public: true,
    title: 'Terms of Service',
  },
];
