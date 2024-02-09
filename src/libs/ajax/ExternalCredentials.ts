import _ from 'lodash/fp';
import * as qs from 'qs';
import { authOpts, fetchEcm } from 'src/libs/ajax/ajax-common';
import { OAuth2Provider } from 'src/profile/external-identities/OAuth2Providers';

export interface EcmLinkAccountResponse {
  externalUserId: string;
  expirationTimestamp: Date;
  authenticated: boolean;
}
export const ExternalCredentials = (signal?: AbortSignal) => (oAuth2Provider: OAuth2Provider) => {
  const { key: providerKey, queryParams, supportsAccessToken, supportsIdToken } = oAuth2Provider;
  const root = `/api/oidc/v1/${providerKey}`;

  return {
    getAccountLinkStatus: async (): Promise<EcmLinkAccountResponse | undefined> => {
      try {
        const res = await fetchEcm(root, _.merge(authOpts(), { signal }));
        return res.json();
      } catch (error: unknown) {
        if (error instanceof Response && error.status === 404) {
          return undefined;
        }
        throw error;
      }
    },
    getAuthorizationUrl: async (): Promise<string> => {
      const res = await fetchEcm(
        `${root}/authorization-url?${qs.stringify(queryParams, { indices: false })}`,
        _.merge(authOpts(), { signal })
      );
      return res.json();
    },
    linkAccountWithAuthorizationCode: async (oauthcode: string, state: string): Promise<EcmLinkAccountResponse> => {
      const res = await fetchEcm(
        `${root}/oauthcode?${qs.stringify(
          {
            ...queryParams,
            oauthcode,
            state,
          },
          { indices: false }
        )}`,
        _.merge(authOpts(), { signal, method: 'POST' })
      );
      return res.json();
    },
    unlinkAccount: async (): Promise<void> => {
      return fetchEcm(root, _.merge(authOpts(), { signal, method: 'DELETE' }));
    },
    getAccessToken: async (): Promise<string> => {
      if (!supportsAccessToken) {
        throw new Error(`Provider ${providerKey} does not support access tokens`);
      }
      return fetchEcm(`${root}/accessToken`, _.merge(authOpts(), { signal }));
    },
    getIdentityToken: async (): Promise<string> => {
      if (!supportsIdToken) {
        throw new Error(`Provider ${providerKey} does not support identity tokens`);
      }
      const res = await fetchEcm(`${root}/passport`, _.merge(authOpts(), { signal }));
      return res.text();
    },
  };
};
