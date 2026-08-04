import { jsonBody } from '@terra-ui-packages/data-client-core';
import _ from 'lodash/fp';
import * as qs from 'qs';
import { authOpts } from 'src/auth/auth-session';
import { fetchTeaspoons, fetchTeaspoonsPublic } from 'src/libs/ajax/ajax-common';
import {
  DataDeliveryJobReport,
  GetPipelineRunsResponse,
  PipelineList,
  PipelineRunOutputSignedUrlsResponse,
  PipelineRunResponse,
  PipelineWithDetails,
  PreparePipelineRunResponse,
  StartPipelineResponse,
  TeaspoonsDocType,
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
    description: string,
    agreeToTerms: boolean
  ): Promise<PreparePipelineRunResponse> => {
    const res = await fetchTeaspoons(
      'pipelineruns/v3/prepare',
      _.mergeAll([
        authOpts(),
        jsonBody({
          jobId,
          pipelineName,
          pipelineVersion,
          pipelineInputs,
          description,
          useResumableUploads: true,
          agreeToTerms,
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
    const res = await fetchTeaspoons(`pipelineruns/v3/result/${jobId}`, _.merge(authOpts(), { signal }));
    return res.json();
  },

  getPipelineRunOutputSignedUrls: async (jobId: string): Promise<PipelineRunOutputSignedUrlsResponse> => {
    const res = await fetchTeaspoons(
      `pipelineruns/v2/result/${jobId}/output/signed-urls`,
      _.merge(authOpts(), { signal })
    );
    return res.json();
  },

  deliverData: async (pipelineRunId: string, gcsPath: string): Promise<DataDeliveryJobReport> => {
    const res = await fetchTeaspoons(
      `pipelineruns/v1/result/${pipelineRunId}/output/deliver-to-cloud`,
      _.mergeAll([
        authOpts(),
        jsonBody({
          destinationGcsPath: gcsPath,
        }),
        { signal, method: 'POST' },
      ])
    );

    return res.json();
  },

  getDocs: async (docKey: TeaspoonsDocType): Promise<string> => {
    const res = await fetchTeaspoonsPublic(`docs?docType=${docKey}`, { signal });
    return res.text();
  },
});

export type TeaspoonsContract = ReturnType<typeof Teaspoons>;
