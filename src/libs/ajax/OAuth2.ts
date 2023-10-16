import _ from 'lodash/fp';
import { WebStorageStateStore } from 'oidc-client-ts';
import { authOpts, fetchOrchestration } from 'src/libs/ajax/ajax-common';
import { getLocalStorage } from 'src/libs/browser-storage';
import { getConfig } from 'src/libs/config';
import { oidcStore } from 'src/libs/state';

/*
 This module is for all methods that talk to the oidc client or needed in order to talk to
 the oidc client
 */

export type OidcConfig = {
  authorityEndpoint?: string;
  clientId?: string;
};
export const OAuth2 = (signal?: AbortSignal) => ({
  getConfiguration: async (): Promise<OidcConfig> => {
    // authOpts does not have a token yet since the user has not logged in
    // so this method should not be using authOpts
    const res = await fetchOrchestration('/oauth2/configuration', _.merge(authOpts(), { signal }));
    return res.json();
  },
});
export const getOidcConfig = () => {
  const metadata = {
    authorization_endpoint: `${getConfig().orchestrationUrlRoot}/oauth2/authorize`,
    token_endpoint: `${getConfig().orchestrationUrlRoot}/oauth2/token`,
  };
  return {
    authority: `${getConfig().orchestrationUrlRoot}/oauth2/authorize`,
    // The clientId from oidcStore.config is not undefined, setup in initializeClientId on appLoad
    client_id: oidcStore.get().config.clientId!,
    popup_redirect_uri: `${window.origin}/redirect-from-oauth`,
    silent_redirect_uri: `${window.origin}/redirect-from-oauth-silent`,
    metadata,
    prompt: 'consent login',
    scope: 'openid email profile',
    stateStore: new WebStorageStateStore({ store: getLocalStorage() }),
    userStore: new WebStorageStateStore({ store: getLocalStorage() }),
    automaticSilentRenew: true,
    // Leo's setCookie interval is currently 5 min, set refresh auth then 5 min 30 seconds to guarantee that setCookie's token won't expire between 2 setCookie api calls
    accessTokenExpiringNotificationTimeInSeconds: 330,
    includeIdTokenInSilentRenew: true,
    extraQueryParams: { access_type: 'offline' },
    redirect_uri: '', // this field is not being used currently, but is expected from UserManager
  };
};
