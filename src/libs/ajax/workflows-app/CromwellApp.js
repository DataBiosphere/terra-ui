import qs from 'qs';
import { fetchFromProxy } from 'src/libs/ajax/ajax-common';

export const CromwellApp = (signal) => ({
  workflows: (workflowId) => {
    return {
      metadata: async (cromwellUrlRoot, includeKey, excludeKey) => {
        const keyParams = qs.stringify({ includeKey, excludeKey }, { arrayFormat: 'repeat' });
        const res = await fetchFromProxy(cromwellUrlRoot)(`api/workflows/v1/${workflowId}/metadata?${keyParams}`, { signal, method: 'GET' });
        return res.json();
      },
    };
  },
});
