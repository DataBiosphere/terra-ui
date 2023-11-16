import { formatBytes, formatNumber, formatUSD } from './number-format';

describe('formatBytes', () => {
  const testCases: { value: number; expectedOutput: string }[] = [
    { value: 40000000000, expectedOutput: '37.3 GiB' },
    { value: 40000000, expectedOutput: '38.1 MiB' },
    { value: 40, expectedOutput: '40 B' },
  ];

  it.each(testCases)('formats $value as $expectedOutput', ({ value, expectedOutput }) => {
    // Act
    const result = formatBytes(value);

    // Assert
    expect(result).toBe(expectedOutput);
  });
});

describe('formatNumber', () => {
  const testCases: { value: number; expectedOutput: string }[] = [
    { value: 99.99, expectedOutput: '99.99' },
    { value: 99.999, expectedOutput: '99.999' },
    { value: 99.9999, expectedOutput: '100' },
    { value: 10, expectedOutput: '10' },
    { value: 0.1, expectedOutput: '0.1' },
    { value: 0.01, expectedOutput: '0.01' },
    { value: 0, expectedOutput: '0' },
    { value: 0 / 0, expectedOutput: 'NaN' },
  ];

  it.each(testCases)('formats $value as $expectedOutput', ({ value, expectedOutput }) => {
    // Act
    const result = formatNumber(value);

    // Assert
    expect(result).toBe(expectedOutput);
  });
});

describe('formatUSD', () => {
  const testCases: { value: number; expectedOutput: string }[] = [
    { value: 99.99, expectedOutput: '$99.99' },
    { value: 10, expectedOutput: '$10.00' },
    { value: 0.1, expectedOutput: '$0.10' },
    { value: 0.001, expectedOutput: '< $0.01' },
    { value: 0, expectedOutput: '$0.00' },
    { value: 0 / 0, expectedOutput: 'unknown' },
  ];

  it.each(testCases)('formats $value as $expectedOutput', ({ value, expectedOutput }) => {
    // Act
    const result = formatUSD(value);

    // Assert
    expect(result).toBe(expectedOutput);
  });
});
