import {
  estimateImportTimeMinutes,
  exceedsRecommendedSize,
  formatEstimatedImportTime,
  getLargestFileSize,
  RECOMMENDED_SIZE_LIMIT_BYTES,
} from './import-time-estimate';

const MB = 2 ** 20;

describe('estimateImportTimeMinutes', () => {
  it.each([
    { bytes: 1 * MB, expectedMinutes: 10 },
    { bytes: 2 * MB, expectedMinutes: 20 },
    { bytes: 100 * MB, expectedMinutes: 1000 },
  ])('estimates $expectedMinutes minutes for $bytes bytes', ({ bytes, expectedMinutes }) => {
    expect(estimateImportTimeMinutes(bytes)).toBe(expectedMinutes);
  });

  it('rounds to whole minutes', () => {
    // 0.25 MB is 2.5 minutes.
    expect(estimateImportTimeMinutes(0.25 * MB)).toBe(3);
  });

  it('never estimates less than a minute', () => {
    expect(estimateImportTimeMinutes(1024)).toBe(1);
  });
});

describe('exceedsRecommendedSize', () => {
  it.each([
    { bytes: RECOMMENDED_SIZE_LIMIT_BYTES - 1, expected: false },
    { bytes: RECOMMENDED_SIZE_LIMIT_BYTES, expected: false },
    { bytes: RECOMMENDED_SIZE_LIMIT_BYTES + 1, expected: true },
  ])('returns $expected for $bytes bytes', ({ bytes, expected }) => {
    expect(exceedsRecommendedSize(bytes)).toBe(expected);
  });
});

describe('formatEstimatedImportTime', () => {
  it('describes the estimate in minutes', () => {
    expect(formatEstimatedImportTime(2 * MB)).toBe('Estimated import time: 20 minutes');
  });

  it('uses the singular for a one minute estimate', () => {
    expect(formatEstimatedImportTime(0.1 * MB)).toBe('Estimated import time: 1 minute');
  });
});

describe('getLargestFileSize', () => {
  it('returns the largest size, because the files are imported in parallel', () => {
    expect(getLargestFileSize([{ sizeBytes: 1 * MB }, { sizeBytes: 5 * MB }, { sizeBytes: 3 * MB }])).toBe(5 * MB);
  });

  it('returns the only size for a single file', () => {
    expect(getLargestFileSize([{ sizeBytes: 7 * MB }])).toBe(7 * MB);
  });

  it('ignores sizes that cannot be used in an estimate', () => {
    const files = [{ sizeBytes: 0 }, { sizeBytes: -1 }, { sizeBytes: NaN }, { sizeBytes: 2 * MB }];
    expect(getLargestFileSize(files)).toBe(2 * MB);
  });

  it.each([
    { scenario: 'no files', files: [] },
    { scenario: 'no usable size', files: [{ sizeBytes: 0 }] },
  ])('returns undefined when cWDS reports $scenario', ({ files }) => {
    expect(getLargestFileSize(files)).toBeUndefined();
  });
});
