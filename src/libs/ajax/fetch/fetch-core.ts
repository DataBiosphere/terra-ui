import { abandonedPromise, delay } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import { FetchFn, FetchWrapper } from 'src/libs/ajax/data-client-common';
import { ajaxOverridesStore } from 'src/libs/state';

// Allows use of ajaxOverrideStore to stub responses for testing
export const withInstrumentation =
  (wrappedFetch) =>
  (...args) => {
    return _.flow(
      ..._.map(
        'fn',
        _.filter(({ filter }) => {
          const [url, { method = 'GET' } = {}] = args;
          return _.isFunction(filter)
            ? filter(...args)
            : url.match(filter.url) && (!filter.method || filter.method === method);
        }, ajaxOverridesStore.get())
      )
    )(wrappedFetch)(...args);
  };

// Ignores cancellation error when request is cancelled
export const withCancellation =
  (wrappedFetch) =>
  async (...args) => {
    try {
      return await wrappedFetch(...args);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return abandonedPromise();
      }
      throw error;
    }
  };

// Converts non-200 responses to exceptions
export const withErrorRejection =
  (wrappedFetch) =>
  async (...args) => {
    const res = await wrappedFetch(...args);
    if (res.ok) {
      return res;
    }
    throw res;
  };

export const fetchOk = _.flow(withInstrumentation, withCancellation, withErrorRejection)(fetch);

export const withUrlPrefix = _.curry((prefix, wrappedFetch) => (path, ...args) => {
  return wrappedFetch(prefix + path, ...args);
});

export interface MakeWithRetryOnErrorArgs {
  /** i.e. 5000 - the maximum elapsed timeout (in milliseconds) for sum of all request attempts */
  maxTimeout: number;

  /** i.e. 1500 - the maximum attempt random delay (in milliseconds) that can occur before a request retry */
  maxAttemptDelay: number; // 1500

  /** i.e. 500 - the minimum attempt random delay (in milliseconds) that can occur before a request retry */
  minAttemptDelay: number; // 500
}

/**
 * factory method for withRetryOnError.  Most consumers will likely use pre-made withRetryOnError function
 * @param makeArgs
 */
export const makeWithRetryOnError = (makeArgs: MakeWithRetryOnErrorArgs) => {
  const withRetryOnErrorWrapper =
    (shouldNotRetryFn: (error: unknown) => boolean) =>
    (wrappedFetch: FetchFn) =>
    async (...args: Parameters<FetchFn>) => {
      const timeout = makeArgs.maxTimeout;
      const somePointInTheFuture = Date.now() + timeout;
      const maxDelayIncrement = makeArgs.maxAttemptDelay;
      const minDelay = makeArgs.minAttemptDelay;

      while (Date.now() < somePointInTheFuture) {
        try {
          await delay(minDelay + maxDelayIncrement * Math.random());
          return await wrappedFetch(...args);
        } catch (error) {
          if (shouldNotRetryFn(error)) {
            throw error;
          }
          // else: ignore error, will retry
        }
      }
      return wrappedFetch(...args);
    };
  return withRetryOnErrorWrapper;
};

/**
 * augments a fetch function with logic to keep retrying a request that throws an error.  Request will be retried
 * additional times until a maxTimeout is reached.  The attempt delay will be randomized between a min and max.
 *
 * @param shouldNotRetryFn - function that returns true/false if an error response should result in retries stopping.
 *
 * @return - FetchWrapper function augmentor
 */
export const withRetryOnError = makeWithRetryOnError({
  maxTimeout: 5000,
  maxAttemptDelay: 1500,
  minAttemptDelay: 500,
});

export const DEFAULT_TIMEOUT_DURATION = 10000;
export const DEFAULT_RETRY_COUNT = 5;

export const withRetry =
  (retryCount: number = DEFAULT_RETRY_COUNT, timeoutInMs: number = DEFAULT_TIMEOUT_DURATION): FetchWrapper =>
  (request: FetchFn): FetchFn => {
    const fetchFn: FetchFn = async (...args: Parameters<FetchFn>): ReturnType<FetchFn> => {
      let retriesLeft = retryCount;
      while (retriesLeft >= 0) {
        try {
          const raceResponse = await Promise.race([
            async () => await request(...args),
            // If the request takes longer than allowed, reject it so we try again.
            async () => {
              await delay(timeoutInMs);
              throw new Error('Request timed out');
            },
          ]);
          const response = await raceResponse();

          if (response.ok) {
            return response;
          }
        } catch (error) {
          if (retriesLeft === 0) {
            throw error;
          }
        }

        await new Promise((resolve) => setTimeout(resolve, timeoutInMs));
        retriesLeft--;
      }
      throw Error('Request timed out');
    };
    return fetchFn;
  };
