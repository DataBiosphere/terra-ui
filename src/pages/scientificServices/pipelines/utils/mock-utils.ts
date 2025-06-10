import {
  Pipeline,
  PipelineInput,
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
