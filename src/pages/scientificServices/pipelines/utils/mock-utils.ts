import {
  Pipeline,
  PipelineInput,
  PipelineOutput,
  PipelineRun,
  PipelineRunResponse,
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
        name: 'minDr2ForInclusion',
        displayName: 'minimum imputation quality for inclusion',
        description:
          'The minimum imputation quality (DR2) for inclusion in output VCF. Value must be between 0 and 1 (inclusive). Default is 0.0',
        type: 'FLOAT',
        isRequired: false,
        defaultValue: '0.0',
        minValue: 0,
        maxValue: 1,
      },
      {
        name: 'allowChunkFailures',
        displayName: 'Allow chunk failures',
        description: 'If true, allow up to 10% chunk failure rate. Default false.',
        type: 'BOOLEAN',
        isRequired: false,
      },
      {
        name: 'multiSampleVcf',
        displayName: 'multi-sample VCF file',
        description: 'A bgzipped, multi-sample VCF containing array data from one or more chromosomes to be imputed',
        type: 'FILE',
        isRequired: true,
        fileSuffix: '.vcf.gz',
      },
      {
        name: 'outputBasename',
        displayName: 'output basename',
        description:
          "The prefix for all of the outputs' filenames. May only contain alphanumeric characters, dashes, and underscores",
        type: 'STRING',
        isRequired: true,
      },
      {
        name: 'testManifestInput',
        displayName: 'manifest file',
        description: 'A TSV manifest file',
        type: 'MANIFEST',
        isRequired: false,
        fileSuffix: '.tsv',
      },
    ] as PipelineInput[],
    outputs: [
      {
        name: 'imputedMultiSampleVcf',
        displayName: 'imputed multi-sample VCF',
        type: 'FILE',
        description: 'A multi-sample VCF file containing imputed genotypes for all samples',
      },
      {
        name: 'imputedMultiSampleVcfIndex',
        displayName: 'imputed multi-sample VCF index',
        type: 'FILE',
        description: 'An index file for the imputed multi-sample VCF file',
      },
      {
        name: 'chunksInfo',
        displayName: 'imputation chunks QC tsv',
        type: 'FILE',
        description: 'A TSV file containing QC information about the chunks used during imputation',
      },
    ] as PipelineOutput[],
    pipelineQuota: {
      pipelineName: name,
      defaultQuota: 2500,
      minQuotaConsumed: 175,
      maxQuotaConsumed: 5250,
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
    outputExpirationDate:
      status === 'SUCCEEDED' ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() : undefined, // job outputs expire in 14 days
  };
}

export const mockPipelineRunResponse = (
  status: PipelineRunStatus,
  description?: string,
  citation?: string | null
): PipelineRunResponse => ({
  jobReport: {
    id: 'job-123-456-789',
    status,
    submitted: '2024-01-01T00:00:00Z',
    completed: '2024-01-01T01:00:00Z',
    description: description || undefined,
  },
  pipelineRunReport: {
    pipelineName: 'array_imputation',
    pipelineVersion: 1,
    toolVersion: '1.0.0',
    outputs: {},
    ...(citation !== null && {
      citation:
        citation ||
        'Data Science Services at Broad Clinical Laboratories. (2026, Jul 1). *All of Us + AnVIL Array Imputation* (v2). https://services.terra.bio/',
    }),
  },
});
