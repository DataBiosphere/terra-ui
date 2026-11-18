import { workflowMetadataFilename } from 'src/libs/workflow-metadata';

const workflowId = 'b5ea4c3a-7d4f-4b55-9c4c-2c1c0b2f2f9e';

describe('workflowMetadataFilename', () => {
  it('prefixes the filename with the submission time in UTC, to the minute', () => {
    expect(workflowMetadataFilename(workflowId, { submission: '2026-11-17T20:40:59.999Z' })).toBe(
      `20261117T2040Z-${workflowId}-metadata.json`
    );
  });

  it('uses the submission time even once the workflow has started', () => {
    const metadata = { submission: '2026-11-17T20:40:00.000Z', start: '2026-11-17T20:43:06.032Z' };
    expect(workflowMetadataFilename(workflowId, metadata)).toBe(`20261117T2040Z-${workflowId}-metadata.json`);
  });

  it('converts offset timestamps to UTC', () => {
    expect(workflowMetadataFilename(workflowId, { submission: '2026-11-17T23:59:30.000-05:00' })).toBe(
      `20261118T0459Z-${workflowId}-metadata.json`
    );
  });

  it('leaves off the prefix when there is no usable timestamp', () => {
    expect(workflowMetadataFilename(workflowId, {})).toBe(`${workflowId}-metadata.json`);
    expect(workflowMetadataFilename(workflowId, { submission: 'not a date' })).toBe(`${workflowId}-metadata.json`);
  });
});
