import { Ajax } from 'src/libs/ajax';
import { AbortOption } from 'src/libs/ajax/data-provider-common';
import { azureCookieReadyStore, cookieReadyStore } from 'src/libs/state';

export interface CookieProvider {
  invalidateCookies: (options?: AbortOption) => Promise<void>;
}

export const cookieProvider: CookieProvider = {
  invalidateCookies: async (options: AbortOption = {}) => {
    const { signal } = options;
    // TODO: call azure invalidate cookie once endpoint exists, https://broadworkbench.atlassian.net/browse/IA-3498
    await Ajax(signal).Runtimes.invalidateCookie();

    cookieReadyStore.reset();
    azureCookieReadyStore.reset();
  },
};
