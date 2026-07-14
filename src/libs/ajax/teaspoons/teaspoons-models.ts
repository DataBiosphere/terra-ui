export interface Pipeline {
  pipelineName: string;
  displayName: string;
  pipelineVersion: number;
  description: string;
}

export type PipelineIOType = 'FILE' | 'STRING' | 'FLOAT' | 'BOOLEAN' | 'MANIFEST';

export interface PipelineInput {
  name: string;
  type: PipelineIOType | string; // Prefer a defined type, but allow for future types without breaking
  isRequired: boolean;
  displayName?: string;
  description?: string;
  defaultValue?: string;
  fileSuffix?: string; // Optional, and only for FILE types
  minValue?: number; // Optional, and only for FLOAT types
  maxValue?: number; // Optional, and only for FLOAT types
}

export interface PipelineOutput {
  name: string;
  type: PipelineIOType | string; // Prefer a defined type, but allow for future types without breaking
  displayName?: string;
  description?: string;
}

/* Represents the quota settings for a particular pipeline */
export interface PipelineQuota {
  pipelineName: string;
  defaultQuota: number;
  minQuotaConsumed: number;
  maxQuotaConsumed?: number;
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
  outputs: PipelineOutput[];
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
  outputExpirationDate?: string;
}

export interface GetPipelineRunsResponse {
  totalResults: number;
  totalFilteredResults: number;
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

export type DataDeliveryJobStatus = 'RUNNING' | 'SUCCEEDED' | 'FAILED';

export interface DataDeliveryReport {
  status: DataDeliveryJobStatus;
  destination: string;
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

export interface DataDeliveryJobReport {
  id: string;
  description?: string;
  status: DataDeliveryJobStatus;
  statusCode: number;
  submitted: string;
  completed: string;
  resultURL: string;
}

export interface PipelineRunErrorReport {
  message: string;
  errorCode: number;
  causes: string[];
}

export interface PipelineOutputFileMetadata {
  sizeInBytes?: number;
}

export interface PipelineOutputValue {
  value: string;
  metadata?: PipelineOutputFileMetadata;
}

export interface PipelineRunReport {
  pipelineName: string;
  pipelineVersion: number;
  toolVersion: string;
  outputs?: Record<string, PipelineOutputValue>;
  userInputs?: Record<string, string>;
  outputExpirationDate?: string;
  inputSize?: number;
  inputSizeUnits?: string;
  quotaConsumed?: number;
  dataDeliveryReport?: DataDeliveryReport;
  citation?: string;
}

export interface PipelineRunOutputSignedUrlsResponse {
  jobId: string;
  outputSignedUrls: Record<string, string>;
  outputExpirationDate: string;
}

export type PipelineRunStatus = 'PREPARING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';

export type TeaspoonsDocType = 'termsOfService' | 'acceptableUsePolicy';
