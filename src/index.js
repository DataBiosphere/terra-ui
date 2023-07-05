import 'src/outdated-browser-message';

import { loadedConfigStore } from 'src/configStore';

const loadApp = async () => {
  const res = await fetch('/config.json');
  loadedConfigStore.current = await res.json();

  import('src/appLoader');
};

const loadOauthRedirect = () => import('src/oauthRedirectLoader');

window.location.pathname.startsWith('/redirect-from-oauth') ? loadOauthRedirect() : loadApp();

// This is needed for libraries that assume access to global, as vite does not define globla.
// react-collapse in particular requires this.
window.global ||= window;
