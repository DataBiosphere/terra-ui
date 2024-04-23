import { AuthTokenState, loadAuthToken } from 'src/auth/auth';
import { OidcUser } from 'src/auth/oidc-broker';
import { Ajax } from 'src/libs/ajax';
import Events from 'src/libs/events';
import { AuthState, authStore, metricStore } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { v4 as uuid } from 'uuid';

export const signIn = async (includeBillingScope = false): Promise<OidcUser> => {
  // Here, we update `userJustSignedIn` to true, so that we that the user became authenticated via the "Sign In" button.
  // This is necessary to differentiate signing in vs reloading or opening a new tab.
  // `userJustSignedIn` is set to false after `doSignInEvents` is called.
  authStore.update((state) => ({ ...state, userJustSignedIn: true }));
  const authTokenState: AuthTokenState = await loadAuthToken({ includeBillingScope, popUp: true });
  if (authTokenState.status === 'success') {
    authStore.update((state) => ({
      ...state,
      hasGcpBillingScopeThroughB2C: includeBillingScope,
    }));
    const sessionId = uuid();
    const sessionStartTime: number = Date.now();
    metricStore.update((state) => ({
      ...state,
      sessionId,
      sessionStartTime,
    }));
    Ajax().Metrics.captureEvent(Events.user.login.success, {
      sessionStartTime: Utils.makeCompleteDate(sessionStartTime),
    });
    return authTokenState.oidcUser;
  }
  if (authTokenState.status === 'expired') {
    Ajax().Metrics.captureEvent(Events.user.login.expired, {});
  } else if (authTokenState.status === 'error') {
    Ajax().Metrics.captureEvent(Events.user.login.error, {});
  }
  throw new Error('Auth token failed to load when signing in');
};
export const userCanNowUseTerra = (oldState: AuthState, state: AuthState) => {
  return (
    // The user was not loaded, and became loaded and is allowed to use the system.
    (oldState.signInStatus !== 'userLoaded' &&
      state.signInStatus === 'userLoaded' &&
      state.terraUserAllowances.allowed) ||
    // The user was loaded and not allowed, but became allowed to use the system
    (oldState.signInStatus === 'userLoaded' &&
      !oldState.terraUserAllowances.allowed &&
      state.signInStatus === 'userLoaded' &&
      state.terraUserAllowances.allowed)
  );
};
export const isNowSignedIn = (oldState: AuthState, state: AuthState) => {
  return oldState.signInStatus !== 'authenticated' && state.signInStatus === 'authenticated';
};
export const isUserInitialized = (state: AuthState): boolean => {
  return state.signInStatus !== 'uninitialized';
};
export const ensureAuthSettled = () => {
  if (isUserInitialized(authStore.get())) {
    return;
  }
  return new Promise((resolve) => {
    const subscription = authStore.subscribe((state) => {
      if (isUserInitialized(state)) {
        resolve(undefined);
        subscription.unsubscribe();
      }
    });
  });
};
