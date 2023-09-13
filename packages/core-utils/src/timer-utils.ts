/**
 * Returns a Promise that resolves in `ms` milliseconds.
 * @param ms - Time to delay in milliseconds.
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
