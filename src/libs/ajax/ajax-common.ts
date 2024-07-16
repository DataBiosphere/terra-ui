import { delay } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import {
  AuthTokenState,
  getAuthToken,
  getAuthTokenFromLocalStorage,
  loadAuthToken,
  sendRetryMetric,
} from 'src/auth/auth';
import { sessionExpirationErrorMessage } from 'src/auth/auth-errors';
import { signOut, SignOutCause } from 'src/auth/signout/sign-out';
import { FetchFn } from 'src/libs/ajax/data-client-common';
import { withCancellation, withErrorRejection, withInstrumentation } from 'src/libs/ajax/fetch/fetch-core';
import { getConfig } from 'src/libs/config';

export const authOpts = (token = getAuthToken()) => ({ headers: { Authorization: `Bearer ${token}` } });
export const jsonBody = (body) => ({
  body: JSON.stringify(body),
  headers: { 'Content-Type': 'application/json' },
});
export const appIdentifier = { headers: { 'X-App-ID': 'Saturn' } };

export const withUrlPrefix = _.curry((prefix, wrappedFetch) => (path, ...args) => {
  return wrappedFetch(prefix + path, ...args);
});

export const withRetryOnError = _.curry((shouldNotRetryFn, wrappedFetch) => async (...args) => {
  const timeout = 5000;
  const somePointInTheFuture = Date.now() + timeout;
  const maxDelayIncrement = 1500;
  const minDelay = 500;

  while (Date.now() < somePointInTheFuture) {
    try {
      await delay(minDelay + maxDelayIncrement * Math.random());
      return await wrappedFetch(...args);
    } catch (error) {
      if (shouldNotRetryFn(error)) {
        throw error;
      }
      // ignore error will retry
    }
  }
  return wrappedFetch(...args);
});

export const DEFAULT_TIMEOUT_DURATION = 10000;
export const DEFAULT_RETRY_COUNT = 5;

export async function makeRequestRetry(request: Function, retryCount: number, timeoutInMs: number): Promise<any> {
  let retriesLeft = retryCount;
  while (retriesLeft >= 0) {
    try {
      const response = await Promise.race([
        request(),
        // If the request takes longer than 10 seconds, reject it and try again.
        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), timeoutInMs)),
      ]);

      if (response.ok) {
        return response.json();
      }
    } catch (error) {
      if (retriesLeft === 0) {
        throw error;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, timeoutInMs));
    retriesLeft--;
  }
}

const isUnauthorizedResponse = (error: unknown): boolean => error instanceof Response && error.status === 401;

const createRequestWithStoredAuthToken = async (
  wrappedFetch: FetchFn,
  resource: RequestInfo | URL,
  options?: RequestInit
): Promise<Response> => {
  const localToken = (await getAuthTokenFromLocalStorage())!;
  return createRequestWithNewAuthToken(localToken, wrappedFetch, resource, options);
};

const createRequestWithNewAuthToken = (
  token: string,
  wrappedFetch: FetchFn,
  resource: RequestInfo | URL,
  options?: RequestInit
): Promise<Response> => {
  const optionsWithNewAuthToken = _.merge(options, authOpts(token));
  return wrappedFetch(resource, optionsWithNewAuthToken);
};

export const withRetryAfterReloadingExpiredAuthToken =
  (wrappedFetch: FetchFn): FetchFn =>
  async (resource: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
    const preRequestAuthToken = getAuthToken();
    const requestHasAuthHeader = _.isMatch(authOpts(), options as object);
    try {
      if (requestHasAuthHeader) {
        // use auth token in local storage
        return await createRequestWithStoredAuthToken(wrappedFetch, resource, options);
      }
      return await wrappedFetch(resource, options);
    } catch (error: unknown) {
      if (isUnauthorizedResponse(error) && requestHasAuthHeader) {
        const reloadedAuthTokenState: AuthTokenState = await loadAuthToken();
        const postRequestAuthToken = getAuthToken();
        if (reloadedAuthTokenState.status === 'success') {
          sendRetryMetric();
          return await createRequestWithStoredAuthToken(wrappedFetch, resource, options);
        }
        // if the auth token the request was made with does not match the current auth token
        // that means that the user has already been signed out and signed in again to receive a new token
        // in this case, we should not sign the user out again
        if (preRequestAuthToken === postRequestAuthToken) {
          const signOutCause: SignOutCause = 'errorRefreshingAuthToken';
          signOut(signOutCause);
        }
        throw new Error(sessionExpirationErrorMessage);
      } else {
        throw error;
      }
    }
  };

export const withAppIdentifier =
  (wrappedFetch: FetchFn): FetchFn =>
  (url, options) => {
    return wrappedFetch(url, _.merge(options, appIdentifier));
  };

export const withAuthSession =
  (wrappedFetch: FetchFn): FetchFn =>
  (url, options) => {
    return wrappedFetch(url, _.merge(options, authOpts()));
  };

export type RequesterPaysErrorInfo = {
  requesterPaysError: boolean;
};

export const isRequesterPaysErrorInfo = (error: any): error is RequesterPaysErrorInfo => {
  return error != null && typeof error === 'object' && 'requesterPaysError' in error;
};

export const checkRequesterPaysError = async (response): Promise<RequesterPaysErrorInfo> => {
  if (response.status === 400) {
    const data = await response.text();
    const requesterPaysErrorInfo: RequesterPaysErrorInfo = {
      requesterPaysError: responseContainsRequesterPaysError(data),
    };
    return Object.assign(new Response(new Blob([data]), response), requesterPaysErrorInfo);
  }
  const unrecognizedErrorInfo: RequesterPaysErrorInfo = { requesterPaysError: false };
  return Object.assign(response, unrecognizedErrorInfo);
};

export const responseContainsRequesterPaysError = (responseText) => {
  return _.includes('requester pays', responseText);
};

export const fetchOk = _.flow(withInstrumentation, withCancellation, withErrorRejection)(fetch);

export const fetchLeo = _.flow(
  withUrlPrefix(`${getConfig().leoUrlRoot}/`),
  withRetryAfterReloadingExpiredAuthToken
)(fetchOk);

export const fetchSam = _.flow(
  withUrlPrefix(`${getConfig().samUrlRoot}/`),
  withAppIdentifier,
  withRetryAfterReloadingExpiredAuthToken
)(fetchOk);

export const fetchRawls = _.flow(
  withUrlPrefix(`${getConfig().rawlsUrlRoot}/api/`),
  withAppIdentifier,
  withRetryAfterReloadingExpiredAuthToken
)(fetchOk);

export const fetchBillingProfileManager = _.flow(
  withUrlPrefix(`${getConfig().billingProfileManagerUrlRoot}/api/`),
  withAppIdentifier,
  withRetryAfterReloadingExpiredAuthToken
)(fetchOk);

export const fetchWorkspaceManager = _.flow(
  withUrlPrefix(`${getConfig().workspaceManagerUrlRoot}/api/`),
  withAppIdentifier,
  withRetryAfterReloadingExpiredAuthToken
)(fetchOk);

export const fetchCatalog = _.flow(
  withUrlPrefix(`${getConfig().catalogUrlRoot}/api/`),
  withRetryAfterReloadingExpiredAuthToken
)(fetchOk);

export const fetchDataRepo = _.flow(
  withUrlPrefix(`${getConfig().dataRepoUrlRoot}/api/`),
  withRetryAfterReloadingExpiredAuthToken
)(fetchOk);

export const fetchDockstore = withUrlPrefix(`${getConfig().dockstoreUrlRoot}/api/`, fetchOk);

export const fetchAgora = _.flow(
  withUrlPrefix(`${getConfig().agoraUrlRoot}/api/v1/`),
  withAppIdentifier,
  withRetryAfterReloadingExpiredAuthToken
)(fetchOk);

export const fetchOrchestration = _.flow(
  withUrlPrefix(`${getConfig().orchestrationUrlRoot}/`),
  withAppIdentifier,
  withRetryAfterReloadingExpiredAuthToken
)(fetchOk);

export const fetchDrsHub = _.flow(
  withUrlPrefix(`${getConfig().drsHubUrlRoot}/`),
  withRetryAfterReloadingExpiredAuthToken
)(fetchOk);

// Don't wrap Bard calls in withRetryAfterReloadingExpiredAuthToken, because
// that wrapper itself generates metrics.
export const fetchBard = withUrlPrefix(`${getConfig().bardRoot}/`, fetchOk);

export const fetchEcm = _.flow(
  withUrlPrefix(`${getConfig().externalCreds?.urlRoot}/`),
  withRetryAfterReloadingExpiredAuthToken
)(fetchOk);

// Google Forms does not set a CORS header that allows Terra to access the response.
// Thus, we send the request in no-cors mode and, because the response is "opaque",
// we do not check response.ok.
export const fetchGoogleForms = _.flow(
  withUrlPrefix('https://docs.google.com/forms/u/0/d/e/'),
  withInstrumentation,
  withCancellation,
  (wrappedFetch) => (url, options) => wrappedFetch(url, _.merge(options, { mode: 'no-cors' }))
)(fetch);

export const fetchWDS = (wdsProxyUrlRoot: string): FetchFn =>
  _.flow(withUrlPrefix(`${wdsProxyUrlRoot.replace(/\/$/, '')}/`), withRetryAfterReloadingExpiredAuthToken)(fetchOk);

export const fetchFromProxy = (proxyUrlRoot) =>
  _.flow(withUrlPrefix(`${proxyUrlRoot}/`), withRetryAfterReloadingExpiredAuthToken)(fetchOk);
