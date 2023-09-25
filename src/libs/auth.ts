import { DEFAULT, switchCase } from '@terra-ui-packages/core-utils';
import { parseJSON } from 'date-fns/fp';
import jwtDecode, { JwtPayload } from 'jwt-decode';
import _ from 'lodash/fp';
import { ExtraSigninRequestArgs, IdTokenClaims, User, UserManager, WebStorageStateStore } from 'oidc-client-ts';
import { AuthContextProps } from 'react-oidc-context';
import { sessionTimedOutErrorMessage } from 'src/auth/auth-errors';
import { cookiesAcceptedKey } from 'src/components/CookieWarning';
import { Ajax } from 'src/libs/ajax';
import { fetchOk } from 'src/libs/ajax/ajax-common';
import { getLocalStorage, getSessionStorage } from 'src/libs/browser-storage';
import { getConfig } from 'src/libs/config';
import { withErrorIgnoring, withErrorReporting } from 'src/libs/error';
import Events, { captureAppcuesEvent } from 'src/libs/events';
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
  getUser,
  requesterPaysProjectStore,
  TermsOfServiceStatus,
  TerraUserRegistrationStatus,
  TokenMetadata,
  workspacesStore,
  workspaceStore,
} from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { v4 as uuid } from 'uuid';

export interface OidcUser extends User {
  profile: B2cIdTokenClaims;
}

// Our config for b2C claims are defined here: https://github.com/broadinstitute/terraform-ap-deployments/tree/master/azure/b2c/policies
// The standard b2C claims are defined here: https://learn.microsoft.com/en-us/azure/active-directory/develop/id-token-claims-reference
export interface B2cIdTokenClaims extends IdTokenClaims {
  email_verified?: boolean;
  idp?: string;
  idp_access_token?: string;
  tid?: string;
  ver?: string;
}

export const getOidcConfig = () => {
  const metadata = {
    authorization_endpoint: `${getConfig().orchestrationUrlRoot}/oauth2/authorize`,
    token_endpoint: `${getConfig().orchestrationUrlRoot}/oauth2/token`,
  };
  return {
    authority: `${getConfig().orchestrationUrlRoot}/oauth2/authorize`,
    client_id: authStore.get().oidcConfig.clientId!,
    popup_redirect_uri: `${window.origin}/redirect-from-oauth`,
    silent_redirect_uri: `${window.origin}/redirect-from-oauth-silent`,
    metadata,
    prompt: 'consent login',
    scope: 'openid email profile',
    stateStore: new WebStorageStateStore({ store: getLocalStorage() }),
    userStore: new WebStorageStateStore({ store: getLocalStorage() }),
    automaticSilentRenew: true,
    // Leo's setCookie interval is currently 5 min, set refresh auth then 5 min 30 seconds to guarantee that setCookie's token won't expire between 2 setCookie api calls
    accessTokenExpiringNotificationTimeInSeconds: 330,
    includeIdTokenInSilentRenew: true,
    extraQueryParams: { access_type: 'offline' },
    redirect_uri: '', // this field is not being used currently, but is expected from UserManager
  };
};

const getAuthInstance = (): AuthContextProps => {
  const authContext: AuthContextProps | undefined = authStore.get().authContext;
  if (authContext === undefined) {
    console.error('getAuthInstance must not be called before authContext is initialized.');
    throw new Error('Error initializing authentication.');
  }
  return authContext;
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
  const eventToFire: string = switchCase<SignOutCause, string>(
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
  const auth: AuthContextProps = getAuthInstance();
  revokeTokens()
    .finally(() => auth.removeUser())
    .finally(() => auth.clearStaleState());
};

const revokeTokens = async () => {
  // send back auth instance, so we can use it for remove and clear stale state
  const auth: AuthContextProps = getAuthInstance();
  if (auth.settings.metadata?.revocation_endpoint) {
    // revokeTokens can fail if the token has already been revoked.
    // Recover from invalid_token errors to make sure signOut completes successfully.
    try {
      await auth.revokeTokens();
    } catch (e) {
      if ((e as any).error === 'invalid_token') {
        return null;
      }
      throw e;
    }
  }
};

const getSigninArgs = (includeBillingScope: boolean): ExtraSigninRequestArgs => {
  return Utils.cond(
    [!includeBillingScope, (): ExtraSigninRequestArgs => ({})],
    // For B2C use a dedicated policy endpoint configured for the GCP cloud-billing scope.
    (): ExtraSigninRequestArgs => ({
      extraQueryParams: { access_type: 'offline', p: getConfig().b2cBillingPolicy },
      extraTokenParams: { p: getConfig().b2cBillingPolicy },
    })
  );
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
    Ajax().Metrics.captureEvent(Events.user.login, {
      sessionStartTime: Utils.makeCompleteDate(sessionStartTime),
    });
    return authTokenState.oidcUser;
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

  if (loadedAuthTokenState.status === 'success') {
    const oidcUser: OidcUser = loadedAuthTokenState.oidcUser;
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
      oidcUser,
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
  const args: ExtraSigninRequestArgs = getSigninArgs(includeBillingScope);
  const authInstance: AuthContextProps = getAuthInstance();
  try {
    const loadedAuthTokenResponse: OidcUser | null = await (popUp
      ? // returns Promise<OidcUser | null>, attempts to use the refresh token to get a new authToken
        authInstance.signinPopup(args)
      : authInstance.signinSilent(args));

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

export const isAuthSettled = ({ isSignedIn, registrationStatus }) => {
  return isSignedIn !== undefined && (!isSignedIn || registrationStatus !== undefined);
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
  return `https://console.cloud.google.com/storage/browser/${id}?authuser=${getUser().email}`;
};

/*
 * Specifies whether the user has logged in via the Azure identity provider.
 */
export const isAzureUser = (): boolean => {
  return _.startsWith('https://login.microsoftonline.com', getUser().idp!);
};

export const processUser = (user: OidcUser | null, isSignInEvent: boolean): void => {
  return authStore.update((state) => {
    const isSignedIn = !_.isNil(user);
    const profile: B2cIdTokenClaims | undefined = user?.profile;
    const userId: string | undefined = profile?.sub;
    // The following few lines of code are to handle sign-in failures due to privacy tools.
    if (isSignInEvent && state.isSignedIn === false && !isSignedIn) {
      // if both of these values are false, it means that the user was initially not signed in (state.isSignedIn === false),
      // tried to sign in (invoking processUser) and was still not signed in (isSignedIn === false).
      notify('error', 'Could not sign in', {
        message: 'Click for more information',
        detail:
          'If you are using privacy blockers, they may be preventing you from signing in. Please disable those tools, refresh, and try signing in again.',
        timeout: 30000,
      });
    }
    return {
      ...state,
      isSignedIn,
      anonymousId: !isSignedIn && state.isSignedIn ? undefined : state.anonymousId,
      registrationStatus: isSignedIn ? state.registrationStatus : 'uninitialized',
      termsOfService: initializeTermsOfService(isSignedIn, state),
      profile: isSignedIn ? state.profile : {},
      nihStatus: isSignedIn ? state.nihStatus : undefined,
      fenceStatus: isSignedIn ? state.fenceStatus : {},
      // Load whether a user has input a cookie acceptance in a previous session on this system,
      // or whether they input cookie acceptance previously in this session
      cookiesAccepted: isSignedIn
        ? state.cookiesAccepted || getLocalPrefForUserId(userId, cookiesAcceptedKey)
        : undefined,
      isTimeoutEnabled: isSignedIn ? state.isTimeoutEnabled : undefined,
      hasGcpBillingScopeThroughB2C: isSignedIn ? state.hasGcpBillingScopeThroughB2C : undefined,
      user: {
        token: user?.access_token,
        scope: user?.scope,
        id: userId,
        ...(profile
          ? {
              email: profile.email,
              name: profile.name,
              givenName: profile.given_name,
              familyName: profile.family_name,
              imageUrl: profile.picture,
              idp: profile.idp,
            }
          : {}),
      },
    };
  });
};

const initializeTermsOfService = (isSignedIn: boolean, state: AuthState): TermsOfServiceStatus => {
  return {
    userHasAcceptedLatestTos: isSignedIn ? state.termsOfService.userHasAcceptedLatestTos : undefined,
    permitsSystemUsage: isSignedIn ? state.termsOfService.permitsSystemUsage : undefined,
  };
};

export const initializeAuth = _.memoize(async () => {
  // Instantiate a UserManager directly to populate the logged-in user at app initialization time.
  // All other auth usage should use the AuthContext from authStore.
  const userManager: UserManager = new UserManager(getOidcConfig());
  processUser(await userManager.getUser(), false);
});

export const initializeClientId = _.memoize(async () => {
  const oidcConfig = await Ajax().OAuth2.getConfiguration();
  authStore.update((state) => ({ ...state, oidcConfig }));
});

// This is intended for tests to short circuit the login flow
window.forceSignIn = withErrorReporting('Error forcing sign in', async (token) => {
  await initializeAuth(); // don't want this clobbered when real auth initializes
  const res = await fetchOk('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  authStore.update((state) => {
    return {
      ...state,
      isSignedIn: true,
      registrationStatus: 'uninitialized',
      isTimeoutEnabled: undefined,
      cookiesAccepted: true,
      profile: {},
      user: {
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
    const isNowSignedIn = oldState.isSignedIn === false && state.isSignedIn === true;
    if (isNowSignedIn || canNowUseSystem) {
      clearNotification(sessionTimeoutProps.id);
      const registrationStatus: TerraUserRegistrationStatus = await getRegistrationStatus();
      authStore.update((state) => ({ ...state, registrationStatus }));
    }
  })
);

authStore.subscribe(
  withErrorReporting('Error checking TOS', async (state, oldState) => {
    if (!oldState.isSignedIn && state.isSignedIn) {
      const tosComplianceStatus = await Ajax().User.getTermsOfServiceComplianceStatus();
      // If the user is now logged in, but there's no ToS status from Sam,
      // then they haven't accepted it yet and Sam hasn't caught up.
      const termsOfService = _.isNull(tosComplianceStatus)
        ? {
            userHasAcceptedLatestTos: false,
            permitsSystemUsage: false,
          }
        : tosComplianceStatus;
      authStore.update((state) => ({ ...state, termsOfService }));
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
  withErrorIgnoring(async (state, oldState) => {
    if (!oldState.termsOfService.permitsSystemUsage && state.termsOfService.permitsSystemUsage) {
      if (window.Appcues) {
        window.Appcues.identify(state.user.id, {
          dateJoined: parseJSON((await Ajax().User.firstTimestamp()).timestamp).getTime(),
        });
        window.Appcues.on('all', captureAppcuesEvent);
      }
    }
  })
);

authStore.subscribe((state) => {
  // We can't guarantee that someone reopening the window is the same user,
  // so we should not persist cookie acceptance across sessions for people signed out
  // Per compliance recommendation, we could probably persist through a session, but
  // that would require a second store in session storage instead of local storage
  if (state.isSignedIn && state.cookiesAccepted !== getLocalPref(cookiesAcceptedKey)) {
    setLocalPref(cookiesAcceptedKey, state.cookiesAccepted);
  }
});

authStore.subscribe(
  withErrorReporting('Error checking groups for timeout status', async (state, oldState) => {
    if (becameRegistered(oldState, state)) {
      const isTimeoutEnabled = _.some({ groupName: 'session_timeout' }, await Ajax().Groups.list());
      authStore.update((state) => ({ ...state, isTimeoutEnabled }));
    }
  })
);

export const refreshTerraProfile = async () => {
  const profile = Utils.kvArrayToObject((await Ajax().User.profile.get()).keyValuePairs);
  authStore.update((state) => ({ ...state, profile }));
};

authStore.subscribe(
  withErrorReporting('Error loading user profile', async (state, oldState) => {
    if (!oldState.isSignedIn && state.isSignedIn) {
      await refreshTerraProfile();
    }
  })
);

authStore.subscribe(
  withErrorReporting('Error loading NIH account link status', async (state, oldState) => {
    if (becameRegistered(oldState, state)) {
      const nihStatus = await Ajax().User.getNihStatus();
      authStore.update((state) => ({ ...state, nihStatus }));
    }
  })
);

authStore.subscribe(
  withErrorIgnoring(async (state, oldState) => {
    if (becameRegistered(oldState, state)) {
      await Ajax().Metrics.syncProfile();
    }
  })
);

authStore.subscribe(
  withErrorIgnoring(async (state, oldState) => {
    if (becameRegistered(oldState, state)) {
      if (state.anonymousId) {
        return await Ajax().Metrics.identify(state.anonymousId);
      }
    }
  })
);

authStore.subscribe(
  withErrorReporting('Error loading Framework Services account status', async (state, oldState) => {
    if (becameRegistered(oldState, state)) {
      await Promise.all(
        _.map(async ({ key }) => {
          const status = await Ajax().User.getFenceStatus(key);
          authStore.update(_.set(['fenceStatus', key], status));
        }, allProviders)
      );
    }
  })
);

authStore.subscribe((state, oldState) => {
  if (oldState.isSignedIn && !state.isSignedIn) {
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
