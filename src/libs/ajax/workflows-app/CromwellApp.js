import _ from 'lodash/fp';
import qs from 'qs';
import { authOpts, fetchFromProxy } from 'src/libs/ajax/ajax-common';

export const CromwellApp = (signal) => ({
  workflows: (workflowId) => {
    return {
      metadata: async (cromwellUrlRoot, includeKey, excludeKey) => {
        const keyParams = qs.stringify({ includeKey, excludeKey }, { arrayFormat: 'repeat' });
        const res = await fetchFromProxy(cromwellUrlRoot)(
          `api/workflows/v1/${workflowId}/metadata?${keyParams}`,
          _.mergeAll([authOpts(), { signal, method: 'GET' }])
        );
        return res.json();
      },
      failedTasks: async (cromwellUrlRoot) => {
        const res = await fetchFromProxy(cromwellUrlRoot)(
          `api/workflows/v1/${workflowId}/metadata/failed-jobs`,
          _.mergeAll([authOpts(), { signal, method: 'GET' }])
        );
        return res.json();
      },
    };
  },
});
