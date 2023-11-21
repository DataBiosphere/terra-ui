import React, { useState } from 'react';
import { loadTerraUser, signOut } from 'src/auth/auth';
import { ButtonPrimary, ButtonSecondary } from 'src/components/common';
import scienceBackground from 'src/images/science-background.jpg';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import { reportError } from 'src/libs/error';
import * as Nav from 'src/libs/nav';
import { useStore } from 'src/libs/react-utils';
import { authStore } from 'src/libs/state';
import * as Style from 'src/libs/style';
import { RemoteMarkdown } from 'src/libs/util/RemoteMarkdown';

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

  const backToTerra = () => {
    Nav.goToPath('root');
  };

  const mainStyles = {
    padding: '1rem',
    minHeight: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };
  const tosContainerStyles = {
    backgroundColor: 'white',
    borderRadius: 5,
    width: 800,
    maxHeight: '100%',
    padding: '2rem',
    boxShadow: Style.standardShadow,
  };
  const headerStyles = { color: colors.dark(), fontSize: 38, fontWeight: 400 };
  return (
    <div role="main" style={mainStyles}>
      <img src={scienceBackground} alt="" style={{ position: 'fixed', top: 0, left: 0, zIndex: -1 }} />
      <div style={tosContainerStyles}>
        <h1 style={headerStyles}>Terra Terms of Service</h1>
        {requiredToAcceptTermsOfService && (
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Please accept the Terms of Service to continue.</h2>
        )}
        <RemoteMarkdown
          style={{ height: '50vh', overflowY: 'auto', lineHeight: 1.5, marginTop: '1rem', paddingRight: '1rem' }}
          getRemoteText={() => Ajax().TermsOfService.getTermsOfServiceText()}
          failureMessage="Could not get Terms of Service"
        />
        {requiredToAcceptTermsOfService && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <ButtonSecondary style={{ marginRight: '1rem' }} onClick={reject} disabled={busy}>
              Decline and Sign Out
            </ButtonSecondary>
            <ButtonPrimary onClick={accept} disabled={busy}>
              Accept
            </ButtonPrimary>
          </div>
        )}
        {!requiredToAcceptTermsOfService && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <ButtonPrimary onClick={backToTerra} disabled={busy}>
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
