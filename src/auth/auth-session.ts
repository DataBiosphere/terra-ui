import { FetchFn } from '@terra-ui-packages/data-client-core';
import _ from 'lodash/fp';

import { getAuthToken } from './auth';

//
// Auth mechanics for use on typical auth-session scoped application data requests.
//
export const authOpts = (token = getAuthToken()) => ({ headers: { Authorization: `Bearer ${token}` } });

export const withAuthSession =
  (wrappedFetch: FetchFn): FetchFn =>
  (url, options) => {
    return wrappedFetch(url, _.merge(options, authOpts()));
  };
