import _ from 'lodash/fp';
import { authOpts, fetchOrchestration } from 'src/libs/ajax/ajax-common';

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
