import _ from 'lodash/fp';
import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { processUser, reloadAuthToken } from 'src/libs/auth';
import { useOnMount } from 'src/libs/react-utils';
import { authStore } from 'src/libs/state';

function AuthStoreSetter() {
  const auth = useAuth();

  useOnMount(() => {
    authStore.update(_.set(['authContext'], auth));
  });
  useEffect(() => {
    const cleanupFns = [
      auth.events.addUserLoaded((user) => processUser(user, true)),
      auth.events.addUserUnloaded((user) => processUser(user, false)),
      auth.events.addAccessTokenExpired(() => reloadAuthToken()),
    ];
    return _.over(cleanupFns);
  }, [auth]);

  // Return null because this component doesn't actually render anything.
  // It exists purely for setting up auth state and installing listeners.
  return null;
}

export default AuthStoreSetter;
