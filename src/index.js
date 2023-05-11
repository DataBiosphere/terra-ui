import 'src/outdated-browser-message';

import { loadedConfigStore } from 'src/configStore';

const loadApp = async () => {
  const res = await fetch(`${import.meta.env.BASE_URL}config.json`);
  loadedConfigStore.current = await res.json();

  import('src/appLoader');
};

const loadOauthRedirect = () => import('src/oauthRedirectLoader');

window.location.pathname.startsWith('/redirect-from-oauth') ? loadOauthRedirect() : loadApp();
