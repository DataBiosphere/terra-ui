import _ from 'lodash/fp';
import { authOpts } from 'src/auth/auth-session';
import { fetchTeaspoons } from 'src/libs/ajax/ajax-common';
import {
  GetPipelineRunsResponse,
  PipelineList,
  PipelineQuotaWithDetails,
} from 'src/libs/ajax/teaspoons/teaspoons-models';

export const Teaspoons = (signal?: AbortSignal) => ({
  getPipelines: async (): Promise<PipelineList> => {
    const res = await fetchTeaspoons('pipelines/v1', _.merge(authOpts(), { signal }));
    return res.json();
  },

  getQuotaForPipeline: async (pipelineName: string): Promise<PipelineQuotaWithDetails> => {
    const res = await fetchTeaspoons(`quotas/v1/${pipelineName}`, _.merge(authOpts(), { signal }));
    return res.json();
  },

  getAllPipelineRuns: async (pageSize: number, pageToken?: string): Promise<GetPipelineRunsResponse> => {
    const queryString = `?limit=${pageSize}${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const res = await fetchTeaspoons(`pipelineruns/v1/pipelineruns${queryString}`, _.merge(authOpts(), { signal }));
    return res.json();
  },
});

export type TeaspoonsContract = ReturnType<typeof Teaspoons>;
