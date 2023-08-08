import 'src/outdated-browser-message';

import { loadedConfigStore } from 'src/configStore';

const loadApp = async () => {
  const [config, buildInfo] = await Promise.all([fetch('/config.json').then((r) => r.json()), fetch('/build-info.json').then((r) => r.json())]);
  loadedConfigStore.current = { ...config, ...buildInfo };

  import('src/appLoader');
};

const loadOauthRedirect = () => import('src/oauthRedirectLoader');

window.location.pathname.startsWith('/redirect-from-oauth') ? loadOauthRedirect() : loadApp();

// This is needed for libraries that assume access to global, as vite does not define global.
// react-collapse in particular requires this.
window.global ||= window;
