import { reverse } from 'lodash';
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

  getAllJobs: async (pageSize: number, pageToken?: string): Promise<GetJobsResponse> => {
    // const queryString = `?pageSize=${pageSize}${pageToken ? `&pageToken=${pageToken}` : ''}`;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // const res = await fetchTeaspoons(`job/v1/jobs${queryString}`, _.merge(authOpts(), { signal }));

    if (pageToken === '1') {
      return {
        totalResults: 12,
        pageToken: '2',
        results: mockJobResponse.results.slice(0, pageSize),
      };
    }

    return {
      totalResults: 12,
      pageToken: '3',
      results: mockJobResponse.results.slice(pageSize, pageSize * 2),
    };
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
  quotaConsumed?: number;
}

export interface GetJobsResponse {
  totalResults: number;
  pageToken: string;
  results: JobReport[];
}

export type TeaspoonsJobStatus = 'PREPARING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';

export const mockJobResponse: GetJobsResponse = {
  totalResults: 12,
  pageToken: '1',
  results: reverse([
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
    {
      id: '98765',
      description: 'Fourth test job',
      status: 'PREPARING',
      statusCode: '3',
      submitted: 'Feb 8, 2025',
      completed: '',
      resultURL: '',
    },
    {
      id: '11111',
      description: 'Fifth test job',
      status: 'SUCCEEDED',
      statusCode: '0',
      submitted: 'Feb 9, 2025',
      completed: 'Feb 10, 2025',
      resultURL: 'foobar',
    },
    {
      id: '22222',
      description: 'Sixth test job',
      status: 'FAILED',
      statusCode: '1',
      submitted: 'Feb 11, 2025',
      completed: 'Feb 12, 2025',
      resultURL: 'bazbar',
    },
    {
      id: '33333',
      description: 'Seventh test job',
      status: 'RUNNING',
      statusCode: '2',
      submitted: 'Feb 13, 2025',
      completed: '',
      resultURL: '',
    },
    {
      id: '44444',
      description: 'Eighth test job',
      status: 'PREPARING',
      statusCode: '3',
      submitted: 'Feb 14, 2025',
      completed: '',
      resultURL: '',
    },
    {
      id: '55555',
      description: 'Ninth test job',
      status: 'SUCCEEDED',
      statusCode: '0',
      submitted: 'Feb 15, 2025',
      completed: 'Feb 16, 2025',
      resultURL: 'foobar',
    },
    {
      id: '66666',
      description: 'Tenth test job',
      status: 'FAILED',
      statusCode: '1',
      submitted: 'Feb 17, 2025',
      completed: 'Feb 18, 2025',
      resultURL: 'bazbar',
    },
    {
      id: '77777',
      description:
        'Eleventh test job also this is an extremely long description lets see if it breaks the table maybe it does maybe it doesnt but we cant really be sure until we see it with our own eyes',
      status: 'RUNNING',
      statusCode: '2',
      submitted: 'Feb 19, 2025',
      completed: '',
      resultURL: '',
    },
    {
      id: '88888',
      description: 'Twelfth test job',
      status: 'PREPARING',
      statusCode: '3',
      submitted: 'Feb 20, 2025',
      completed: '',
      resultURL: '',
    },
  ]),
};
