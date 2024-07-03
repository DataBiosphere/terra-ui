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

export const authOpts = (token = getAuthToken()) => ({ headers: { Authorization: `Bearer ${token}` } });

export const withAuthSession =
  (wrappedFetch: FetchFn): FetchFn =>
  (url, options) => {
    return wrappedFetch(url, _.merge(options, authOpts()));
  };

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
