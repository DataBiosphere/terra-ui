import { jsonBody } from '@terra-ui-packages/data-client-core';
import _ from 'lodash/fp';
import * as qs from 'qs';
import { authOpts } from 'src/auth/auth-session';
import { fetchTeaspoons } from 'src/libs/ajax/ajax-common';
import {
  GetPipelineRunsResponse,
  PipelineList,
  PipelineRunOutputSignedUrlsResponse,
  PipelineRunResponse,
  PipelineWithDetails,
  PreparePipelineRunResponse,
  StartPipelineResponse,
  UserPipelineQuotaDetails,
} from 'src/libs/ajax/teaspoons/teaspoons-models';
import { FilterValues } from 'src/pages/scientificServices/pipelines/tabs/history/controls/TableFilters';

export const Teaspoons = (signal?: AbortSignal) => ({
  /* Lists all pipelines available to the user */
  getPipelines: async (): Promise<PipelineList> => {
    const res = await fetchTeaspoons('pipelines/v1', _.merge(authOpts(), { signal }));
    return res.json();
  },

  /* Returns information about the given pipeline version, including default quota information */
  getPipelineDetails: async (pipelineName: string, pipelineVersion: number): Promise<PipelineWithDetails> => {
    // Mock data for testing second pipeline
    if (pipelineName === 'lowpass_wgs_imputation') {
      return Promise.resolve({
        pipelineName: 'lowpass_wgs_imputation',
        displayName: 'All of Us + AnVIL Lowpass WGS Imputation',
        pipelineVersion: 1,
        description: 'Mock pipeline for testing quota display',
        type: 'imputation',
        inputs: [],
        outputs: [],
        pipelineQuota: {
          pipelineName: 'lowpass_wgs_imputation',
          defaultQuota: 100,
          minQuotaConsumed: 750,
          quotaUnits: 'samples',
        },
      });
    }
    // Mock data for SV Imputation pipeline
    if (pipelineName === 'sv_imputation') {
      return Promise.resolve({
        pipelineName: 'sv_imputation',
        displayName: 'All of Us + AnVIL SV Imputation',
        pipelineVersion: 1,
        description: 'Structural variant imputation pipeline',
        type: 'imputation',
        inputs: [],
        outputs: [],
        pipelineQuota: {
          pipelineName: 'sv_imputation',
          defaultQuota: 1000,
          minQuotaConsumed: 750,
          quotaUnits: 'samples',
        },
      });
    }
    const res = await fetchTeaspoons(
      `pipelines/v1/${pipelineName}`,
      _.mergeAll([authOpts(), jsonBody({ pipelineVersion }), { signal, method: 'POST' }])
    );
    return res.json();
  },

  /* Returns the amount of quota consumed by the user for the given pipeline */
  getQuotaForPipeline: async (pipelineName: string): Promise<UserPipelineQuotaDetails> => {
    // Mock data for testing second pipeline
    if (pipelineName === 'lowpass_wgs_imputation') {
      return Promise.resolve({
        pipelineName: 'lowpass_wgs_imputation',
        quotaLimit: 10000,
        quotaConsumed: 9651,
        quotaUnits: 'samples',
      });
    }
    // Mock data for SV Imputation pipeline
    if (pipelineName === 'sv_imputation') {
      return Promise.resolve({
        pipelineName: 'sv_imputation',
        quotaLimit: 1000,
        quotaConsumed: 100,
        quotaUnits: 'samples',
      });
    }
    const res = await fetchTeaspoons(`quotas/v1/${pipelineName}`, _.merge(authOpts(), { signal }));
    return res.json();
  },

  /* Returns a list of pipeline runs for the user */
  getAllPipelineRuns: async (
    pageSize: number,
    pageNumber: number,
    sortProperty?: string,
    sortDirection?: string,
    filters?: FilterValues
  ): Promise<GetPipelineRunsResponse> => {
    const { status, description, jobId, pipelineName } = filters || {};

    const queryString = qs.stringify(
      {
        pageSize,
        pageNumber,
        ...(sortProperty ? { sortProperty } : {}),
        ...(sortDirection ? { sortDirection } : {}),
        ...(status ? { status } : {}),
        ...(description ? { description } : {}),
        ...(jobId ? { jobId } : {}),
        ...(pipelineName ? { pipelineName } : {}),
      },
      { addQueryPrefix: true }
    );

    const res = await fetchTeaspoons(`pipelineruns/v2/pipelineruns${queryString}`, _.merge(authOpts(), { signal }));
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
      'pipelineruns/v2/prepare',
      _.mergeAll([
        authOpts(),
        jsonBody({
          jobId,
          pipelineName,
          pipelineVersion,
          pipelineInputs,
          description,
          useResumableUploads: true,
        }),
        { signal, method: 'POST' },
      ])
    );
    return res.json();
  },

  startPipelineRun: async (jobId: string): Promise<StartPipelineResponse> => {
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

  getPipelineRunResult: async (jobId: string): Promise<PipelineRunResponse> => {
    const res = await fetchTeaspoons(`pipelineruns/v2/result/${jobId}`, _.merge(authOpts(), { signal }));
    return res.json();
  },

  getPipelineRunOutputSignedUrls: async (jobId: string): Promise<PipelineRunOutputSignedUrlsResponse> => {
    const res = await fetchTeaspoons(
      `pipelineruns/v2/result/${jobId}/output/signed-urls`,
      _.merge(authOpts(), { signal })
    );
    return res.json();
  },
});

export type TeaspoonsContract = ReturnType<typeof Teaspoons>;
