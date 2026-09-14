import { useCallback, useRef } from 'react';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { TEASPOONS_SIGNED_URL_CACHE_TTL_MS } from 'src/pages/scientificServices/pipelines/common/teaspoons-service-constants';
import {
  MOCK_FILE_ARRAY_JOB_ID,
  mockFileArrayOutputSignedUrls,
} from 'src/pages/scientificServices/pipelines/utils/mock-file-array-example';

// FILE_ARRAY outputs have one signed URL per file; all other output types have a single URL
export type OutputSignedUrls = Record<string, string | string[]>;

// Resolves a possibly-array value (FILE_ARRAY outputs/signed urls) at the given index, or returns it as-is otherwise
function resolveAtIndex<T>(valueOrArray: T | T[] | undefined, index?: number): T | undefined {
  if (!Array.isArray(valueOrArray)) {
    return valueOrArray;
  }
  return index !== undefined ? valueOrArray[index] : undefined;
}

interface CacheEntry {
  jobId: string;
  fetchedAt: number;
  urls: Promise<OutputSignedUrls>;
}

export interface UseOutputSignedUrlsResult {
  /**
   * Returns the signed URL for one of the job's outputs, fetching the job's signed URLs if we don't
   * already have an unexpired copy of them. Resolves to undefined if the output has no URL.
   */
  getSignedUrl: (outputKey: string, index?: number) => Promise<string | undefined>;
}

/**
 * Fetches the signed URLs for a job's outputs on demand, and caches them so that downloading several
 * files from the same job doesn't make Teaspoons regenerate signed URLs on every click.
 *
 * The in-flight promise (not the resolved value) is what gets cached, so rapid clicks on different
 * files share a single request rather than racing to start their own.
 */
export const useOutputSignedUrls = (jobId: string): UseOutputSignedUrlsResult => {
  const cache = useRef<CacheEntry | null>(null);

  const getSignedUrls = useCallback((): Promise<OutputSignedUrls> => {
    const cached = cache.current;
    if (cached && cached.jobId === jobId && Date.now() - cached.fetchedAt < TEASPOONS_SIGNED_URL_CACHE_TTL_MS) {
      return cached.urls;
    }

    const urls =
      jobId === MOCK_FILE_ARRAY_JOB_ID
        ? Promise.resolve(mockFileArrayOutputSignedUrls.outputSignedUrls)
        : Teaspoons()
            .getPipelineRunOutputSignedUrls(jobId)
            .then((response) => response.outputSignedUrls);

    const entry: CacheEntry = { jobId, fetchedAt: Date.now(), urls };
    cache.current = entry;

    // don't hang on to a failed fetch - the next download attempt should be able to retry
    urls.catch(() => {
      if (cache.current === entry) {
        cache.current = null;
      }
    });

    return urls;
  }, [jobId]);

  const getSignedUrl = useCallback(
    async (outputKey: string, index?: number): Promise<string | undefined> => {
      const urls = await getSignedUrls();
      return resolveAtIndex(urls[outputKey], index);
    },
    [getSignedUrls]
  );

  return { getSignedUrl };
};
