import _ from 'lodash/fp';
import { Fragment, useState } from 'react';
import { div, h, h3, span } from 'react-hyperscript-helpers';
import { ClipboardButton } from 'src/components/ClipboardButton';
import { ButtonPrimary, Link } from 'src/components/common';
import { PageBox, PageBoxVariants } from 'src/components/PageBox';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import { getConfig } from 'src/libs/config';
import { withErrorReporting } from 'src/libs/error';
import * as Nav from 'src/libs/nav';
import allProviders from 'src/libs/providers';
import { useCancellation, useOnMount } from 'src/libs/react-utils';
import * as Utils from 'src/libs/utils';
import { FenceAccount } from 'src/pages/profile/external-identities/FenceAccount';
import { NihAccount } from 'src/pages/profile/external-identities/NihAccount';
import { SpacedSpinner } from 'src/pages/profile/SpacedSpinner';

const styles = {
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

const PassportLinker = ({ queryParams: { state, code } = {}, provider, prettyName }) => {
  const signal = useCancellation();
  const [accountInfo, setAccountInfo] = useState();
  const [passport, setPassport] = useState();
  const [authUrl, setAuthUrl] = useState();

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

    if (Nav.getCurrentRoute().name === 'ecm-callback' && JSON.parse(atob(state)).provider === provider) {
      window.history.replaceState({}, '', `/${Nav.getLink('profile')}`);
      linkAccount(code, state);
    } else {
      loadAccount();
      loadPassport();
    }
  });

  const unlinkAccount = withErrorReporting(`Error unlinking ${prettyName} account`, async () => {
    setAccountInfo(undefined);
    await Ajax().User.externalAccount(provider).unlink();
    setAccountInfo(null);
  });

  return div({ style: styles.idLink.container }, [
    div({ style: styles.idLink.linkContentTop(false) }, [
      h3({ style: { marginTop: 0, ...styles.idLink.linkName } }, [prettyName]),
      Utils.cond(
        [accountInfo === undefined, () => h(SpacedSpinner, ['Loading account status...'])],
        [
          accountInfo === null,
          () => {
            return div([h(ButtonPrimary, { href: authUrl, ...Utils.newTabLinkProps }, [`Link your ${prettyName} account`])]);
          },
        ],
        () => {
          const { externalUserId, expirationTimestamp } = accountInfo;

          return h(Fragment, [
            div([span({ style: styles.idLink.linkDetailLabel }, ['Username:']), externalUserId]),
            div([span({ style: styles.idLink.linkDetailLabel }, ['Link Expiration:']), span([Utils.makeCompleteDate(expirationTimestamp)])]),
            div([
              h(Link, { 'aria-label': `Renew your ${prettyName} link`, href: authUrl }, ['Renew']),
              span({ style: { margin: '0 0.25rem 0' } }, [' | ']),
              h(Link, { 'aria-label': `Unlink from ${prettyName}`, onClick: unlinkAccount }, ['Unlink']),
            ]),
            !!passport && div([h(ClipboardButton, { text: passport }, ['Copy passport to clipboard'])]),
          ]);
        }
      ),
    ]),
  ]);
};

export const ExternalIdentities = ({ queryParams }) => {
  return h(PageBox, { role: 'main', style: { flexGrow: 1 }, variant: PageBoxVariants.light }, [
    h(NihAccount, { nihToken: queryParams?.['nih-username-token'] }),
    _.map((provider) => h(FenceAccount, { key: provider.key, provider }), allProviders),
    !!getConfig().externalCredsUrlRoot && h(PassportLinker, { queryParams, provider: 'ras', prettyName: 'RAS' }),
  ]);
};
