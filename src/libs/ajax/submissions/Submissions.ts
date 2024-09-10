import _ from 'lodash/fp';
import { authOpts } from 'src/auth/auth-session';
import { fetchRawls } from 'src/libs/ajax/ajax-common';

export const Submissions = (signal?: AbortSignal) => ({
  queueStatus: async () => {
    const res = await fetchRawls('submissions/queueStatus', _.merge(authOpts(), { signal }));
    return res.json();
  },
});

export type SubmissionsAjaxContract = ReturnType<typeof Submissions>;
