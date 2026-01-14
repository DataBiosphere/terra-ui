import { ExternalLink, InfoBox } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React, { useState } from 'react';
import { ClipboardButton } from 'src/components/ClipboardButton';
import { ExternalCredentials } from 'src/libs/ajax/ExternalCredentials';
import { Metrics } from 'src/libs/ajax/Metrics';
import { NihDatasetPermission, User } from 'src/libs/ajax/User';
import colors from 'src/libs/colors';
import { getConfig } from 'src/libs/config';
import { withErrorReporting } from 'src/libs/error';
import Events from 'src/libs/events';
import * as Nav from 'src/libs/nav';
import { useCancellation, useOnMount, useStore } from 'src/libs/react-utils';
import { authStore } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { LinkOAuth2Account } from 'src/profile/external-identities/LinkOAuth2Account';
import { NihResources } from 'src/profile/external-identities/NihResources';
import { OAuth2Callback, OAuth2Provider } from 'src/profile/external-identities/OAuth2Providers';
import { UnlinkOAuth2Account } from 'src/profile/external-identities/UnlinkOAuth2Account';
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
    linkContentTop: (hasBottom: any) => ({
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

interface OAuth2AccountProps {
  queryParams: { state?: string; code?: string };
  provider: OAuth2Provider;
}
export const OAuth2Account = (props: OAuth2AccountProps) => {
  const {
    queryParams: { state, code },
    provider,
  } = props;

  const { oAuth2AccountStatus: storedOAuth2AccountStatus } = useStore(authStore);

  const { externalUserId, expirationTimestamp, additionalProperties } = storedOAuth2AccountStatus[provider.key] ?? {
    externalUserId: undefined,
    expirationTimestamp: undefined,
    additionalProperties: undefined,
  };
  const eraUserId = additionalProperties?.era_user_id ?? 'none';
  const nihSettingsPage = `${getConfig().nihAuthRoot}/settings2/profile/loadIdentities`;

  const signal = useCancellation();
  const callbacks: Array<OAuth2Callback['name']> = ['oauth-callback', 'ecm-callback', 'fence-callback']; // ecm-callback is deprecated, but still needs to be supported
  const [isLinking, setIsLinking] = useState(
    callbacks.includes(Nav.getCurrentRoute().name) && state && JSON.parse(atob(state)).provider === provider.key
  );
  const isRASProvider = provider.key === 'ras';
  const [authorizedDatasets, setAuthorizedDatasets] = useState<NihDatasetPermission[]>([]);
  const [unauthorizedDatasets, setUnauthorizedDatasets] = useState<NihDatasetPermission[]>([]);

  useOnMount(() => {
    const linkAccount = withErrorReporting(`Error linking ${provider.short} account`)(async (code, state) => {
      const accountInfo = await ExternalCredentials(signal)(provider).linkAccountWithAuthorizationCode(code, state);
      authStore.update(_.set(['oAuth2AccountStatus', provider.key], accountInfo));
      void Metrics().captureEvent(Events.user.externalCredential.link, { provider: provider.key });
      setIsLinking(false);
    });

    const getNihResources = withErrorReporting('Error fetching NIH resources')(async () => {
      const nihResources = await User().getNihResources();
      const [authorized, unauthorized]: [NihDatasetPermission[], NihDatasetPermission[]] = _.flow(
        _.sortBy<NihDatasetPermission>('name'),
        _.partition<NihDatasetPermission>('authorized')
      )(nihResources?.datasetPermissions || []);
      setAuthorizedDatasets(authorized);
      setUnauthorizedDatasets(unauthorized);
    });

    if (isLinking) {
      const profileLink = `/${Nav.getLink('profile', {}, { tab: 'externalIdentities' })}`;
      window.history.replaceState({}, '', profileLink);
      linkAccount(code, state);
    }

    if (isRASProvider && !isLinking) {
      getNihResources();
    }
  });

  return (
    <div style={styles.idLink.container}>
      <div style={styles.idLink.linkContentTop(false)}>
        <h3 style={{ marginTop: 0, ...styles.idLink.linkName }}>
          {provider.name}
          {provider.toolTip && <InfoBox style={{ marginLeft: '0.5rem' }}>{provider.toolTip}</InfoBox>}
        </h3>
        {isLinking && <SpacedSpinner>Loading account status...</SpacedSpinner>}
        {!externalUserId && (
          <div>
            <LinkOAuth2Account provider={provider} linkText={`Log in to ${provider.short}`} />
          </div>
        )}
        {externalUserId && (
          <>
            <div>
              <span style={styles.idLink.linkDetailLabel}>Username:</span>
              {externalUserId}
            </div>
            {isRASProvider && (
              <div>
                <span style={styles.idLink.linkDetailLabel}>eRA Commons ID:</span>
                {eraUserId}
                <span style={{ marginLeft: '0.5rem' }}>
                  <ExternalLink href={nihSettingsPage}>Manage your linked identities</ExternalLink>
                </span>
              </div>
            )}
            <div>
              <span style={styles.idLink.linkDetailLabel}>Link Expiration:</span>
              <span>{Utils.makeCompleteDate(expirationTimestamp)}</span>
            </div>
            <div>
              <LinkOAuth2Account linkText={`Renew your ${provider.short} link`} provider={provider} button={false} />
              <span style={{ margin: '0 0.25rem 0' }}> | </span>
              <UnlinkOAuth2Account linkText='Unlink' provider={provider} />
            </div>
            {provider.supportsIdToken && (
              <ClipboardButton text={ExternalCredentials(signal)(provider).getIdentityToken}>
                Copy identity token to clipboard
              </ClipboardButton>
            )}
          </>
        )}
      </div>
      {externalUserId && isRASProvider && (
        <NihResources authorizedDatasets={authorizedDatasets} unauthorizedDatasets={unauthorizedDatasets} />
      )}
    </div>
  );
};
