import { jsonBody } from '@terra-ui-packages/data-client-core';
import _ from 'lodash/fp';
import { authOpts } from 'src/auth/auth-session';
import { fetchTeaspoons } from 'src/libs/ajax/ajax-common';
import {
  GetPipelineRunsResponse,
  PipelineList,
  PipelineWithDetails,
  PreparePipelineRunResponse,
  // StartPipelineRunResponse,
  UserPipelineQuotaDetails,
} from 'src/libs/ajax/teaspoons/teaspoons-models';

export const Teaspoons = (signal?: AbortSignal) => ({
  /* Lists all pipelines available to the user */
  getPipelines: async (): Promise<PipelineList> => {
    const res = await fetchTeaspoons('pipelines/v1', _.merge(authOpts(), { signal }));
    return res.json();
  },

  /* Returns information about the given pipeline version, including default quota information */
  getPipelineDetails: async (pipelineName: string, pipelineVersion: number): Promise<PipelineWithDetails> => {
    const res = await fetchTeaspoons(
      `pipelines/v1/${pipelineName}`,
      _.mergeAll([authOpts(), jsonBody({ pipelineVersion }), { signal, method: 'POST' }])
    );
    return res.json();
  },

  /* Returns the amount of quota consumed by the user for the given pipeline */
  getQuotaForPipeline: async (pipelineName: string): Promise<UserPipelineQuotaDetails> => {
    const res = await fetchTeaspoons(`quotas/v1/${pipelineName}`, _.merge(authOpts(), { signal }));
    return res.json();
  },

  /* Returns a list of pipeline runs for the user */
  getAllPipelineRuns: async (pageSize: number, pageToken?: string): Promise<GetPipelineRunsResponse> => {
    const queryString = `?limit=${pageSize}${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const res = await fetchTeaspoons(`pipelineruns/v1/pipelineruns${queryString}`, _.merge(authOpts(), { signal }));
    return res.json();
  },

  preparePipelineRun: async (
    jobId: string,
    pipelineName: string,
    pipelineVersion: number,
    pipelineInputs: Record<string, any>,
    description: string
  ): Promise<PreparePipelineRunResponse> => {
    const res = await fetchTeaspoons(
      'pipelineruns/v1/prepare',
      _.mergeAll([
        authOpts(),
        jsonBody({
          jobId,
          pipelineName,
          pipelineVersion,
          pipelineInputs,
          description,
        }),
        { signal, method: 'POST' },
      ])
    );
    return res.json();
  },

  startPipelineRun: async (jobId: string): Promise<Record<string, any>> => {
    const res = await fetchTeaspoons(
      'pipelineruns/v1/start',
      _.mergeAll([
        authOpts(),
        jsonBody({
          jobControl: { id: jobId },
        }),
        { signal, method: 'POST' },
      ])
    );
    return res.json();
  },
});

export type TeaspoonsContract = ReturnType<typeof Teaspoons>;
