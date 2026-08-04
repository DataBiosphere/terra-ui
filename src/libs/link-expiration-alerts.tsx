import { addDays, differenceInDays } from 'date-fns/fp';
import _ from 'lodash/fp';
import React, { useEffect, useState } from 'react';
import { Alert } from 'src/alerts/Alert';
import { EcmLinkAccountResponse } from 'src/libs/ajax/ExternalCredentials';
import { AuthState, authStore } from 'src/libs/state';
import { LinkOAuth2Account } from 'src/profile/external-identities/LinkOAuth2Account';
import { allOAuth2Providers, OAuth2Provider } from 'src/profile/external-identities/OAuth2Providers';
import { UnlinkOAuth2Account } from 'src/profile/external-identities/UnlinkOAuth2Account';

export const getOAuth2ProviderLinkExpirationAlert = (
  provider: OAuth2Provider,
  status: EcmLinkAccountResponse,
  now: number
) => {
  const { key, name } = provider;
  const { expirationTimestamp } = status;

  const dateOfExpiration = expirationTimestamp.getTime();
  const shouldNotify = Boolean(dateOfExpiration) && now >= addDays(-5, dateOfExpiration).getTime();

  if (!shouldNotify) {
    return null;
  }

  const hasExpired = now >= dateOfExpiration;
  const expireStatus = hasExpired ? 'has expired' : `will expire in ${differenceInDays(now, dateOfExpiration)} day(s)`;

  return {
    id: `oauth2-account-link-expiration/${key}`,
    title: `Your access to ${name} ${expireStatus}.`,
    message: (
      <div>
        Log in to{' '}
        <LinkOAuth2Account
          linkText={expireStatus === 'has expired' ? 'restore ' : 'renew '}
          provider={provider}
          button={false}
        />{' '}
        your access or <UnlinkOAuth2Account linkText='unlink' provider={provider} /> your account.
      </div>
    ),
    severity: 'info',
  };
};

export const getLinkExpirationAlerts = (authState: AuthState): Alert[] => {
  const now = Date.now();

  const oauth2Providers = allOAuth2Providers.map((provider) => {
    const maybeResponse = _.get(['oAuth2AccountStatus', provider.key], authState);
    if (maybeResponse) {
      return { provider, ecmAccountStatus: maybeResponse };
    }
    return undefined;
  });
  return _.compact([
    ..._.map(
      ({ provider, ecmAccountStatus }) => getOAuth2ProviderLinkExpirationAlert(provider, ecmAccountStatus, now),
      _.compact(oauth2Providers)
    ),
  ]);
};

export const useLinkExpirationAlerts = () => {
  const [alerts, setAlerts] = useState(() => getLinkExpirationAlerts(authStore.get()));
  useEffect(() => {
    return authStore.subscribe((authState) => setAlerts(getLinkExpirationAlerts(authState))).unsubscribe;
  }, []);
  return alerts;
};
