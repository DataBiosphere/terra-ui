import { Cookies } from 'src/libs/ajax/leonardo/Cookies';
import { azureCookieReadyStore, cookieReadyStore } from 'src/libs/state';

export interface LeoCookieProvider {
  unsetCookies: () => Promise<void>;
}

export const leoCookieProvider: LeoCookieProvider = {
  unsetCookies: async () => {
    // TODO: call azure invalidate cookie once endpoint exists, https://broadworkbench.atlassian.net/browse/IA-3498
    // TODO: use runtime provider here

    await Cookies()
      .unsetCookie()
      .catch((error) => {
        if (error instanceof Response && error.status === 401) {
          console.error('Invalid cookie. This is expected if the token is expired', error);
        } else {
          throw error;
        }
      });

    cookieReadyStore.reset();
    azureCookieReadyStore.reset();
  },
};
