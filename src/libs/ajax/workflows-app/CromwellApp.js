import _ from 'lodash/fp';
import qs from 'qs';
import { authOpts, fetchFromProxy } from 'src/libs/ajax/ajax-common';

export const CromwellApp = (signal) => ({
  workflows: (workflowId) => {
    return {
      metadata: async (cromwellUrlRoot, options) => {
        const includeKey = options.includeKey;
        const excludeKey = options.excludeKey;
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
  callCacheDiff: async (cromwellUrlRoot, thisWorkflow, thatWorkflow) => {
    const { workflowId: thisWorkflowId, callFqn: thisCallFqn, index: thisIndex } = thisWorkflow;
    const { workflowId: thatWorkflowId, callFqn: thatCallFqn, index: thatIndex } = thatWorkflow;

    const params = {
      workflowA: thisWorkflowId,
      callA: thisCallFqn,
      indexA: thisIndex !== -1 ? thisIndex : undefined,
      workflowB: thatWorkflowId,
      callB: thatCallFqn,
      indexB: thatIndex !== -1 ? thatIndex : undefined,
    };
    const res = await fetchFromProxy(cromwellUrlRoot)(`api/workflows/v1/callcaching/diff?${qs.stringify(params)}`, _.merge(authOpts(), { signal }));
    return res.json();
  },
});
