import { initializeAuthUser } from 'src/auth/app-load/init-auth';
import { OidcUser } from 'src/auth/oidc-broker';
import { fetchOk } from 'src/libs/ajax/fetch/fetch-core';
import { withErrorReporting } from 'src/libs/error';
import { authStore, oidcStore, userStore } from 'src/libs/state';

interface GoogleUserInfo {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
  locale: string;
  hd: string;
}

export const initAuthTesting = () => {
  // This is intended for integration tests to short circuit the login flow
  window.forceSignIn = withErrorReporting('Error forcing sign in')(async (token) => {
    await initializeAuthUser(); // don't want this clobbered when real auth initializes
    const res = await fetchOk('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data: GoogleUserInfo = await res.json();
    oidcStore.update((state) => ({
      ...state,
      user: {
        ...data,
        access_token: token,
      } as unknown as OidcUser,
    }));
    authStore.update((state) => ({
      ...state,
      signInStatus: 'authenticated',
      isTimeoutEnabled: undefined,
      cookiesAccepted: true,
    }));
    userStore.update((state) => ({
      ...state,
      terraUser: {
        token,
        id: data.sub,
        email: data.email,
        name: data.name,
        givenName: data.given_name,
        familyName: data.family_name,
        imageUrl: data.picture,
      },
    }));
  });
};
