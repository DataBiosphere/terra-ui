import _ from 'lodash/fp';
import { authOpts } from 'src/auth/auth-session';
import { fetchTeaspoons } from 'src/libs/ajax/ajax-common';
import { PipelineList, PipelineQuotaWithDetails } from 'src/libs/ajax/teaspoons/teaspoons-models';

export const Teaspoons = (signal?: AbortSignal) => ({
  getPipelines: async (): Promise<PipelineList> => {
    const res = await fetchTeaspoons('pipelines/v1', _.merge(authOpts(), { signal }));
    return res.json();
  },

  getQuotaForPipeline: async (pipelineName: string): Promise<PipelineQuotaWithDetails> => {
    const res = await fetchTeaspoons(`quotas/v1/${pipelineName}`, _.merge(authOpts(), { signal }));
    return res.json();
  },
});
