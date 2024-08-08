// Don't wrap Bard calls in withRetryAfterReloadingExpiredAuthToken, because
// that wrapper itself generates metrics.
import { fetchOk, withUrlPrefix } from 'src/libs/ajax/fetch/fetch-core';
import { getConfig } from 'src/libs/config';

export const fetchBard = withUrlPrefix(`${getConfig().bardRoot}/`, fetchOk);
