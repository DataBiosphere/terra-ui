import _ from 'lodash/fp';
import { useEffect } from 'react';
import { AuthContextProps, useAuth } from 'react-oidc-context';
import { doUserLoaded, loadAuthToken, OidcUser } from 'src/libs/auth';
import { useOnMount } from 'src/libs/react-utils';
import { oidcStore } from 'src/libs/state';

function AuthStoreSetter(): null {
  // When the AuthContext changes, this component will reload
  const auth: AuthContextProps = useAuth();

  useOnMount(() => {
    oidcStore.update(_.set(['authContext'], auth));
  });
  useEffect((): (() => void) => {
    const cleanupFns = [
      // add{EVENT_NAME} will add this callback to this event
      // ex: will add doUserLoaded to the userLoadedEvent
      // load event called in the following fns https://github.com/authts/oidc-client-ts/blob/main/src/UserManager.ts
      auth.events.addUserLoaded((user: OidcUser) => {
        doUserLoaded(user);
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
