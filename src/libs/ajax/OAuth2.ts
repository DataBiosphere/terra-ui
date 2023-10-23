import { fetchOrchestration } from 'src/libs/ajax/ajax-common';

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
    const res = await fetchOrchestration('/oauth2/configuration', { signal });
    return res.json();
  },
});
