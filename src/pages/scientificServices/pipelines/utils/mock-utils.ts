import {
  Pipeline,
  PipelineInput,
  PipelineRun,
  PipelineRunStatus,
  PipelineWithDetails,
  UserPipelineQuotaDetails,
} from 'src/libs/ajax/teaspoons/teaspoons-models';

export function mockPipeline(name: string): Pipeline {
  return {
    pipelineName: name,
    displayName: `${name} display name`,
    pipelineVersion: 1,
    description: `description for ${name}`,
  };
}

export function mockPipelineWithDetails(name: string): PipelineWithDetails {
  return {
    ...mockPipeline(name),
    type: 'test-type',
    inputs: [
      {
        name: 'testInput',
        type: 'FILE',
        isRequired: true,
        fileSuffix: '.vcf.gz',
      },
    ] as PipelineInput[],
    pipelineQuota: {
      pipelineName: name,
      defaultQuota: 2500,
      minQuotaConsumed: 175,
      quotaUnits: 'units',
    },
  };
}

export function mockUserPipelineQuotaDetails(name: string): UserPipelineQuotaDetails {
  return {
    pipelineName: name,
    quotaLimit: 2000,
    quotaConsumed: 750,
    quotaUnits: 'things',
  };
}

export function mockPipelineRun(status: PipelineRunStatus): PipelineRun {
  return {
    jobId: 'run-id-123',
    pipelineName: 'array_imputation',
    status,
    description: 'Test pipeline run',
    timeSubmitted: '2023-10-01T00:00:00Z',
    timeCompleted: status === 'SUCCEEDED' || status === 'FAILED' ? '2023-10-01T01:00:00Z' : undefined,
    quotaConsumed: status === 'SUCCEEDED' ? 500 : undefined,
  };
}
