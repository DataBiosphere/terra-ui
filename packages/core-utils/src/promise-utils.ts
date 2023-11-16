/**
 * Returns a promise that will never resolve or reject.
 *
 * Useful for cancelling async flows.
 */
export const abandonedPromise = (): Promise<any> => {
  return new Promise(() => {});
};
