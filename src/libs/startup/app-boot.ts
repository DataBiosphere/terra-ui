import { getCurrentLocation } from 'src/libs/nav/location-utils';
import { setLoadedConfigStore } from 'src/libs/startup/configStore';
import { handleOldBrowsers } from 'src/libs/startup/outdated-browser-message';

export const doAppBoot = async () => {
  handleOldBrowsers();

  // This is needed for libraries that assume access to global, as vite does not define global.
  // react-collapse in particular requires this.
  window.global ||= window;

  const loadApp = async () => {
    const [config, buildInfo] = await Promise.all([
      fetch('/config.json').then((r) => r.json()),
      fetch('/build-info.json').then((r) => r.json()),
    ]);
    setLoadedConfigStore({ ...config, ...buildInfo });

    import('src/appLoader');
  };

  const loadOauthRedirect = async () => {
    const { showOAuthRedirect } = await import('src/auth/app-load/oauth-redirect-loader');
    showOAuthRedirect();
  };

  getCurrentLocation().pathname.startsWith('/redirect-from-oauth') ? await loadOauthRedirect() : await loadApp();
};
