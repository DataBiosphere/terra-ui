import { Ajax } from 'src/libs/ajax';
import { AbortOption } from 'src/libs/ajax/data-provider-common';
import { azureCookieReadyStore, cookieReadyStore } from 'src/libs/state';

export interface CookieProvider {
  invalidateCookies: (options?: AbortOption) => Promise<void>;
}
export const cookieProvider: CookieProvider = {
  invalidateCookies: async (options: AbortOption = {}) => {
    const { signal } = options;
    const cookies: string[] = document.cookie.split(';');
    // TODO: call azure invalidate cookie once endpoint exists, https://broadworkbench.atlassian.net/browse/IA-3498
    await Ajax(signal)
      .Runtimes.invalidateCookie()
      .catch(() => {});
    // Expire all cookies
    cookies.forEach((cookie: string) => {
      // Find an equals sign and uses it to grab the substring of the cookie that is its name
      const eqPos = cookie.indexOf('=');
      const cookieName = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    });

    cookieReadyStore.reset();
    azureCookieReadyStore.reset();
  },
};
