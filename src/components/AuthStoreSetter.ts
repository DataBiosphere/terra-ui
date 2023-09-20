import _ from 'lodash/fp';
import { useEffect } from 'react';
import { AuthContextProps, useAuth } from 'react-oidc-context';
import { doUserLoaded, doUserUnloaded, loadAuthToken, OidcUser } from 'src/libs/auth';
import { useOnMount } from 'src/libs/react-utils';
import { authStore } from 'src/libs/state';

function AuthStoreSetter(): null {
  const auth: AuthContextProps = useAuth();

  useOnMount(() => {
    authStore.update(_.set(['authContext'], auth));
  });
  useEffect((): (() => void) => {
    const cleanupFns = [
      auth.events.addUserLoaded((user: OidcUser) => doUserLoaded(user, true)),
      auth.events.addUserUnloaded(() => doUserUnloaded()),
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
