import { ExtraSigninRequestArgs, IdTokenClaims, User, UserManager, WebStorageStateStore } from 'oidc-client-ts';
import { AuthContextProps } from 'react-oidc-context';
import { fetchOrchestration } from 'src/libs/ajax/ajax-common';
import { getLocalStorage } from 'src/libs/browser-storage';
import { getConfig } from 'src/libs/config';
import { oidcStore } from 'src/libs/state';
import * as Utils from 'src/libs/utils';

/*
 This module is for all methods that talk to the oidc client or needed in order to talk to
 the oidc client
 */

export type OidcConfig = {
  authorityEndpoint?: string;
  clientId?: string;
};

export interface OidcUser extends User {
  profile: B2cIdTokenClaims;
}

// Our config for b2C claims are defined here: https://github.com/broadinstitute/terraform-ap-deployments/tree/master/azure/b2c/policies
// The standard b2C claims are defined here: https://learn.microsoft.com/en-us/azure/active-directory/develop/id-token-claims-reference
export interface B2cIdTokenClaims extends IdTokenClaims {
  email_verified?: boolean;
  idp?: string;
  idp_access_token?: string;
  tid?: string;
  ver?: string;
}
export const OAuth2 = (signal?: AbortSignal) => ({
  // This is the first thing that happens on app load.
  initializeClientId: async () => {
    const oidcConfig: OidcConfig = await OAuth2(signal).getConfiguration();
    oidcStore.update((state) => ({ ...state, config: oidcConfig }));
  },
  getConfiguration: async (): Promise<OidcConfig> => {
    // authOpts does not have a token yet since the user has not logged in
    // so this method should not be using authOpts
    const res = await fetchOrchestration('/oauth2/configuration', { signal });
    return res.json();
  },
  // this should only be accessed by auth.ts
  getCurrentAuthToken: async (): Promise<OidcUser | null> => {
    const userManager: UserManager = new UserManager(getOidcConfig());
    return userManager.getUser();
  },
  revokeTokens: async (): Promise<null | void> => {
    // send back auth instance, so we can use it for remove and clear stale state
    const auth: AuthContextProps = getAuthInstance();
    if (auth.settings.metadata?.revocation_endpoint) {
      // revokeTokens can fail if the token has already been revoked.
      // Recover from invalid_token errors to make sure signOut completes successfully.
      try {
        await auth.revokeTokens();
      } catch (e) {
        if ((e as any).error === 'invalid_token') {
          return null;
        }
        throw e;
      } finally {
        await auth.removeUser();
        await auth.clearStaleState();
      }
    }
  },
  signIn: async (popUp: boolean, includeBillingScope: boolean): Promise<OidcUser | null> => {
    const args: ExtraSigninRequestArgs = getSignInArgs(includeBillingScope);
    const authInstance: AuthContextProps = getAuthInstance();
    return popUp
      ? // returns Promise<OidcUser | null>, attempts to use the refresh token to get a new authToken
        authInstance.signinPopup(args)
      : authInstance.signinSilent(args);
  },
});

const getAuthInstance = (): AuthContextProps => {
  const authContext: AuthContextProps | undefined = oidcStore.get().authContext;
  if (authContext === undefined) {
    console.error('getAuthInstance must not be called before authContext is initialized.');
    throw new Error('Error initializing authentication.');
  }
  return authContext;
};
export const getOidcConfig = (orchestrationUrlRoot: string = getConfig().orchestrationUrlRoot) => {
  const metadata = {
    authorization_endpoint: `${orchestrationUrlRoot}/oauth2/authorize`,
    token_endpoint: `${orchestrationUrlRoot}/oauth2/token`,
  };
  return {
    authority: `${orchestrationUrlRoot}/oauth2/authorize`,
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

const getSignInArgs = (includeBillingScope: boolean): ExtraSigninRequestArgs => {
  return Utils.cond(
    [!includeBillingScope, (): ExtraSigninRequestArgs => ({})],
    // For B2C use a dedicated policy endpoint configured for the GCP cloud-billing scope.
    (): ExtraSigninRequestArgs => ({
      extraQueryParams: { access_type: 'offline', p: getConfig().b2cBillingPolicy },
      extraTokenParams: { p: getConfig().b2cBillingPolicy },
    })
  );
};
