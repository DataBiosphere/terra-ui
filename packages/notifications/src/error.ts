import { AnyPromiseFn } from '@terra-ui-packages/core-utils';

export type ErrorCallback = (error: unknown) => void | Promise<void>;

/**
 * Invoke the `callback` with any error thrown when evaluating the async `fn` with `...args`.
 */
export const withErrorHandling = (callback: ErrorCallback) => {
  return <F extends AnyPromiseFn>(fn: F) => {
    return (async (...args: Parameters<F>) => {
      try {
        return await fn(...args);
      } catch (error) {
        await callback(error);
      }
    }) as F;
  };
};

/**
 * Return a Promise to the result of evaluating the async `fn` with `...args` or undefined if
 * evaluation fails.
 */
export const withErrorIgnoring = withErrorHandling(() => {});
