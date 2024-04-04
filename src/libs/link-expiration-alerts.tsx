import { addDays, differenceInDays } from 'date-fns/fp';
import _ from 'lodash/fp';
import React, { useEffect, useState } from 'react';
import { Alert } from 'src/alerts/Alert';
import { EcmLinkAccountResponse } from 'src/libs/ajax/ExternalCredentials';
import { getEnabledBrand } from 'src/libs/brand-utils';
import { AuthState, authStore, NihStatus } from 'src/libs/state';
import { LinkOAuth2Account } from 'src/profile/external-identities/LinkOAuth2Account';
import { allOAuth2Providers, OAuth2Provider } from 'src/profile/external-identities/OAuth2Providers';
import { ShibbolethLink } from 'src/profile/external-identities/ShibbolethLink';
import { UnlinkOAuth2Account } from 'src/profile/external-identities/UnlinkOAuth2Account';

const getNihAccountLinkExpirationAlert = (status: NihStatus | undefined, now: number) => {
  if (status) {
    // Orchestration API returns NIH link expiration time in seconds since epoch
    const dateOfExpiration = status && new Date(status.linkExpireTime * 1000).getTime();
    const shouldNotify = Boolean(dateOfExpiration) && now >= addDays(-1, dateOfExpiration).getTime();
    if (!shouldNotify) {
      return null;
    }

    const hasExpired = now >= dateOfExpiration;
    const expireStatus = hasExpired ? 'has expired' : 'will expire soon';

    return {
      id: 'nih-link-expiration',
      title: `Your access to NIH Controlled Access workspaces and data ${expireStatus}.`,
      message: (
        <div>
          To regain access,{' '}
          <ShibbolethLink style={{ color: 'unset', fontWeight: 600, textDecoration: 'underline' }}>
            re-link
          </ShibbolethLink>{' '}
          your eRA Commons / NIH account ({status.linkedNihUsername}) with {getEnabledBrand().name}.
        </div>
      ),
      severity: 'info',
    };
  }
  return undefined;
};

export const getOAuth2ProviderLinkExpirationAlert = (
  provider: OAuth2Provider,
  status: EcmLinkAccountResponse,
  now: number
) => {
  if (status) {
    const { key, name } = provider;
    const { expirationTimestamp } = status;

    const dateOfExpiration = expirationTimestamp.getTime();
    const shouldNotify = Boolean(dateOfExpiration) && now >= addDays(-5, dateOfExpiration).getTime();

    if (!shouldNotify) {
      return null;
    }

    const hasExpired = now >= dateOfExpiration;
    const expireStatus = hasExpired
      ? 'has expired'
      : `will expire in ${differenceInDays(now, dateOfExpiration)} day(s)`;

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
          your access or <UnlinkOAuth2Account linkText="unlink" provider={provider} /> your account.
        </div>
      ),
      severity: 'info',
    };
  }
  return undefined;
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
    getNihAccountLinkExpirationAlert(authState.nihStatus, now),
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
