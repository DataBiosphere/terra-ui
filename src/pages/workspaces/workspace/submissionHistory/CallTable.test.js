import { makeBatchJobUrl } from 'src/pages/workspaces/workspace/submissionHistory/CallTable';

describe('makeBatchJobUrl', () => {
  it('builds a GCP Batch console URL from a full Batch resource-name jobId', () => {
    const jobId = 'projects/terra-bb519a4d/locations/us-central1/jobs/job-fe6d19c1-helloworldecho-1-0f9d2497';
    expect(makeBatchJobUrl(jobId)).toBe(
      'https://console.cloud.google.com/batch/jobsDetail/regions/us-central1/jobs/job-fe6d19c1-helloworldecho-1-0f9d2497/details?project=terra-bb519a4d'
    );
  });

  it.each([
    { label: 'undefined jobId', jobId: undefined },
    { label: 'empty jobId', jobId: '' },
    { label: 'a PAPIv2 operation jobId', jobId: 'projects/terra-bb519a4d/operations/abc123' },
    { label: 'an Azure TES jobId', jobId: '117f49d5_59bbe' },
  ])('returns undefined for $label', ({ jobId }) => {
    expect(makeBatchJobUrl(jobId)).toBeUndefined();
  });
});
