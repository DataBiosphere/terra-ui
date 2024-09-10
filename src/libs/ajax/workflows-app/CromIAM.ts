import _ from 'lodash/fp';
import * as qs from 'qs';
import { authOpts } from 'src/auth/auth-session';
import { fetchOrchestration } from 'src/libs/ajax/ajax-common';

export const CromIAM = (signal?: AbortSignal) => ({
  callCacheDiff: async (thisWorkflow, thatWorkflow) => {
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
    const res = await fetchOrchestration(
      `api/workflows/v1/callcaching/diff?${qs.stringify(params)}`,
      _.merge(authOpts(), { signal })
    );
    return res.json();
  },

  workflowMetadata: async (workflowId, includeKey, excludeKey) => {
    const res = await fetchOrchestration(
      `api/workflows/v1/${workflowId}/metadata?${qs.stringify({ includeKey, excludeKey }, { arrayFormat: 'repeat' })}`,
      _.merge(authOpts(), { signal })
    );
    return res.json();
  },
});

export type CromIamAjaxContract = ReturnType<typeof CromIAM>;
