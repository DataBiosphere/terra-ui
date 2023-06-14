import _ from 'lodash/fp';
import { reloadAuthToken, signOutAfterSessionTimeout } from 'src/libs/auth';
import { getConfig } from 'src/libs/config';
import { ajaxOverridesStore, getUser } from 'src/libs/state';
import * as Utils from 'src/libs/utils';

export const authOpts = (token = getUser().token) => ({ headers: { Authorization: `Bearer ${token}` } });
export const jsonBody = (body) => ({ body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
export const appIdentifier = { headers: { 'X-App-ID': 'Saturn' } };

type FetchFn = typeof fetch;

export const withUrlPrefix = _.curry((prefix, wrappedFetch) => (path, ...args) => {
  return wrappedFetch(prefix + path, ...args);
});

export const withRetryOnError = _.curry((shouldNotRetryFn, wrappedFetch) => async (...args) => {
  const timeout = 5000;
  const somePointInTheFuture = Date.now() + timeout;
  const maxDelayIncrement = 1500;
  const minDelay = 500;

  while (Date.now() < somePointInTheFuture) {
    const until = Math.random() * maxDelayIncrement + minDelay;
    try {
      // @ts-ignore
      return await Utils.withDelay(until, wrappedFetch)(...args);
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

export const withRetryAfterReloadingExpiredAuthToken =
  (wrappedFetch: FetchFn): FetchFn =>
  async (resource: RequestInfo | URL, options?: RequestInit) => {
    const requestHasAuthHeader = _.isMatch(authOpts(), options as object);
    try {
      return await wrappedFetch(resource, options);
    } catch (error) {
      const isUnauthorizedResponse = error instanceof Response && error.status === 401;
      if (isUnauthorizedResponse && requestHasAuthHeader) {
        const successfullyReloadedAuthToken = !!(await reloadAuthToken());
        if (successfullyReloadedAuthToken) {
          const optionsWithNewAuthToken = _.merge(options, authOpts());
          return await wrappedFetch(resource, optionsWithNewAuthToken);
        }
        signOutAfterSessionTimeout();
        throw new Error('Session timed out');
      } else {
        throw error;
      }
    }
  };

const withAppIdentifier = (wrappedFetch) => (url, options) => {
  return wrappedFetch(url, _.merge(options, appIdentifier));
};

export const checkRequesterPaysError = async (response) => {
  if (response.status === 400) {
    const data = await response.text();
    const requesterPaysError = responseContainsRequesterPaysError(data);
    return Object.assign(new Response(new Blob([data]), response), { requesterPaysError });
  }
  return Object.assign(response, { requesterPaysError: false });
};

export const responseContainsRequesterPaysError = (responseText) => {
  return _.includes('requester pays', responseText);
};

// Allows use of ajaxOverrideStore to stub responses for testing
const withInstrumentation =
  (wrappedFetch) =>
  (...args) => {
    return _.flow(
      ..._.map(
        'fn',
        _.filter(({ filter }) => {
          const [url, { method = 'GET' } = {}] = args;
          return _.isFunction(filter)
            ? filter(...args)
            : url.match(filter.url) && (!filter.method || filter.method === method);
        }, ajaxOverridesStore.get())
      )
    )(wrappedFetch)(...args);
  };

// Ignores cancellation error when request is cancelled
const withCancellation =
  (wrappedFetch) =>
  async (...args) => {
    try {
      return await wrappedFetch(...args);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return Utils.abandonedPromise();
      }
      throw error;
    }
  };

// Converts non-200 responses to exceptions
const withErrorRejection =
  (wrappedFetch) =>
  async (...args) => {
    const res = await wrappedFetch(...args);
    if (res.ok) {
      return res;
    }
    throw res;
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

export const fetchRex = _.flow(
  withUrlPrefix(`${getConfig().rexUrlRoot}/api/`),
  withRetryAfterReloadingExpiredAuthToken
)(fetchOk);

export const fetchBond = _.flow(
  withUrlPrefix(`${getConfig().bondUrlRoot}/`),
  withRetryAfterReloadingExpiredAuthToken
)(fetchOk);

export const fetchMartha = _.flow(
  withUrlPrefix(`${getConfig().marthaUrlRoot}/`),
  withRetryAfterReloadingExpiredAuthToken
)(fetchOk);

export const fetchDrsHub = _.flow(
  withUrlPrefix(`${getConfig().drsHubUrlRoot}/`),
  withRetryAfterReloadingExpiredAuthToken
)(fetchOk);

export const fetchBard = _.flow(
  withUrlPrefix(`${getConfig().bardRoot}/`),
  withRetryAfterReloadingExpiredAuthToken
)(fetchOk);

export const fetchEcm = _.flow(
  withUrlPrefix(`${getConfig().externalCredsUrlRoot}/`),
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

export const fetchWDS = (wdsProxyUrlRoot) =>
  _.flow(withUrlPrefix(`${wdsProxyUrlRoot}/`), withRetryAfterReloadingExpiredAuthToken)(fetchOk);

export const fetchCbas = (cbasProxyUrlRoot) =>
  _.flow(withUrlPrefix(`${cbasProxyUrlRoot}/`), withRetryAfterReloadingExpiredAuthToken)(fetchOk);
