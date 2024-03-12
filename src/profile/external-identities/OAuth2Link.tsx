import { Clickable } from '@terra-ui-packages/components';
import React, { ReactNode, useState } from 'react';
import { loadTerraUser } from 'src/auth/auth';
import { ClipboardButton } from 'src/components/ClipboardButton';
import { ButtonPrimary } from 'src/components/common';
import { icon } from 'src/components/icons';
import { Ajax } from 'src/libs/ajax';
import { EcmLinkAccountResponse } from 'src/libs/ajax/ExternalCredentials';
import colors from 'src/libs/colors';
import { withErrorReporting } from 'src/libs/error';
import * as Nav from 'src/libs/nav';
import { notify } from 'src/libs/notifications';
import { useCancellation, useOnMount, useStore } from 'src/libs/react-utils';
import { userStore } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { OAuth2Callback, OAuth2Provider } from 'src/profile/external-identities/OAuth2Providers';
import { SpacedSpinner } from 'src/profile/SpacedSpinner';

const styles = {
  clickableLink: {
    display: 'inline',
    color: colors.accent(),
    cursor: 'pointer',
    fontWeight: 500,
  },
  idLink: {
    container: {
      display: 'grid',
      marginBottom: '0.6rem',
      border: `1px solid ${colors.dark(0.55)}`,
      borderRadius: 4,
    },
    linkContentTop: (hasBottom) => ({
      display: 'grid',
      rowGap: '0.6rem',
      backgroundColor: colors.light(0.2),
      padding: '1.2rem',
      borderRadius: hasBottom ? '4px 4px 0 0' : 4,
    }),
    linkContentBottom: {
      padding: '1.2rem',
    },
    linkName: {
      fontSize: 18,
      fontWeight: 700,
      marginBottom: '0.6rem',
      display: 'inline',
    },
    linkDetailLabel: {
      fontWeight: 700,
      marginBottom: '0.6rem',
      marginRight: '1.2rem',
    },
  },
};

interface OAuth2LinkProps {
  queryParams: { state?: string; code?: string };
  provider: OAuth2Provider;
}
export const OAuth2Link = (props: OAuth2LinkProps) => {
  const {
    queryParams: { state, code },
    provider,
  } = props;

  const signal = useCancellation();
  const [accountInfo, setAccountInfo] = useState<EcmLinkAccountResponse>();
  const [accountLoaded, setAccountLoaded] = useState<boolean>(false);
  const callbacks: Array<OAuth2Callback['name']> = ['oauth-callback', 'ecm-callback']; // ecm-callback is deprecated, but still needs to be supported
  const isLinking =
    callbacks.includes(Nav.getCurrentRoute().name) && state && JSON.parse(atob(state)).provider === provider.key;
  const { enterpriseFeatures, terraUser } = useStore(userStore);

  const isFeatureEnabled = enterpriseFeatures.includes(`${provider.key}-account-linking`);

  useOnMount(() => {
    const loadAccount = withErrorReporting(`Error loading ${provider.name} account`, async () => {
      setAccountInfo(await Ajax(signal).ExternalCredentials(provider).getAccountLinkStatus());
    });
    const linkAccount = withErrorReporting(`Error linking ${provider.name} account`, async (code, state) => {
      setAccountInfo(await Ajax(signal).ExternalCredentials(provider).linkAccountWithAuthorizationCode(code, state));
    });

    if (isLinking) {
      const profileLink = `/${Nav.getLink('profile', {}, { tab: 'externalIdentities' })}`;
      window.history.replaceState({}, '', profileLink);
      linkAccount(code, state);
    } else {
      loadAccount();
    }
    setAccountLoaded(true);
  });

  const unlinkAccount = withErrorReporting(`Error unlinking ${provider.name} account`, async () => {
    await Ajax(signal).ExternalCredentials(provider).unlinkAccount();
    setAccountInfo(undefined);
  });

  const getAuthUrlAndRedirect = withErrorReporting(`Error getting Authorization URL for ${provider.name}`, async () => {
    const url = await Ajax(signal).ExternalCredentials(provider).getAuthorizationUrl();
    window.open(url, Utils.newTabLinkProps.target, 'noopener,noreferrer');
  });

  const gimmeAccess = async () => {
    await Ajax(signal).User.gimmeAccess(`${provider.key}-account-linking`, terraUser.email!);
    notify('info', 'Access Granted via Sam Enterprise Features!', {
      id: `granted-access-${provider.key}-account-linking`,
      detail: `Granted access to ${provider.name} Account Linking via Sam Enterprise Features`,
    });
    await loadTerraUser();
  };

  const removeMyAcccess = async () => {
    await Ajax(signal).User.removeMyAccess(`${provider.key}-account-linking`, terraUser.email!);
    notify('error', 'Access Revoked via Sam Enterprise Features!', {
      id: `revoked-access-${provider.key}-account-linking`,
      detail: `Revoked access to ${provider.name} Account Linking via Sam Enterprise Features`,
    });
    await loadTerraUser();
  };

  let content: ReactNode | undefined;
  if (isFeatureEnabled) {
    content = (
      <div style={styles.idLink.container}>
        <div style={styles.idLink.linkContentTop(false)}>
          <h3 style={{ marginTop: 0, ...styles.idLink.linkName }}>{provider.name}</h3>
          {!accountLoaded && <SpacedSpinner>Loading account status...</SpacedSpinner>}
          <div>
            <ButtonPrimary
              aria-label={`Remove access to ${provider.name} account linking`}
              onClick={async () => await removeMyAcccess()}
              danger
            >
              Remove my access to {provider.name} account linking!
            </ButtonPrimary>
          </div>
          {accountLoaded && !accountInfo && (
            <div>
              <ButtonPrimary
                onClick={getAuthUrlAndRedirect}
                target={Utils.newTabLinkProps.target}
                rel={Utils.newTabLinkProps.rel}
              >
                Link your {provider.name} account
              </ButtonPrimary>
            </div>
          )}
          {accountInfo && (
            <>
              <div>
                <span style={styles.idLink.linkDetailLabel}>Username:</span>
                {accountInfo.externalUserId}
              </div>
              <div>
                <span style={styles.idLink.linkDetailLabel}>Link Expiration:</span>
                <span>{Utils.makeCompleteDate(accountInfo.expirationTimestamp)}</span>
              </div>
              <div>
                <Clickable
                  aria-label={`Renew your ${provider.name} link`}
                  onClick={getAuthUrlAndRedirect}
                  style={styles.clickableLink}
                >
                  Renew{icon('pop-out', { size: 12, style: { marginLeft: '0.2rem' } })}
                </Clickable>
                <span style={{ margin: '0 0.25rem 0' }}> | </span>
                <Clickable
                  aria-label={`Unlink from ${provider.name}`}
                  onClick={unlinkAccount}
                  style={styles.clickableLink}
                >
                  Unlink
                </Clickable>
              </div>
              {provider.supportsIdToken && (
                <ClipboardButton text={Ajax(signal).ExternalCredentials(provider).getIdentityToken}>
                  Copy identity token to clipboard
                </ClipboardButton>
              )}
            </>
          )}
        </div>
      </div>
    );
  } else {
    content = (
      <div style={styles.idLink.container}>
        <div style={styles.idLink.linkContentTop(false)}>
          <h3 style={{ marginTop: 0, ...styles.idLink.linkName }}>{provider.name}</h3>
          <div>
            <p>
              Linking your {provider.name} account is not an available feature. Please consider signing an agreement
              with Terra.
            </p>
            <ButtonPrimary
              aria-label={`Gimme access to ${provider.name} account linking`}
              onClick={async () => gimmeAccess()}
              danger
            >
              Gimme access to {provider.name} account linking!
            </ButtonPrimary>
          </div>
        </div>
      </div>
    );
  }

  return content;
};
