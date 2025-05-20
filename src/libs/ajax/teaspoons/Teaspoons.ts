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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const res = await fetchTeaspoons('job/v1/jobs', _.merge(authOpts(), { signal }));
    return mockJobResponse; // TODO: remove mock data
  },
});

export interface JobReport {
  id: string;
  description: string;
  status: TeaspoonsJobStatus;
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

export type TeaspoonsJobStatus = 'PREPARING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';

export const mockJobResponse: GetJobsResponse = {
  totalResults: 2,
  pageToken: '1',
  results: [
    {
      id: '12345',
      description: 'Test job',
      status: 'SUCCEEDED',
      statusCode: '0',
      submitted: 'Feb 2, 2025',
      completed: 'Feb 3, 2025',
      resultURL: 'bazbar',
    },
    {
      id: '67890',
      description: 'Another test job',
      status: 'FAILED',
      statusCode: '1',
      submitted: 'Feb 3, 2025',
      completed: 'Feb 3, 2025',
      resultURL: 'foobar',
    },
    {
      id: '54321',
      description: 'Third test job',
      status: 'RUNNING',
      statusCode: '2',
      submitted: 'Feb 7, 2025',
      completed: '',
      resultURL: '',
    },
  ],
};
