import { Ajax } from 'src/libs/ajax';
import { azureCookieReadyStore, cookieReadyStore } from 'src/libs/state';

export interface LeoCookieProvider {
  invalidateCookies: () => Promise<void>;
}

export const leoCookieProvider: LeoCookieProvider = {
  invalidateCookies: async () => {
    // TODO: call azure invalidate cookie once endpoint exists, https://broadworkbench.atlassian.net/browse/IA-3498
    // TODO: use runtime provider here

    try {
      await Ajax().Runtimes.invalidateCookie();
    } catch (error) {
      if (error instanceof Response && error.status === 401) {
        console.error('in error block for invalid cookie. This is expected if the token is expired', error);
      } else {
        throw error;
      }
    }

    cookieReadyStore.reset();
    azureCookieReadyStore.reset();
  },
};
