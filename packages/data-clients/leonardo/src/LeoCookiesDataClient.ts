import { AbortOption, FetchFn } from '@terra-ui-packages/data-client-core';

export interface LeoCookiesDataClient {
  // TODO support all cookie actions through LeoCookies.
  // Currently only unsetCookie is covered to avoid a circular dependency between signout and auth code.

  // setAzureCookie: (proxyUrl: string, options?: AbortOption) => Promise<void>;
  // setCookie: (options?: AbortOption) => Promise<void>;
  unsetCookie: (options?: AbortOption) => Promise<void>;
}

export interface LeoCookiesDataClientDeps {
  /**
   * fetch function that takes care of desired auth/session mechanics, api endpoint root url prefixing,
   * baseline expected request headers, etc.
   */
  // fetchAuthedLeo: FetchFn;

  /**
   * fetch function that takes care of desired auth/session mechanics, api endpoint root url prefixing,
   * baseline expected request headers, etc. but does not retry if auth fails
   */
  fetchAuthedLeoWithoutRetry: FetchFn;
}

export const makeLeoCookiesDataClient = (deps: LeoCookiesDataClientDeps): LeoCookiesDataClient => {
  const { fetchAuthedLeoWithoutRetry } = deps;

  return {
    // TODO support all cookie actions through LeoCookies.
    // Currently only unsetCookie is covered to avoid a circular dependency between signout and auth code.

    // setAzureCookie: (proxyUrl) => {
    //   return fetchAuthedLeo(`${proxyUrl}/setCookie`, _.merge(authOpts(), { signal, credentials: 'include' }));
    // },

    // setCookie: () => {
    //   return fetchAuthedLeo('proxy/setCookie', _.merge(authOpts(), { signal, credentials: 'include' }));
    // },

    unsetCookie: async (options: AbortOption = {}): Promise<void> => {
      const { signal } = options;
      // No retry: if this request fails for auth reasons, the cookie is already invalid.
      await fetchAuthedLeoWithoutRetry('proxy/invalidateToken', { signal, credentials: 'include' });
    },
  };
};
