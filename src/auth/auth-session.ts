import _ from 'lodash/fp';
import { FetchFn } from 'src/libs/ajax/data-client-common';

import { getAuthToken } from './auth';

export const authOpts = (token = getAuthToken()) => ({ headers: { Authorization: `Bearer ${token}` } });

export const withAuthSession =
  (wrappedFetch: FetchFn): FetchFn =>
  (url, options) => {
    return wrappedFetch(url, _.merge(options, authOpts()));
  };
