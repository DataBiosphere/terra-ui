import {
  Pipeline,
  PipelineInput,
  PipelineOutput,
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
    outputs: [
      {
        name: 'imputedMultiSampleVcf',
        type: 'FILE',
        description: 'A multi-sample VCF file containing imputed genotypes for all samples',
      },
      {
        name: 'imputedMultiSampleVcfIndex',
        type: 'FILE',
        description: 'An index file for the imputed multi-sample VCF file',
      },
      {
        name: 'chunksInfo',
        type: 'FILE',
        description: 'A TSV file containing QC information about the chunks used during imputation',
      },
    ] as PipelineOutput[],
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
    pipelineVersion: 1,
    status,
    description: 'Test pipeline run',
    timeSubmitted: '2023-10-01T00:00:00Z',
    timeCompleted: status === 'SUCCEEDED' || status === 'FAILED' ? new Date().toISOString() : undefined,
    quotaConsumed: status === 'SUCCEEDED' ? 500 : undefined,
  };
}
