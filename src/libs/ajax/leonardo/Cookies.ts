import { withAuthSession } from 'src/auth/auth-options';
import { fetchLeoOnce } from 'src/libs/ajax/fetch/fetchLeoOnce';

import { LeoCookiesDataClient, makeLeoCookiesDataClient } from './LeoCookiesDataClient';

const makeCookiesHelper = (deps: CookiesHelperDeps) => (signal?: AbortSignal) => {
  const { api } = deps;

  const cookiesHelper = {
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

export const Cookies = makeCookiesHelper({
  api: makeLeoCookiesDataClient({
    // fetchAuthedLeo: withAuthSession(withAppIdentifier(fetchLeo)),
    fetchAuthedLeoWithoutRetry: withAuthSession(fetchLeoOnce),
  }),
});

export type CookiesDataClientContract = ReturnType<typeof Cookies>;
