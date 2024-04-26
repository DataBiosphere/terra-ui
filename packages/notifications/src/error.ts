import { AnyPromiseFn } from '@terra-ui-packages/core-utils';

import { NotificationsContract, Notifier } from './useNotifications';

export type ErrorCallback = (error: unknown) => void | Promise<void>;

/**
 * Should return true of a given error should be ignored
 */
export type IgnoreErrorDecider = (title: string, obj?: unknown) => boolean;

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

/**
 * allows composition of NotificationsContract dependency when useful for code reuse
 * @param notifier
 */
export const makeNotificationsContract = (
  notifier: Notifier,
  ignoreError: IgnoreErrorDecider
): NotificationsContract => ({
  notify: notifier.notify,

  reportError: async (title: string, obj?: unknown) => {
    console.error(title, obj); // helpful when the notify component fails to render
    // Do not show an error notification if error should be ignored
    if (ignoreError(title, obj)) {
      return;
    }
    const detail = await (obj instanceof Response ? obj.text().catch(() => 'Unknown error') : obj);
    notifier.notify('error', title, { detail });
  },

  /**
   * Return a Promise to the result of evaluating the async `fn` with `...args`. If evaluation fails,
   * report the error to the user with `title` as a side effect.
   */
  reportErrorAndRethrow: (title: string) => {
    return <F extends AnyPromiseFn>(fn: F) =>
      withErrorHandling(async (error): Promise<void> => {
        await makeNotificationsContract(notifier, ignoreError).reportError(title, error);
        throw error;
      })(fn);
  },

  /**
   *  This function is designed for use in modals.
   *  Modals can overlay any error reporting, with the `throw` in the default `withErrorReporting`
   *  preventing the modal itself from closing on error
   *  As such, we must ensure we call the dismiss function if an error occurs
   */
  withErrorReportingInModal: (title: string, onDismiss: () => void) => {
    return withErrorHandling(async (error) => {
      await makeNotificationsContract(notifier, ignoreError).reportError(title, error);
      onDismiss();
      throw error;
    });
  },

  /**
   * Return a Promise to the result of evaluating the async `fn` with `...args` or undefined if
   * evaluation fails. If evaluation fails, report the error to the user with `title`.
   */
  withErrorReporting: (title: string) => {
    return <F extends AnyPromiseFn>(fn: F) =>
      withErrorIgnoring(makeNotificationsContract(notifier, ignoreError).reportErrorAndRethrow(title)(fn)) as F;
  },
});
