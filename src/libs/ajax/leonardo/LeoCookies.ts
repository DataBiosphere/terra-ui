import { LeoCookiesDataClient, makeLeoCookiesDataClient } from '@terra-ui-packages/leonardo-data-client';
import { withAuthSession } from 'src/auth/auth-session';
import { fetchLeoWithoutAuthRetry } from 'src/libs/ajax/fetch/fetchLeoWithoutAuthRetry';

const makeCookiesHelper = (deps: CookiesHelperDeps) => (signal?: AbortSignal) => {
  const { api } = deps;

  const cookiesHelper = {
    // TODO support all cookie actions through LeoCookies.
    // Currently only unsetCookie is covered to avoid a circular dependency between signout and auth code.

    // setAzureCookie: async (proxyUrl: string): Promise<void> => {
    //   await api.setAzureCookie(proxyUrl);
    // },
    // setCookie: async (): Promise<void> => {
    //   await api.setCookie();
    // },
    unsetCookie: async (): Promise<void> => {
      await api.unsetCookie({ signal });
    },
  };

  return cookiesHelper;
};

type CookiesHelperDeps = {
  api: LeoCookiesDataClient;
};

export const LeoCookies = makeCookiesHelper({
  api: makeLeoCookiesDataClient({
    // fetchAuthedLeo: withAuthSession(withAppIdentifier(fetchLeo)),
    fetchAuthedLeoWithoutRetry: withAuthSession(fetchLeoWithoutAuthRetry),
  }),
});

export type LeoCookiesContract = ReturnType<typeof LeoCookies>;
