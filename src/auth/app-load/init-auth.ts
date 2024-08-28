import _ from 'lodash/fp';
import { cookiesAcceptedKey } from 'src/auth/accept-cookies';
import { loadOidcUser } from 'src/auth/auth';
import { getCurrentOidcUser, initializeOidcUserManager, OidcUser } from 'src/auth/oidc-broker';
import { loadTerraUser } from 'src/auth/user-profile/user';
import { ExternalCredentials } from 'src/libs/ajax/ExternalCredentials';
import { Groups } from 'src/libs/ajax/Groups';
import { User } from 'src/libs/ajax/User';
import { withErrorReporting } from 'src/libs/error';
import * as Nav from 'src/libs/nav';
import { getLocalPref, setLocalPref } from 'src/libs/prefs';
import {
  asyncImportJobStore,
  AuthState,
  authStore,
  requesterPaysProjectStore,
  workspacesStore,
  workspaceStore,
} from 'src/libs/state';
import { allOAuth2Providers } from 'src/profile/external-identities/OAuth2Providers';

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

const isNowSignedIn = (oldState: AuthState, state: AuthState) => {
  return oldState.signInStatus !== 'authenticated' && state.signInStatus === 'authenticated';
};

export const initializeAuthListeners = () => {
  authStore.subscribe((state: AuthState) => {
    // We can't guarantee that someone reopening the window is the same user,
    // so we should not persist cookie acceptance across sessions for people signed out
    // Per compliance recommendation, we could probably persist through a session, but
    // that would require a second store in session storage instead of local storage
    if (state.signInStatus === 'userLoaded' && state.cookiesAccepted !== getLocalPref(cookiesAcceptedKey)) {
      setLocalPref(cookiesAcceptedKey, state.cookiesAccepted);
    }
  });

  authStore.subscribe(
    withErrorReporting('Error checking groups for timeout status')(async (state: AuthState, oldState: AuthState) => {
      if (userCanNowUseTerra(oldState, state)) {
        const isTimeoutEnabled = _.some({ groupName: 'session_timeout' }, await Groups().list());
        authStore.update((state) => ({ ...state, isTimeoutEnabled }));
      }
    })
  );

  const doSignInEvents = (state: AuthState) => {
    if (state.termsOfService.isCurrentVersion === false) {
      // The user could theoretically navigate away from the Terms of Service page during the Rolling Acceptance Window.
      // This is not a concern, since the user will be denied access to the system once the Rolling Acceptance Window ends.
      // This is really just a convenience to make sure the user is not disrupted once the Rolling Acceptance Window ends.
      Nav.goToPath('terms-of-service');
    }
  };

  authStore.subscribe(
    withErrorReporting('Error loading user')(async (state: AuthState, oldState: AuthState) => {
      if (isNowSignedIn(oldState, state)) {
        await loadTerraUser();
        if (state.userJustSignedIn) {
          const loadedState = authStore.get();
          doSignInEvents(loadedState);
          authStore.update((state: AuthState) => ({ ...state, userJustSignedIn: false }));
        }
      }
    })
  );

  authStore.subscribe(
    withErrorReporting('Error loading NIH account link status')(async (state: AuthState, oldState: AuthState) => {
      if (userCanNowUseTerra(oldState, state)) {
        const nihStatus = await User().getNihStatus();
        authStore.update((state: AuthState) => ({ ...state, nihStatus, nihStatusLoaded: true }));
      }
    })
  );

  authStore.subscribe(
    withErrorReporting('Error loading OAuth2 account status')(async (state: AuthState, oldState: AuthState) => {
      if (userCanNowUseTerra(oldState, state)) {
        await Promise.all(
          _.map(async (provider) => {
            const status = await ExternalCredentials()(provider).getAccountLinkStatus();
            authStore.update(_.set(['oAuth2AccountStatus', provider.key], status));
          }, allOAuth2Providers)
        );
      }
    })
  );

  authStore.subscribe((state: AuthState, oldState: AuthState) => {
    const isSignedOut = state.signInStatus === 'signedOut';
    const wasSignedIn = oldState.signInStatus !== 'signedOut';
    if (wasSignedIn && isSignedOut) {
      workspaceStore.reset();
      workspacesStore.reset();
      asyncImportJobStore.reset();
      window.Appcues?.reset();
    }
  });

  workspaceStore.subscribe((newState, oldState) => {
    const getWorkspaceId = (ws) => ws?.workspace.workspaceId;
    if (getWorkspaceId(newState) !== getWorkspaceId(oldState)) {
      requesterPaysProjectStore.reset();
    }
  });
};

// this function is only called when the browser refreshes
export const initializeAuthUser = _.memoize(async (): Promise<void> => {
  initializeOidcUserManager();
  const setSignedOut = () =>
    authStore.update((state) => ({
      ...state,
      signInStatus: 'signedOut',
    }));
  try {
    const initialOidcUser: OidcUser | null = await getCurrentOidcUser();
    if (initialOidcUser !== null) {
      loadOidcUser(initialOidcUser);
    } else {
      setSignedOut();
    }
  } catch (e) {
    console.error('Error in contacting oidc-client');
    setSignedOut();
    throw new Error('Failed to initialize auth.');
  }
});
