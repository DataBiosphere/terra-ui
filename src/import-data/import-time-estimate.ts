/** Number of bytes in a megabyte. */
const BYTES_PER_MB = 2 ** 20;

/** Estimated number of minutes it takes to import a megabyte of data. */
const MINUTES_PER_MB = 10;

/** Imports larger than this size are expected to have problems. */
export const RECOMMENDED_SIZE_LIMIT_BYTES = 500 * BYTES_PER_MB;

/**
 * Estimate how long importing a file will take.
 *
 * @param bytes - Size of the file to import.
 * @returns Estimated import time, in minutes.
 */
export const estimateImportTimeMinutes = (bytes: number): number => {
  return Math.round((bytes / BYTES_PER_MB) * MINUTES_PER_MB);
};

/**
 * Determine whether a file is larger than the recommended size limit for imports.
 *
 * @param bytes - Size of the file to import.
 */
export const exceedsRecommendedSize = (bytes: number): boolean => bytes > RECOMMENDED_SIZE_LIMIT_BYTES;

/**
 * Format an estimated import time for display.
 *
 * @param bytes - Size of the file to import.
 */
export const formatEstimatedImportTime = (bytes: number): string => {
  const minutes = estimateImportTimeMinutes(bytes);
  return `Estimated import time: ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
};
