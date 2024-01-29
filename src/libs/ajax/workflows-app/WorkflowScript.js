import { fetchOk } from 'src/libs/ajax/network-core/fetch-core';

export const WorkflowScript = (signal) => ({
  get: async (workflowUrl) => {
    const res = await fetchOk(workflowUrl, { signal, method: 'GET' });
    return res.text();
  },
});
