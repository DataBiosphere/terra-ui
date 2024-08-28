// For Leo calls which should not trigger signout on auth failure.
import { fetchOk, withUrlPrefix } from 'src/libs/ajax/fetch/fetch-core';
import { getConfig } from 'src/libs/config';

export const fetchLeoWithoutAuthRetry = withUrlPrefix(`${getConfig().leoUrlRoot}/`, fetchOk);
