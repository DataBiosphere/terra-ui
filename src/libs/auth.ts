import { DEFAULT, switchCase } from '@terra-ui-packages/core-utils';
import { parseJSON } from 'date-fns/fp';
import jwtDecode, { JwtPayload } from 'jwt-decode';
import _ from 'lodash/fp';
import { sessionTimedOutErrorMessage } from 'src/auth/auth-errors';
import { cookiesAcceptedKey } from 'src/components/CookieWarning';
import { Ajax } from 'src/libs/ajax';
import { fetchOk } from 'src/libs/ajax/ajax-common';
import { B2cIdTokenClaims, OidcUser } from 'src/libs/ajax/OAuth2';
import { getSessionStorage } from 'src/libs/browser-storage';
import { withErrorIgnoring, withErrorReporting } from 'src/libs/error';
import Events, { captureAppcuesEvent, MetricsEventName } from 'src/libs/events';
import { clearNotification, notify, sessionTimeoutProps } from 'src/libs/notifications';
import { getLocalPref, getLocalPrefForUserId, setLocalPref } from 'src/libs/prefs';
import allProviders from 'src/libs/providers';
import {
  asyncImportJobStore,
  AuthState,
  authStore,
  azureCookieReadyStore,
  azurePreviewStore,
  cookieReadyStore,
  getTerraUser,
  oidcStore,
  requesterPaysProjectStore,
  TerraUserProfile,
  TerraUserRegistrationStatus,
  TokenMetadata,
  workspacesStore,
  workspaceStore,
} from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { v4 as uuid } from 'uuid';

export const getAuthToken = (): string | undefined => {
  const oidcUser: OidcUser | undefined = oidcStore.get().user;
  if (oidcUser !== undefined) {
    return oidcUser.access_token;
  }
  return undefined;
};

export type SignOutCause =
  | 'requested'
  | 'disabled'
  | 'declinedTos'
  | 'expiredRefreshToken'
  | 'errorRefreshingAuthToken'
  | 'idleStatusMonitor'
  | 'unspecified';

const sendSignOutMetrics = async (cause: SignOutCause): Promise<void> => {
  const eventToFire: MetricsEventName = switchCase<SignOutCause, MetricsEventName>(
    cause,
    ['requested', () => Events.user.signOut.requested],
    ['disabled', () => Events.user.signOut.disabled],
    ['declinedTos', () => Events.user.signOut.declinedTos],
    ['expiredRefreshToken', () => Events.user.signOut.expiredRefreshToken],
    ['errorRefreshingAuthToken', () => Events.user.signOut.errorRefreshingAuthToken],
    ['idleStatusMonitor', () => Events.user.signOut.idleStatusMonitor],
    ['unspecified', () => Events.user.signOut.unspecified],
    [DEFAULT, () => Events.user.signOut.unspecified]
  );
  const sessionEndTime: number = Date.now();
  const authStoreState: AuthState = authStore.get();
  const tokenMetadata: TokenMetadata = authStoreState.authTokenMetadata;

  await Ajax().Metrics.captureEvent(eventToFire, {
    sessionEndTime: Utils.makeCompleteDate(sessionEndTime),
    sessionDurationInSeconds:
      authStoreState.sessionStartTime < 0 ? undefined : (sessionEndTime - authStoreState.sessionStartTime) / 1000.0,
    authTokenCreatedAt: getTimestampMetricLabel(tokenMetadata.createdAt),
    authTokenExpiresAt: getTimestampMetricLabel(tokenMetadata.expiresAt),
    totalAuthTokensUsedThisSession: authStoreState.authTokenMetadata.totalTokensUsedThisSession,
    totalAuthTokenLoadAttemptsThisSession: authStoreState.authTokenMetadata.totalTokenLoadAttemptsThisSession,
  });
};

export const signOut = (cause: SignOutCause = 'unspecified'): void => {
  sendSignOutMetrics(cause);
  if (cause === 'expiredRefreshToken' || cause === 'errorRefreshingAuthToken') {
    notify('info', sessionTimedOutErrorMessage, sessionTimeoutProps);
  }
  // TODO: invalidate runtime cookies https://broadworkbench.atlassian.net/browse/IA-3498
  cookieReadyStore.reset();
  azureCookieReadyStore.reset();
  getSessionStorage().clear();
  azurePreviewStore.set(false);

  Ajax().OAuth2.revokeTokens();

  const cookiesAccepted: boolean | undefined = authStore.get().cookiesAccepted;
  authStore.reset();
  authStore.update((state) => ({
    ...state,
    signInStatus: 'signedOut',
    // TODO: If allowed, this should be moved to the cookie store
    // Load whether a user has input a cookie acceptance in a previous session on this system,
    // or whether they input cookie acceptance previously in this session
    cookiesAccepted,
  }));
  oidcStore.update((state) => ({
    ...state,
    user: undefined,
  }));
};

export const signIn = async (includeBillingScope = false): Promise<OidcUser> => {
  // we should handle if we get back null or false here (if loading the authTokenFails)
  const authTokenState: AuthTokenState = await loadAuthToken(includeBillingScope, true);
  if (authTokenState.status === 'success') {
    const sessionId = uuid();
    const sessionStartTime: number = Date.now();
    authStore.update((state) => ({
      ...state,
      hasGcpBillingScopeThroughB2C: includeBillingScope,
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

export interface AuthTokenSuccessState {
  status: 'success';
  oidcUser: OidcUser;
}

export interface AuthTokenExpiredState {
  status: 'expired';
}
export interface AuthTokenErrorState {
  status: 'error';
  reason: any; // Promise rejection reason
  userErrorMsg: string;
  internalErrorMsg: string;
}

export type AuthTokenState = AuthTokenSuccessState | AuthTokenExpiredState | AuthTokenErrorState;

/**
 * Attempts to load an auth token.
 * When token is successfully loaded, returns an AuthTokenSuccessState.
 * When token fails to load because of an expired refresh token, returns an AuthTokenExpiredState
 * When tokens fails to load because of an error, returns an AuthTokenErrorState
 * @param includeBillingScope
 * @param popUp whether signIn is attempted with a popup, or silently in the background.
 */
export const loadAuthToken = async (includeBillingScope = false, popUp = false): Promise<AuthTokenState> => {
  const oldAuthTokenMetadata: TokenMetadata = authStore.get().authTokenMetadata;
  const oldRefreshTokenMetadata: TokenMetadata = authStore.get().refreshTokenMetadata;

  // for metrics, updates number of authToken load attempts for this session
  authStore.update((state) => ({
    ...state,
    authTokenMetadata: {
      ...oldAuthTokenMetadata,
      totalTokenLoadAttemptsThisSession: authStore.get().authTokenMetadata.totalTokenLoadAttemptsThisSession + 1,
    },
  }));

  const loadedAuthTokenState: AuthTokenState = await tryLoadAuthToken(includeBillingScope, popUp);
  oidcStore.update((state) => ({
    ...state,
    authTokenState: loadedAuthTokenState,
  }));
  if (loadedAuthTokenState.status === 'success') {
    const oidcUser: OidcUser = loadedAuthTokenState.oidcUser;
    oidcStore.update((state) => ({
      ...state,
      user: oidcUser,
    }));
    const oidcUserJWT: string = oidcUser.id_token!;
    const decodedJWT: JwtPayload = jwtDecode<JwtPayload>(oidcUserJWT);
    const authTokenCreatedAt: number = (decodedJWT as any).auth_time; // time in seconds when authorization token was created
    const authTokenExpiresAt: number = oidcUser.expires_at!; // time in seconds when authorization token expires, as given by the oidc client
    const authTokenId: string = uuid();
    const jwtExpiresAt: number = (decodedJWT as any).exp; // time in seconds when the JWT expires, after which the JWT should not be read from
    const refreshToken: string | undefined = oidcUser.refresh_token;
    // for future might want to take refresh token and hash it to compare to a saved hashed token to see if they are the same
    const isNewRefreshToken = !!refreshToken && refreshToken !== oldRefreshTokenMetadata.token;

    // for metrics, updates authToken metadata and refresh token metadata
    authStore.update((state) => ({
      ...state,
      authTokenMetadata: {
        ...authStore.get().authTokenMetadata,
        token: oidcUser.access_token,
        createdAt: authTokenCreatedAt,
        expiresAt: authTokenExpiresAt,
        id: authTokenId,
        totalTokensUsedThisSession:
          oldAuthTokenMetadata.token !== undefined &&
          oldAuthTokenMetadata.token === authStore.get().authTokenMetadata.token
            ? oldAuthTokenMetadata.totalTokensUsedThisSession
            : oldAuthTokenMetadata.totalTokensUsedThisSession + 1,
      },
      refreshTokenMetadata: isNewRefreshToken
        ? {
            ...authStore.get().refreshTokenMetadata,
            id: uuid(),
            token: refreshToken,
            createdAt: authTokenCreatedAt,
            // Auth token expiration is set to 24 hours in B2C configuration.
            expiresAt: authTokenCreatedAt + 86400, // 24 hours in seconds
            totalTokensUsedThisSession: authStore.get().authTokenMetadata.totalTokensUsedThisSession + 1,
            totalTokenLoadAttemptsThisSession: authStore.get().authTokenMetadata.totalTokenLoadAttemptsThisSession + 1,
          }
        : { ...authStore.get().refreshTokenMetadata },
    }));
    Ajax().Metrics.captureEvent(Events.user.authTokenLoad.success, {
      authProvider: oidcUser.profile.idp,
      ...getOldAuthTokenLabels(oldAuthTokenMetadata),
      authTokenCreatedAt: getTimestampMetricLabel(authTokenCreatedAt),
      authTokenExpiresAt: getTimestampMetricLabel(authTokenExpiresAt),
      authTokenId,
      refreshTokenId: authStore.get().refreshTokenMetadata.id,
      refreshTokenCreatedAt: getTimestampMetricLabel(authStore.get().refreshTokenMetadata.createdAt),
      refreshTokenExpiresAt: getTimestampMetricLabel(authStore.get().refreshTokenMetadata.expiresAt),
      jwtExpiresAt: getTimestampMetricLabel(jwtExpiresAt),
    });
  } else if (loadedAuthTokenState.status === 'expired') {
    Ajax().Metrics.captureEvent(Events.user.authTokenLoad.expired, {
      ...getOldAuthTokenLabels(oldAuthTokenMetadata),
      refreshTokenId: authStore.get().refreshTokenMetadata.id,
      refreshTokenCreatedAt: getTimestampMetricLabel(authStore.get().refreshTokenMetadata.createdAt),
      refreshTokenExpiresAt: getTimestampMetricLabel(authStore.get().refreshTokenMetadata.expiresAt),
    });
  } else {
    Ajax().Metrics.captureEvent(Events.user.authTokenLoad.error, {
      // we could potentially log the reason, but I don't know if that data is safe to log
      ...getOldAuthTokenLabels(oldAuthTokenMetadata),
      refreshTokenId: authStore.get().refreshTokenMetadata.id,
      refreshTokenCreatedAt: getTimestampMetricLabel(authStore.get().refreshTokenMetadata.createdAt),
      refreshTokenExpiresAt: getTimestampMetricLabel(authStore.get().refreshTokenMetadata.expiresAt),
    });
  }
  return loadedAuthTokenState;
};

const tryLoadAuthToken = async (includeBillingScope = false, popUp = false): Promise<AuthTokenState> => {
  try {
    const loadedAuthTokenResponse: OidcUser | null = await Ajax().OAuth2.signIn(popUp, includeBillingScope);

    if (loadedAuthTokenResponse === null) {
      return {
        status: 'expired',
      };
    }

    return {
      status: 'success',
      oidcUser: loadedAuthTokenResponse,
    };
  } catch (e) {
    const userErrorMsg = 'Unable to sign in.';
    const internalErrorMsg = 'An unexpected exception occurred while attempting to load new auth token.';
    console.error(`user error message: ${userErrorMsg}`);
    console.error(`internal error message: ${internalErrorMsg}`);
    console.error(`reason: ${e}`);
    return {
      internalErrorMsg,
      userErrorMsg,
      reason: e,
      status: 'error',
    };
  }
};

const getOldAuthTokenLabels = (oldAuthTokenMetadata: TokenMetadata) => {
  return {
    oldAuthTokenCreatedAt: getTimestampMetricLabel(oldAuthTokenMetadata.createdAt),
    oldAuthTokenExpiresAt: getTimestampMetricLabel(oldAuthTokenMetadata.expiresAt),
    oldAuthTokenId: oldAuthTokenMetadata.id,
    oldAuthTokenLifespan:
      oldAuthTokenMetadata.createdAt < 0 ? undefined : Date.now() - oldAuthTokenMetadata.createdAt / 1000.0,
  };
};
const getTimestampMetricLabel = (timestamp: number): string | undefined => {
  return timestamp < 0 ? undefined : Utils.formatTimestampInSeconds(timestamp);
};

export const hasBillingScope = (): boolean => authStore.get().hasGcpBillingScopeThroughB2C === true;

/*
 * Tries to obtain Google Cloud Billing scope silently.

 * This will succeed if the user previously granted the scope for the application, and fail otherwise.
 * Call `ensureBillingScope` to generate a pop-up to prompt the user to grant the scope if needed.
 */
export const tryBillingScope = async () => {
  if (!hasBillingScope()) {
    await loadAuthToken(true);
  }
};

/*
 * Request Google Cloud Billing scope if necessary.
 *
 * NOTE: Requesting additional scopes may invoke a browser pop-up which the browser might block.
 * If you use ensureBillingScope during page load and the pop-up is blocked, a rejected promise will
 * be returned. In this case, you'll need to provide something for the user to deliberately click on
 * and retry ensureBillingScope in reaction to the click.
 */
export const ensureBillingScope = async () => {
  if (!hasBillingScope()) {
    await signIn(true);
  }
};

const becameRegistered = (oldState: AuthState, state: AuthState) => {
  return oldState.registrationStatus !== 'registered' && state.registrationStatus === 'registered';
};

const isNowSignedIn = (oldState: AuthState, state: AuthState) => {
  return oldState.signInStatus !== 'signedIn' && state.signInStatus === 'signedIn';
};

export const isAuthSettled = (state: AuthState) => {
  return (
    state.signInStatus !== 'uninitialized' &&
    (state.signInStatus !== 'signedIn' || state.registrationStatus !== 'uninitialized')
  );
};

export const ensureAuthSettled = () => {
  if (isAuthSettled(authStore.get())) {
    return;
  }
  return new Promise((resolve) => {
    const subscription = authStore.subscribe((state) => {
      if (isAuthSettled(state)) {
        resolve(undefined);
        subscription.unsubscribe();
      }
    });
  });
};

export const bucketBrowserUrl = (id) => {
  return `https://console.cloud.google.com/storage/browser/${id}?authuser=${getTerraUser().email}`;
};

/*
 * Specifies whether the user has logged in via the Azure identity provider.
 */
export const isAzureUser = (): boolean => {
  return _.startsWith('https://login.microsoftonline.com', getTerraUser().idp!);
};

export const loadOidcUser = (user: OidcUser): void => {
  oidcStore.update((state) => ({ ...state, user }));
  authStore.update((state) => {
    const tokenClaims: B2cIdTokenClaims = user.profile;
    // according to IdTokenClaims, this is a mandatory claim and should always exist
    // should be googleSubjectId or b2cId depending on how they authenticated
    const userId: string = tokenClaims.sub;
    return {
      ...state,
      signInStatus: 'signedIn',
      // Load whether a user has input a cookie acceptance in a previous session on this system,
      // or whether they input cookie acceptance previously in this session
      cookiesAccepted: state.cookiesAccepted || getLocalPrefForUserId(userId, cookiesAcceptedKey),
      terraUser: {
        token: user.access_token,
        scope: user.scope,
        id: userId,
        email: tokenClaims.email,
        name: tokenClaims.name,
        givenName: tokenClaims.given_name,
        familyName: tokenClaims.family_name,
        imageUrl: tokenClaims.picture,
        idp: tokenClaims.idp,
      },
    };
  });
};

// this function is only called when the browser refreshes
export const initializeAuth = _.memoize(async (): Promise<void> => {
  const setSignedOut = () =>
    authStore.update((state) => ({
      ...state,
      signInStatus: 'signedOut',
    }));
  try {
    // Instantiate a UserManager directly to populate the logged-in user at app initialization time.
    // All other auth usage should use the AuthContext from oidcStore.
    const initialOidcUser: OidcUser | null = await Ajax().OAuth2.getCurrentAuthToken();
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

// This is intended for integration tests to short circuit the login flow

window.forceSignIn = withErrorReporting('Error forcing sign in', async (token) => {
  await initializeAuth(); // don't want this clobbered when real auth initializes
  const res = await fetchOk('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  // eslint-disable-next-line
  console.log(JSON.stringify(data)); // just to test for what these claims are
  // oidcStore.update((state) => ({ ...state, user: data as OidcUser }));
  authStore.update((state) => {
    return {
      ...state,
      signInStatus: 'signedIn',
      registrationStatus: 'uninitialized',
      isTimeoutEnabled: undefined,
      cookiesAccepted: true,
      terraUser: {
        token,
        id: data.sub,
        email: data.email,
        name: data.name,
        givenName: data.given_name,
        familyName: data.family_name,
        imageUrl: data.picture,
      },
    };
  });
});

authStore.subscribe(
  withErrorReporting('Error checking registration', async (state: AuthState, oldState: AuthState) => {
    const getRegistrationStatus = async (): Promise<TerraUserRegistrationStatus> => {
      try {
        const { enabled } = await Ajax().User.getStatus();
        if (enabled) {
          // When Terra is first loaded, termsOfService.permitsSystemUsage will be undefined while the user's ToS status is fetched from Sam
          return state.termsOfService.permitsSystemUsage ? 'registered' : 'registeredWithoutTos';
        }
        return 'disabled';
      } catch (error) {
        if ((error as Response).status === 404) {
          return 'unregistered';
        }
        throw error;
      }
    };
    const canNowUseSystem =
      !oldState.termsOfService.permitsSystemUsage && state.termsOfService.permitsSystemUsage === true;
    if (isNowSignedIn(oldState, state) || canNowUseSystem) {
      clearNotification(sessionTimeoutProps.id);
      const registrationStatus: TerraUserRegistrationStatus = await getRegistrationStatus();
      authStore.update((state) => ({ ...state, registrationStatus }));
    }
  })
);

authStore.subscribe(
  withErrorReporting('Error checking TOS', async (state: AuthState, oldState: AuthState): Promise<void> => {
    if (!isNowSignedIn(oldState, state)) {
      return;
    }
    try {
      const termsOfService = await Ajax().User.getTermsOfServiceComplianceStatus();
      authStore.update((state: AuthState) => ({ ...state, termsOfService }));
    } catch (error) {
      // If the resp is 404 it means the user has not accepted ANY tos yet, we want to handle this gracefully.
      if (error instanceof Response && error.status === 404) {
        // If the user is now logged in, but there's no ToS status from Sam,
        // then they haven't accepted it yet and Sam hasn't caught up.
        const termsOfService = {
          userHasAcceptedLatestTos: false,
          permitsSystemUsage: false,
        };
        authStore.update((state: AuthState) => ({ ...state, termsOfService }));
      } else {
        throw error;
      }
    }
  })
);

// extending Window interface to access Appcues
declare global {
  interface Window {
    Appcues: any;
    forceSignIn: any;
  }
}

authStore.subscribe(
  withErrorIgnoring(async (state: AuthState, oldState: AuthState) => {
    if (!oldState.termsOfService.permitsSystemUsage && state.termsOfService.permitsSystemUsage) {
      if (window.Appcues) {
        window.Appcues.identify(state.terraUser.id, {
          dateJoined: parseJSON((await Ajax().User.firstTimestamp()).timestamp).getTime(),
        });
        window.Appcues.on('all', captureAppcuesEvent);
      }
    }
  })
);

authStore.subscribe((state: AuthState) => {
  // We can't guarantee that someone reopening the window is the same user,
  // so we should not persist cookie acceptance across sessions for people signed out
  // Per compliance recommendation, we could probably persist through a session, but
  // that would require a second store in session storage instead of local storage
  if (state.signInStatus === 'signedIn' && state.cookiesAccepted !== getLocalPref(cookiesAcceptedKey)) {
    setLocalPref(cookiesAcceptedKey, state.cookiesAccepted);
  }
});

authStore.subscribe(
  withErrorReporting('Error checking groups for timeout status', async (state: AuthState, oldState: AuthState) => {
    if (becameRegistered(oldState, state)) {
      const isTimeoutEnabled = _.some({ groupName: 'session_timeout' }, await Ajax().Groups.list());
      authStore.update((state) => ({ ...state, isTimeoutEnabled }));
    }
  })
);

export const refreshTerraProfile = async () => {
  const profile: TerraUserProfile = await Ajax().User.profile.get();
  authStore.update((state: AuthState) => ({ ...state, profile }));
};

authStore.subscribe(
  withErrorReporting('Error loading user profile', async (state: AuthState, oldState: AuthState) => {
    if (isNowSignedIn(oldState, state)) {
      await refreshTerraProfile();
    }
  })
);

authStore.subscribe(
  withErrorReporting('Error loading NIH account link status', async (state: AuthState, oldState: AuthState) => {
    if (becameRegistered(oldState, state)) {
      const nihStatus = await Ajax().User.getNihStatus();
      authStore.update((state: AuthState) => ({ ...state, nihStatus, nihStatusLoaded: true }));
    }
  })
);

authStore.subscribe(
  withErrorIgnoring(async (state: AuthState, oldState: AuthState) => {
    if (becameRegistered(oldState, state)) {
      await Ajax().Metrics.syncProfile();
    }
  })
);

authStore.subscribe(
  withErrorIgnoring(async (state: AuthState, oldState: AuthState) => {
    if (becameRegistered(oldState, state)) {
      if (state.anonymousId) {
        return await Ajax().Metrics.identify(state.anonymousId);
      }
    }
  })
);

authStore.subscribe(
  withErrorReporting(
    'Error loading Framework Services account status',
    async (state: AuthState, oldState: AuthState) => {
      if (becameRegistered(oldState, state)) {
        await Promise.all(
          _.map(async ({ key }) => {
            const status = await Ajax().User.getFenceStatus(key);
            authStore.update(_.set(['fenceStatus', key], status));
          }, allProviders)
        );
      }
    }
  )
);

authStore.subscribe((state: AuthState, oldState: AuthState) => {
  if (oldState.signInStatus === 'signedIn' && state.signInStatus !== 'signedIn') {
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
