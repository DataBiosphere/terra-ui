import { addDays, parseJSON } from 'date-fns/fp';
import _ from 'lodash/fp';
import * as qs from 'qs';
import { Fragment, useState } from 'react';
import { div, h, h3, span } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { withErrorReporting } from 'src/libs/error';
import * as Nav from 'src/libs/nav';
import { useOnMount, useStore } from 'src/libs/react-utils';
import { authStore } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { FrameworkServiceLink } from 'src/pages/profile/external-identities/FrameworkServiceLink';
import { linkStyles as styles } from 'src/pages/profile/external-identities/LinkStyles';
import { UnlinkFenceAccount } from 'src/pages/profile/external-identities/UnlinkFenceAccount';
import { SpacedSpinner } from 'src/pages/profile/SpacedSpinner';

export const FenceAccount = ({ provider: { key, name, expiresAfter, short } }) => {
  // State
  const { fenceStatus: storedFenceStatus } = useStore(authStore);
  const { username, issued_at: issuedAt } = storedFenceStatus[key] ?? { username: undefined, issued_at: undefined };

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
        [
          !username,
          () =>
            div([
              h(FrameworkServiceLink, { button: true, linkText: `Log in to ${short} `, providerKey: key, redirectUrl }),
            ]),
        ],
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
                providerKey: key,
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
