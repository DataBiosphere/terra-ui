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
