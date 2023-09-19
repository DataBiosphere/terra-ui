import _ from 'lodash/fp';
import { User } from 'oidc-client-ts';
import { useEffect } from 'react';
import { AuthContextProps, useAuth } from 'react-oidc-context';
import { loadAuthToken, processUser } from 'src/libs/auth';
import { useOnMount } from 'src/libs/react-utils';
import { authStore, getOidcUser } from 'src/libs/state';

function AuthStoreSetter(): null {
  const auth: AuthContextProps = useAuth();

  useOnMount((): void => {
    authStore.update(_.set(['authContext'], auth));
  });
  useEffect(() => {
    const cleanupFns = [
      auth.events.addUserLoaded((user: User) => processUser(user, true)),
      auth.events.addUserUnloaded((): void => {
        const oidcUser: User | undefined = getOidcUser();
        if (oidcUser !== undefined) {
          processUser(oidcUser, false);
        } else {
          console.error('addUserUnloaded did not have a defined user');
        }
      }),
      auth.events.addAccessTokenExpired((): void => {
        loadAuthToken();
      }),
    ];
    _.over(cleanupFns);
  }, [auth]);

  // Return null because this component doesn't actually render anything.
  // It exists purely for setting up auth state and installing listeners.
  return null;
}

export default AuthStoreSetter;
