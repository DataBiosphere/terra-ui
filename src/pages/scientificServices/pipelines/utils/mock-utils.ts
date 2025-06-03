// mockPipeline function

// returns a mock Pipeline object with the given name
import { Pipeline, PipelineWithDetails, UserPipelineQuotaDetails } from 'src/libs/ajax/teaspoons/teaspoons-models';

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
