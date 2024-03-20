import { sessionTimedOutErrorMessage } from 'src/auth/auth-errors';
import { logoutCallbackLinkName } from 'src/auth/Logout';
import { removeUserFromLocalState } from 'src/auth/oidc-broker';
import { Ajax } from 'src/libs/ajax';
import { getSessionStorage } from 'src/libs/browser-storage';
import Events, { MetricsEventName } from 'src/libs/events';
import * as Nav from 'src/libs/nav';
import { notify, sessionTimeoutProps } from 'src/libs/notifications';
import {
  authStore,
  azureCookieReadyStore,
  cookieReadyStore,
  MetricState,
  metricStore,
  oidcStore,
  TokenMetadata,
  userStore,
} from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { DEFAULT, getTimestampMetricLabel, switchCase } from 'src/libs/utils';

export type SignOutCause =
  | 'requested'
  | 'disabled'
  | 'declinedTos'
  | 'expiredRefreshToken'
  | 'errorRefreshingAuthToken'
  | 'idleStatusMonitor'
  | 'unspecified';

export const signOut = (cause: SignOutCause = 'unspecified'): void => {
  // TODO: invalidate runtime cookies https://broadworkbench.atlassian.net/browse/IA-3498
  sendSignOutMetrics(cause);
  if (cause === 'expiredRefreshToken' || cause === 'errorRefreshingAuthToken') {
    notify('info', sessionTimedOutErrorMessage, sessionTimeoutProps);
  }

  try {
    const userManager = oidcStore.get().userManager;
    const redirectUrl = `${window.location.origin}/${Nav.getLink(logoutCallbackLinkName)}`;
    // This will redirect to the logout callback page, which calls `userSignedOut` and then redirects to the homepage.
    userManager!.signoutRedirect({ post_logout_redirect_uri: redirectUrl });
  } catch (e: unknown) {
    console.error('Signing out with B2C failed. Falling back on local signout', e);
    userSignedOut(true);
    Nav.goToPath('root');
  }
};

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
  const metricStoreState: MetricState = metricStore.get();
  const tokenMetadata: TokenMetadata = metricStoreState.authTokenMetadata;

  await Ajax().Metrics.captureEvent(eventToFire, {
    sessionEndTime: Utils.makeCompleteDate(sessionEndTime),
    sessionDurationInSeconds:
      metricStoreState.sessionStartTime < 0 ? undefined : (sessionEndTime - metricStoreState.sessionStartTime) / 1000.0,
    authTokenCreatedAt: getTimestampMetricLabel(tokenMetadata.createdAt),
    authTokenExpiresAt: getTimestampMetricLabel(tokenMetadata.expiresAt),
    totalAuthTokensUsedThisSession: metricStoreState.authTokenMetadata.totalTokensUsedThisSession,
    totalAuthTokenLoadAttemptsThisSession: metricStoreState.authTokenMetadata.totalTokenLoadAttemptsThisSession,
  });
};

export const userSignedOut = (redirectFailed = false) => {
  cookieReadyStore.reset();
  azureCookieReadyStore.reset();
  getSessionStorage().clear();

  if (redirectFailed) {
    removeUserFromLocalState();
  }

  const { cookiesAccepted } = authStore.get();

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
  const anonymousId: string | undefined = metricStore.get().anonymousId;
  metricStore.reset();
  metricStore.update((state) => ({
    ...state,
    anonymousId,
  }));
  userStore.reset();
};
