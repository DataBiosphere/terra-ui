import { fetchOk } from '../network-core/fetch-core';

export const WorkflowScript = (signal) => ({
  get: async (workflowUrl) => {
    const res = await fetchOk(workflowUrl, { signal, method: 'GET' });
    return res.text();
  },
});
