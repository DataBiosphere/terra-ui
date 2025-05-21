export interface Pipeline {
  pipelineName: string;
  displayName: string;
  pipelineVersion: number;
  description: string;
}

export interface PipelineList {
  results: Pipeline[];
}

export interface PipelineQuotaWithDetails {
  pipelineName: string;
  quotaLimit: number;
  quotaConsumed: number;
  quotaUnits: string;
}

export interface PipelineRun {
  jobId: string;
  pipelineName: string;
  status: PipelineRunStatus;
  description?: string;
  timeSubmitted: string;
  timeCompleted?: string;
}

export interface GetPipelineRunsResponse {
  totalResults: number;
  pageToken: string;
  results: PipelineRun[];
}

export type PipelineRunStatus = 'PREPARING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
