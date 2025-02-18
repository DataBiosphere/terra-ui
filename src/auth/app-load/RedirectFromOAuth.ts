import { UserManager } from 'oidc-client-ts';
import React from 'react';
import { div, img } from 'react-hyperscript-helpers';
import { getOidcConfig } from 'src/auth/oidc-broker';
import { getCurrentLocation } from 'src/libs/nav/location-utils';
import { useOnMount } from 'src/libs/react-utils';

export const RedirectFromOAuth: React.FC = (): React.ReactNode => {
  const userManager: UserManager = new UserManager(getOidcConfig());

  const url = getCurrentLocation().href;
  const isSilent = getCurrentLocation().pathname.startsWith('/redirect-from-oauth-silent');
  useOnMount(() => {
    if (isSilent) {
      userManager.signinSilentCallback(url);
    } else {
      userManager.signinPopupCallback(url);
    }
  });

  const spinnerSize = 54;
  return div({ role: 'main', style: { position: 'absolute', top: 0, left: 0, height: '100%', width: '100%' } }, [
    img({
      src: 'loading-spinner.svg',
      style: {
        width: spinnerSize,
        height: spinnerSize,
        display: 'block',
        position: 'sticky',
        top: `calc(50% - ${spinnerSize / 2}px)`,
        bottom: `calc(50% - ${spinnerSize / 2}px)`,
        left: `calc(50% - ${spinnerSize / 2}px)`,
        right: `calc(50% - ${spinnerSize / 2}px)`,
      },
    }),
  ]);
};
