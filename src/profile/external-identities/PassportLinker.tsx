import { Clickable } from '@terra-ui-packages/components';
import React from 'react';
import { useState } from 'react';
import { ClipboardButton } from 'src/components/ClipboardButton';
import { ButtonPrimary, Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import { Ajax } from 'src/libs/ajax';
import { EcmLinkAccountResponse } from 'src/libs/ajax/User';
import colors from 'src/libs/colors';
import { withErrorReporting } from 'src/libs/error';
import * as Nav from 'src/libs/nav';
import { useCancellation, useOnMount } from 'src/libs/react-utils';
import * as Utils from 'src/libs/utils';
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

interface PassportLinkerProps {
  queryParams: { state?: string; code?: string };
  provider: string;
  prettyName: string;
}
export const PassportLinker = (props: PassportLinkerProps) => {
  const {
    queryParams: { state, code },
    provider,
    prettyName,
  } = props;

  const signal = useCancellation();
  const [accountInfo, setAccountInfo] = useState<EcmLinkAccountResponse>();
  const [accountLoaded, setAccountLoaded] = useState<boolean>(false);
  const [passport, setPassport] = useState<string | undefined>();
  const [authUrl, setAuthUrl] = useState<string>();

  useOnMount(() => {
    const loadAuthUrl = withErrorReporting(`Error loading ${prettyName} account link URL`, async () => {
      setAuthUrl(await Ajax(signal).User.externalAccount(provider).getAuthUrl());
    });
    const loadAccount = withErrorReporting(`Error loading ${prettyName} account`, async () => {
      setAccountInfo(await Ajax(signal).User.externalAccount(provider).get());
    });
    const loadPassport = withErrorReporting(`Error loading ${prettyName} passport`, async () => {
      setPassport(await Ajax(signal).User.externalAccount(provider).getPassport());
    });
    const linkAccount = withErrorReporting(`Error linking ${prettyName} account`, async (code, state) => {
      setAccountInfo(await Ajax().User.externalAccount(provider).linkAccount(code, state));
      loadPassport();
    });

    loadAuthUrl();

    if (Nav.getCurrentRoute().name === 'ecm-callback' && state && JSON.parse(atob(state)).provider === provider) {
      window.history.replaceState({}, '', `/${Nav.getLink('profile')}`);
      linkAccount(code, state);
    } else {
      loadAccount();
      loadPassport();
    }
    setAccountLoaded(true);
  });

  const unlinkAccount = withErrorReporting(`Error unlinking ${prettyName} account`, async () => {
    await Ajax().User.externalAccount(provider).unlink();
    setAccountInfo(undefined);
  });

  return (
    <div style={styles.idLink.container}>
      <div style={styles.idLink.linkContentTop(false)}>
        <h3 style={{ marginTop: 0, ...styles.idLink.linkName }}>{prettyName}</h3>
        {!accountLoaded && <SpacedSpinner>Loading account status...</SpacedSpinner>}
        {accountLoaded && !accountInfo && (
          <div>
            <ButtonPrimary href={authUrl} target={Utils.newTabLinkProps.target} rel={Utils.newTabLinkProps.rel}>
              Link your {prettyName} account
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
              <Link aria-label={`Renew your ${prettyName} link`} href={authUrl}>
                Renew{icon('pop-out', { size: 12, style: { marginLeft: '0.2rem' } })}
              </Link>
              <span style={{ margin: '0 0.25rem 0' }}> | </span>
              <Clickable aria-label={`Unlink from ${prettyName}`} onClick={unlinkAccount} style={styles.clickableLink}>
                Unlink
              </Clickable>
            </div>
            {!!passport && <ClipboardButton text={passport}>Copy passport to clipboard</ClipboardButton>}
          </>
        )}
      </div>
    </div>
  );
};
