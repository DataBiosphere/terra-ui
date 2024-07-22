import jwtDecode, { JwtPayload } from 'jwt-decode';
import _ from 'lodash/fp';
import { cookiesAcceptedKey } from 'src/auth/accept-cookies';
import { B2cIdTokenClaims, getCurrentOidcUser, oidcSignIn, OidcSignInArgs, OidcUser } from 'src/auth/oidc-broker';
import { Metrics } from 'src/libs/ajax/Metrics';
import Events, { MetricsEventName } from 'src/libs/events';
import { getLocalPrefForUserId } from 'src/libs/prefs';
import { AuthState, authStore, getTerraUser, metricStore, oidcStore, TokenMetadata, userStore } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { getTimestampMetricLabel } from 'src/libs/utils';
import { v4 as uuid } from 'uuid';

export const getAuthToken = (): string | undefined => {
  const oidcUser: OidcUser | undefined = oidcStore.get().user;

  return oidcUser?.access_token;
};

export const getAuthTokenFromLocalStorage = async (): Promise<string | undefined> => {
  const oidcUser: OidcUser | null = await getCurrentOidcUser();

  return oidcUser?.access_token;
};

export const sendRetryMetric = () => {
  Metrics().captureEvent(Events.user.authToken.load.retry, {});
};

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
    Metrics().captureEvent(Events.user.login.success, {
      sessionStartTime: Utils.makeCompleteDate(sessionStartTime),
    });
    return authTokenState.oidcUser;
  }
  if (authTokenState.status === 'error') {
    Metrics().captureEvent(Events.user.login.error, {});
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
 * @param args
 */
export const loadAuthToken = async (
  args: OidcSignInArgs = { includeBillingScope: false, popUp: false }
): Promise<AuthTokenState> => {
  const { authTokenMetadata: oldAuthTokenMetadata, refreshTokenMetadata: oldRefreshTokenMetadata } = metricStore.get();

  // for metrics, updates number of authToken load attempts for this session
  metricStore.update((state) => ({
    ...state,
    authTokenMetadata: {
      ...oldAuthTokenMetadata,
      totalTokenLoadAttemptsThisSession: oldAuthTokenMetadata.totalTokenLoadAttemptsThisSession + 1,
    },
  }));

  const loadedAuthTokenState: AuthTokenState = await tryLoadAuthToken(args);
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
    metricStore.update((oldState) => ({
      ...oldState,
      authTokenMetadata: {
        ...oldState.authTokenMetadata,
        token: oidcUser.access_token,
        createdAt: authTokenCreatedAt,
        expiresAt: authTokenExpiresAt,
        id: authTokenId,
        totalTokensUsedThisSession:
          oldAuthTokenMetadata.token !== undefined && oldAuthTokenMetadata.token === oldState.authTokenMetadata.token
            ? oldAuthTokenMetadata.totalTokensUsedThisSession
            : oldAuthTokenMetadata.totalTokensUsedThisSession + 1,
      },
      refreshTokenMetadata: isNewRefreshToken
        ? {
            ...oldState.refreshTokenMetadata,
            id: uuid(),
            token: refreshToken,
            createdAt: authTokenCreatedAt,
            // Auth token expiration is set to 24 hours in B2C configuration.
            expiresAt: authTokenCreatedAt + 86400, // 24 hours in seconds
            totalTokensUsedThisSession: oldState.authTokenMetadata.totalTokensUsedThisSession + 1,
            totalTokenLoadAttemptsThisSession: oldState.authTokenMetadata.totalTokenLoadAttemptsThisSession + 1,
          }
        : { ...oldState.refreshTokenMetadata },
    }));
    const { refreshTokenMetadata: currentRefreshTokenMetadata } = metricStore.get();

    Metrics().captureEvent(Events.user.authToken.load.success, {
      authProvider: oidcUser.profile.idp,
      ...getOldAuthTokenLabels(oldAuthTokenMetadata),
      authTokenCreatedAt: getTimestampMetricLabel(authTokenCreatedAt),
      authTokenExpiresAt: getTimestampMetricLabel(authTokenExpiresAt),
      authTokenId,
      refreshTokenId: currentRefreshTokenMetadata.id,
      refreshTokenCreatedAt: getTimestampMetricLabel(currentRefreshTokenMetadata.createdAt),
      refreshTokenExpiresAt: getTimestampMetricLabel(currentRefreshTokenMetadata.expiresAt),
      jwtExpiresAt: getTimestampMetricLabel(jwtExpiresAt),
    });
  } else if (loadedAuthTokenState.status === 'error') {
    Metrics().captureEvent(Events.user.authToken.load.error, {
      // we could potentially log the reason, but I don't know if that data is safe to log
      ...getOldAuthTokenLabels(oldAuthTokenMetadata),
      refreshTokenId: oldRefreshTokenMetadata.id,
      refreshTokenCreatedAt: getTimestampMetricLabel(oldRefreshTokenMetadata.createdAt),
      refreshTokenExpiresAt: getTimestampMetricLabel(oldRefreshTokenMetadata.expiresAt),
    });
  }
  return loadedAuthTokenState;
};

const tryLoadAuthToken = async (
  args: OidcSignInArgs = { includeBillingScope: false, popUp: false }
): Promise<AuthTokenState> => {
  try {
    const loadedAuthTokenResponse: OidcUser | null = await oidcSignIn(args);

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

export const hasBillingScope = (): boolean => authStore.get().hasGcpBillingScopeThroughB2C === true;

/*
 * Tries to obtain Google Cloud Billing scope silently.

 * This will succeed if the user previously granted the scope for the application, and fail otherwise.
 * Call `ensureBillingScope` to generate a pop-up to prompt the user to grant the scope if needed.
 */
export const tryBillingScope = async () => {
  if (!hasBillingScope()) {
    await loadAuthToken({ includeBillingScope: true, popUp: false });
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
  const tokenClaims: B2cIdTokenClaims = user.profile;
  // according to IdTokenClaims, this is a mandatory claim and should always exist
  // should be googleSubjectId or b2cId depending on how they authenticated
  const userId: string = tokenClaims.sub;
  userStore.update((state) => ({
    ...state,
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
  }));
  authStore.update((state: AuthState) => ({
    ...state,
    signInStatus: 'authenticated',
    // Load whether a user has input a cookie acceptance in a previous session on this system,
    // or whether they input cookie acceptance previously in this session
    cookiesAccepted: state.cookiesAccepted || getLocalPrefForUserId(userId, cookiesAcceptedKey),
  }));
};

// extending Window interface to access Appcues
declare global {
  interface Window {
    Appcues?: {
      /** Identifies the current user with an ID and an optional set of properties. */
      identify: (userId: string, properties?: any) => void;
      /** Notifies the SDK that the state of the application has changed. */
      page: () => void;
      /** Forces specific Appcues content to appear for the current user by passing in the ID. */
      show: (contentId: string) => void;
      /** Fire the callback function when the given event is triggered by the SDK */
      on: ((eventName: Exclude<string, 'all'>, callbackFn: (event: any) => void | Promise<void>) => void) &
        ((eventName: 'all', callbackFn: (eventName: string, event: any) => void | Promise<void>) => void);
      /** Clears all known information about the current user in this session */
      reset: () => void;
      /** Tracks a custom event (by name) taken by the current user. */
      track: (eventName: MetricsEventName) => void;
    };
    forceSignIn: any;
  }
}
