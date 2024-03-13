import { AnyPromiseFn } from '@terra-ui-packages/core-utils';
import { sessionTimedOutErrorMessage } from 'src/auth/auth-errors';
import { notify } from 'src/libs/notifications';

export const reportError = async (title: string, obj?: unknown) => {
  console.error(title, obj); // helpful when the notify component fails to render
  // Do not show an error notification when a session times out.
  // Notification for this case is handled elsewhere.
  if (obj instanceof Error && obj.message === sessionTimedOutErrorMessage) {
    return;
  }

  notify('error', title, { detail: await (obj instanceof Response ? obj.text().catch(() => 'Unknown error') : obj) });
};

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

/**
 * Return a Promise to the result of evaluating the async `fn` with `...args`. If evaluation fails,
 * report the error to the user with `title` as a side effect.
 */
export const reportErrorAndRethrow = (title: string) => {
  return <F extends AnyPromiseFn>(fn: F) =>
    withErrorHandling(async (error): Promise<void> => {
      await reportError(title, error);
      throw error;
    })(fn);
};

/**
 *  This function is designed for use in modals
 *  Modals can overlay any error reporting, with the `throw` in the default `withErrorReporting`
 *  preventing the modal itself from closing on error
 *  As such, we must ensure we call the dismiss function if an error occurs
 */
export const withErrorReportingInModal = (title: string, onDismiss: () => void) => {
  return withErrorHandling(async (error) => {
    await reportError(title, error);
    onDismiss();
    throw error;
  });
};

/**
 * Return a Promise to the result of evaluating the async `fn` with `...args` or undefined if
 * evaluation fails. If evaluation fails, report the error to the user with `title`.
 */
export const withErrorReporting = (title: string) => {
  return <F extends AnyPromiseFn>(fn: F) => withErrorIgnoring(reportErrorAndRethrow(title)(fn));
};
