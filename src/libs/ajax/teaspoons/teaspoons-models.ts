export interface Pipeline {
  pipelineName: string;
  displayName: string;
  pipelineVersion: number;
  description: string;
}

export interface PipelineQuota {
  pipelineName: string;
  defaultQuota: number;
  minQuotaConsumed: number;
  quotaUnits: string;
}

export interface PipelineWithDetails extends Pipeline {
  pipelineQuota: PipelineQuota;
}

export interface PipelineList {
  results: Pipeline[];
}

/* Represents the user quota */
export interface UserPipelineQuotaDetails {
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
  quotaConsumed?: number;
}

export interface GetPipelineRunsResponse {
  totalResults: number;
  pageToken: string;
  results: PipelineRun[];
}

export type PipelineRunStatus = 'PREPARING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
