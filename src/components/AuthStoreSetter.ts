import _ from 'lodash/fp';
import { useEffect } from 'react';
import { AuthContextProps, useAuth } from 'react-oidc-context';
import { OidcUser } from 'src/libs/ajax/OAuth2';
import { loadAuthToken, loadOidcUser } from 'src/libs/auth';
import { useOnMount } from 'src/libs/react-utils';
import { oidcStore } from 'src/libs/state';

function AuthStoreSetter(): null {
  // When the AuthContext changes, this component will rerender
  const auth: AuthContextProps = useAuth();

  useOnMount(() => {
    oidcStore.update(_.set(['authContext'], auth));
  });
  useEffect((): (() => void) => {
    const cleanupFns = [
      // Subscribe to UserManager events.
      // For details of each event, see https://authts.github.io/oidc-client-ts/classes/UserManagerEvents.html
      auth.events.addUserLoaded((user: OidcUser) => {
        loadOidcUser(user);
      }),
      auth.events.addAccessTokenExpiring((): void => {
        loadAuthToken();
      }),
      auth.events.addAccessTokenExpired((): void => {
        loadAuthToken();
      }),
    ];
    return (): void => {
      cleanupFns.forEach((fn) => {
        fn();
      });
    };
  }, [auth]);

  // Return null because this component doesn't actually render anything.
  // It exists purely for setting up auth state and installing listeners.
  return null;
}

export default AuthStoreSetter;
