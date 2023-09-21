import _ from 'lodash/fp';
import { useEffect } from 'react';
import { AuthContextProps, useAuth } from 'react-oidc-context';
import { doUserLoaded, doUserUnloaded, loadAuthToken, OidcUser } from 'src/libs/auth';
import { useOnMount } from 'src/libs/react-utils';
import { authStore } from 'src/libs/state';

function AuthStoreSetter(): null {
  const auth: AuthContextProps = useAuth();

  useOnMount(() => {
    // TODO: determine if this is the only thing which is updated in authStore
    //  before initialize auth
    authStore.update(_.set(['authContext'], auth));
  });
  useEffect((): (() => void) => {
    const cleanupFns = [
      // add[eventname] will add this callback to this event
      // ex: will add doUserLoaded to the userLoadedEvent
      // load event called in the following fns https://github.com/authts/oidc-client-ts/blob/main/src/UserManager.ts#L643
      // this isn't only called during a sign in?
      auth.events.addUserLoaded((user: OidcUser) => {
        // console.log('Calling userLoaded event...');
        doUserLoaded(user, true);
      }),
      // this should only be called on removeUser in UserManager (oidc)
      auth.events.addUserUnloaded(() => {
        // console.log('Calling userUnloaded event...');
        doUserUnloaded();
      }),
      auth.events.addAccessTokenExpired((): void => {
        // console.log('Calling accessTokenExpired event...');
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
