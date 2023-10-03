import { addDays, parseJSON } from 'date-fns/fp';
import _ from 'lodash/fp';
import * as qs from 'qs';
import { Fragment, useState } from 'react';
import { div, h, h3, span } from 'react-hyperscript-helpers';
import { FrameworkServiceLink, UnlinkFenceAccount } from 'src/components/external-account-links';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import { withErrorReporting } from 'src/libs/error';
import * as Nav from 'src/libs/nav';
import { useOnMount, useStore } from 'src/libs/react-utils';
import { authStore } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
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

export const FenceLink = ({ provider: { key, name, expiresAfter, short } }) => {
  // State
  const {
    fenceStatus: { [key]: { username, issued_at: issuedAt } = {} },
  } = useStore(authStore);

  const oauth2State = new URLSearchParams(window.location.search).get('state');
  const provider = oauth2State ? JSON.parse(atob(oauth2State)).provider : '';
  const [isLinking, setIsLinking] = useState(Nav.useRoute().name === 'fence-callback' && key === provider);

  // Helpers
  const redirectUrl = `${window.location.origin}/${Nav.getLink('fence-callback')}`;

  // Lifecycle
  useOnMount(() => {
    const { state, code } = qs.parse(window.location.search, { ignoreQueryPrefix: true });
    const extractedProvider = state ? JSON.parse(atob(state)).provider : '';
    const token = key === extractedProvider ? code : undefined;

    const linkFenceAccount = _.flow(
      withErrorReporting('Error linking NIH account'),
      Utils.withBusyState(setIsLinking)
    )(async () => {
      const status = await Ajax().User.linkFenceAccount(key, token, redirectUrl, state);
      authStore.update(_.set(['fenceStatus', key], status));
    });

    if (token) {
      const profileLink = `/${Nav.getLink('profile')}`;
      window.history.replaceState({}, '', profileLink);
      linkFenceAccount();
    }
  });

  // Render
  return div({ style: styles.idLink.container }, [
    div({ style: styles.idLink.linkContentTop(false) }, [
      h3({ style: { marginTop: 0, ...styles.idLink.linkName } }, [name]),
      Utils.cond(
        [isLinking, () => h(SpacedSpinner, ['Loading account status...'])],
        [!username, () => div([h(FrameworkServiceLink, { button: true, linkText: `Log in to ${short} `, provider: key, redirectUrl })])],
        () =>
          h(Fragment, [
            div([span({ style: styles.idLink.linkDetailLabel }, ['Username:']), username]),
            div([
              span({ style: styles.idLink.linkDetailLabel }, ['Link Expiration:']),
              span([Utils.makeCompleteDate(addDays(expiresAfter, parseJSON(issuedAt)))]),
            ]),
            div([
              h(FrameworkServiceLink, {
                linkText: 'Renew',
                'aria-label': `Renew your ${short} link`,
                provider: key,
                redirectUrl,
              }),
              span({ style: { margin: '0 .25rem 0' } }, [' | ']),
              h(UnlinkFenceAccount, {
                linkText: 'Unlink',
                'aria-label': `Unlink from ${short}`,
                provider: { key, name },
              }),
            ]),
          ])
      ),
    ]),
  ]);
};
