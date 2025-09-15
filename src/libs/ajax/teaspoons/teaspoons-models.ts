export interface Pipeline {
  pipelineName: string;
  displayName: string;
  pipelineVersion: number;
  description: string;
}

export interface PipelineInput {
  name: string;
  type: 'FILE' | 'STRING';
  isRequired: boolean;
  fileSuffix?: string; // Only present for FILE types
}

/* Represents the quota settings for a particular pipeline */
export interface PipelineQuota {
  pipelineName: string;
  defaultQuota: number;
  minQuotaConsumed: number;
  quotaUnits: string;
}

/**
 * Interface for POST endpoint /api/pipelines/v1/{pipelineName}
 *
 * API reference:
 * https://teaspoons.dsde-dev.broadinstitute.org/#/pipelines/getPipelineDetails
 */
export interface PipelineWithDetails extends Pipeline {
  type: string; // e.g. "imputation"
  inputs: PipelineInput[];
  pipelineQuota?: PipelineQuota;
}

export interface PipelineList {
  results: Pipeline[];
}

/* Represents an individual user's quota for a particular pipeline */
export interface UserPipelineQuotaDetails {
  pipelineName: string;
  quotaLimit: number;
  quotaConsumed: number;
  quotaUnits: string;
}

export interface PipelineRun {
  jobId: string;
  pipelineName: string;
  pipelineVersion?: number;
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

export interface PreparePipelineRunResponse {
  fileInputUploadUrls: Record<string, { signedUrl: string }>;
  jobId: string;
}

export interface StartPipelineResponse {
  jobReport: {
    id: string; // UUIDv4 job ID
    description: string;
    status: PipelineRunStatus;
    statusCode: number; // HTTP status code
    submitted: string; // ISO 8601 datetime
    resultURL: string;
  };
  pipelineRunReport: {
    pipelineName: string;
    pipelineVersion: number;
    toolVersion: string;
  };
}

export interface PipelineRunResponse {
  jobReport: PipelineJobReport;
  errorReport?: PipelineRunErrorReport;
  pipelineRunReport: PipelineRunReport;
}

export interface PipelineJobReport {
  id: string;
  description?: string;
  status: PipelineRunStatus;
  statusCode?: number;
  submitted: string;
  completed?: string;
  resultURL?: string;
}

export interface PipelineRunErrorReport {
  message: string;
  errorCode: number;
  causes: string[];
}

export interface PipelineRunReport {
  pipelineName: string;
  pipelineVersion: number;
  toolVersion: string;
  outputs?: Record<string, string>;
  outputExpirationDate?: string;
}

export type PipelineRunStatus = 'PREPARING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
