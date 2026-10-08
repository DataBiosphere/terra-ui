import { useEffect, useState } from 'react';
import { BackendUtil } from 'src/libs/ajax/BackendUtil';
import { useCancellation } from 'src/libs/react-utils';

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

export type FileSizeState =
  | { status: 'Loading' }
  | { status: 'Ready'; bytes: number; oversized: boolean }
  | { status: 'Unknown' };

/**
 * Pick the size to base the estimate on. The files of an export are imported in parallel, so the
 * largest one determines how long the import takes.
 *
 * @param files - Files reported by cWDS.
 * @returns The largest size, or undefined if no file has a usable size.
 */
export const getLargestFileSize = (files: { sizeBytes: number }[]): number | undefined => {
  const sizes = files.map(({ sizeBytes }) => sizeBytes).filter((bytes) => Number.isFinite(bytes) && bytes > 0);
  return sizes.length === 0 ? undefined : Math.max(...sizes);
};

/**
 * Get the size of the largest file that an import will read.
 *
 * The sizes come from cWDS, via Firecloud Orchestration. Terra UI cannot read them directly:
 * the export buckets do not allow cross origin requests, and `Content-Length` is not a
 * CORS-safelisted response header, so a HEAD request from the browser cannot see the size.
 *
 * cWDS always answers with a list, whether the URL is a manifest listing many AVRO files or a
 * single AVRO file, so this makes no distinction between the two.
 *
 * The size is unknown if the request fails or if no file has a usable size.
 *
 * @param url - URL of the signed url or manifest of signed urls to import, or undefined for imports without a source URL.
 */
export const useFileSize = (url: string | undefined): FileSizeState => {
  const [fileSize, setFileSize] = useState<FileSizeState>({ status: 'Unknown' });
  const signal = useCancellation();

  useEffect(() => {
    if (!url) {
      setFileSize({ status: 'Unknown' });
      return;
    }

    setFileSize({ status: 'Loading' });
    (async () => {
      try {
        const { files } = await BackendUtil(signal).preprocess(url);
        const largestFileSize = getLargestFileSize(files);
        if (largestFileSize === undefined) {
          setFileSize({ status: 'Unknown' });
        } else {
          setFileSize({
            status: 'Ready',
            bytes: largestFileSize,
            oversized: exceedsRecommendedSize(largestFileSize),
          });
        }
      } catch (error) {
        if (!signal.aborted) {
          setFileSize({ status: 'Unknown' });
        }
      }
    })();
  }, [signal, url]);

  return fileSize;
};
