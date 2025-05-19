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

  getAllJobs: async (): Promise<GetJobsResponse> => {
    const res = await fetchTeaspoons('job/v1/jobs', _.merge(authOpts(), { signal }));
    console.log('actual response was: ', await res.json());

    return mockJobResponse;
  },
});

export interface JobReport {
  id: string;
  description: string;
  status: string;
  statusCode: string;
  submitted: string;
  completed: string;
  resultURL: string;
}

export interface GetJobsResponse {
  totalResults: number;
  pageToken: string;
  results: JobReport[];
}

export const mockJobResponse: GetJobsResponse = {
  totalResults: 2,
  pageToken: '1',
  results: [
    {
      id: '12345',
      description: 'Test job',
      status: 'DONE',
      statusCode: '0',
      submitted: '2023-10-01T12:00:00Z',
      completed: '2023-10-02T12:00:00Z',
      resultURL: 'https://example.com/results/12345',
    },
    {
      id: '67890',
      description: 'Another test job',
      status: 'FAILED',
      statusCode: '1',
      submitted: '2023-10-03T12:00:00Z',
      completed: '2023-10-04T12:00:00Z',
      resultURL: 'https://example.com/results/67890',
    },
    {
      id: '54321',
      description: 'Third test job',
      status: 'RUNNING',
      statusCode: '2',
      submitted: '2023-10-05T12:00:00Z',
      completed: '',
      resultURL: '',
    },
  ],
};
