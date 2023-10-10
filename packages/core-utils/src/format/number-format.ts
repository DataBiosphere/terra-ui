/**
 * Format a size in bytes for display.
 *
 * Formats the size in kibibytes, mebibtyes, gibibytes, etc.
 */
export const formatBytes = (bytes: number): string => {
  const prefixes: [string, number][] = [
    ['P', 2 ** 50],
    ['T', 2 ** 40],
    ['G', 2 ** 30],
    ['M', 2 ** 20],
    ['K', 2 ** 10],
  ];
  const maybePrefixAndDivisor = prefixes.find(([_prefix, divisor]) => bytes >= divisor);
  if (maybePrefixAndDivisor) {
    const [prefix, divisor] = maybePrefixAndDivisor;
    return `${(bytes / divisor).toPrecision(3)} ${prefix}iB`;
  }
  return `${bytes} B`;
};

const numberFormatter = new Intl.NumberFormat('en-US');

/**
 * Format a number for display.
 */
export const formatNumber = (n: number): string => numberFormatter.format(n);

const usdFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/**
 * Format a dollar amount for display.
 */
export const formatUSD = (value: number): string => {
  if (Number.isNaN(value)) {
    return 'unknown';
  }

  if (value > 0 && value < 0.01) {
    return '< $0.01';
  }

  return usdFormatter.format(value);
};
