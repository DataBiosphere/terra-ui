import { getConfig } from 'src/libs/config';

export type OAuth2ProviderKey = 'github' | 'ras';
export type OAuth2Callback = 'oauth_callback' | 'ecm-callback';

export type OAuth2Provider = {
  key: OAuth2ProviderKey;
  name: string;
  queryParams: {
    scopes?: string[];
    redirectUri: string;
  };
  supportsAccessToken: boolean;
  supportsIdToken: boolean;
};

const createRedirectUri = (callback: OAuth2Callback) => {
  return `${window.location.hostname === 'localhost' ? getConfig().devUrlRoot : window.location.origin}/${callback}`;
};
export const oauth2Provider = (providerKey: OAuth2ProviderKey): OAuth2Provider => {
  switch (providerKey) {
    case 'github':
      return {
        key: providerKey,
        name: 'GitHub',
        queryParams: {
          redirectUri: createRedirectUri('oauth_callback'),
        },
        supportsAccessToken: true,
        supportsIdToken: false,
      };
    case 'ras':
      return {
        key: providerKey,
        name: 'RAS',
        queryParams: {
          scopes: ['openid', 'email', 'ga4gh_passport_v1'],
          redirectUri: createRedirectUri('ecm-callback'),
        },
        supportsAccessToken: false,
        supportsIdToken: false, // turning off clipboard copying for now.
      };
    default:
      throw new Error(`Unknown OAuth2 provider key: ${providerKey}`);
  }
};
