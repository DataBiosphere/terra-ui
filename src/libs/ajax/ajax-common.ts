import { FetchFn } from '@terra-ui-packages/data-client-core';
import _ from 'lodash/fp';
import { withRetryAfterReloadingExpiredAuthToken } from 'src/auth/auth-fetch';
import { withAppIdentifier } from 'src/libs/ajax/fetch/fetch-core';
import { getConfig } from 'src/libs/config';

import { fetchOk, withCancellation, withInstrumentation, withUrlPrefix } from './fetch/fetch-core';

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
