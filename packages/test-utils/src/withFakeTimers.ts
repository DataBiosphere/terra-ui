/**
 * Wrap a test function in useFakeTimers/useRealTimers.
 */
export const withFakeTimers =
  <F extends (...args: any[]) => any>(fn: F) =>
  (...args: Parameters<F>): ReturnType<F> => {
    try {
      jest.useFakeTimers();
      return fn(...args);
    } finally {
      // "It's important to also call runOnlyPendingTimers before switching to real timers.
      // This will ensure you flush all the pending timers before you switch to real timers."
      // -- https://testing-library.com/docs/using-fake-timers/
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    }
  };
