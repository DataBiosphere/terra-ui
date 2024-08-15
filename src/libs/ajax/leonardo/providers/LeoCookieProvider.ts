import { LeoCookies } from 'src/libs/ajax/leonardo/LeoCookies';
import { azureCookieReadyStore, cookieReadyStore } from 'src/libs/state';

export interface LeoCookieProvider {
  unsetCookies: () => Promise<void>;
}

export const leoCookieProvider: LeoCookieProvider = {
  unsetCookies: async () => {
    // TODO: call azure invalidate cookie once endpoint exists, https://broadworkbench.atlassian.net/browse/IA-3498

    await LeoCookies()
      .unsetCookie()
      .catch((error) => {
        // Suppress errors thrown by unsetCookie; if the call fails for auth or CORS reasons signout logic should proceed
        if (error instanceof Response && error.status === 401) {
          // Ignore: user already logged out
        } else {
          console.error('Unexpected error unsetting user cookie', error);
        }
      });

    cookieReadyStore.reset();
    azureCookieReadyStore.reset();
  },
};
