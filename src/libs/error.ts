import { AnyPromiseFn } from '@terra-ui-packages/core-utils';
import { NotificationOptions, NotificationsContract, NotificationType } from '@terra-ui-packages/notifications';
import { sessionTimedOutErrorMessage } from 'src/auth/auth-errors';
import { notify } from 'src/libs/notifications';

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
 * allows composition of NotificationsContract dependency when useful for code reuse
 * @param reporter
 */
export const withErrorReporter = (reporter: NotificationsContract) => ({
  reportError: async (title: string, obj?: unknown) => {
    console.error(title, obj); // helpful when the notify component fails to render
    // Do not show an error notification when a session times out.
    // Notification for this case is handled elsewhere.
    if (obj instanceof Error && obj.message === sessionTimedOutErrorMessage) {
      return;
    }
    const detail = await (obj instanceof Response ? obj.text().catch(() => 'Unknown error') : obj);
    reporter.notify('error', title, { detail });
  },

  /**
   * Return a Promise to the result of evaluating the async `fn` with `...args`. If evaluation fails,
   * report the error to the user with `title` as a side effect.
   */
  reportErrorAndRethrow: (title: string) => {
    return <F extends AnyPromiseFn>(fn: F) =>
      withErrorHandling(async (error): Promise<void> => {
        await withErrorReporter(reporter).reportError(title, error);
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
      await withErrorReporter(reporter).reportError(title, error);
      onDismiss();
      throw error;
    });
  },

  /**
   * Return a Promise to the result of evaluating the async `fn` with `...args` or undefined if
   * evaluation fails. If evaluation fails, report the error to the user with `title`.
   */
  withErrorReporting: (title: string) => {
    // const myReporter = reporter ? reporter : notificationProvider;

    return <F extends AnyPromiseFn>(fn: F) =>
      withErrorIgnoring(withErrorReporter(reporter).reportErrorAndRethrow(title)(fn));
  },
});

const notificationsProvider: NotificationsContract = {
  notify: (type: NotificationType, title: string, options?: NotificationOptions) => notify(type, title, options),
};

// provide backwards compatible fail-safe for existing code that is not yet ready for code-reuse
const withTerraUIReporter = withErrorReporter(notificationsProvider);

export const reportError = withTerraUIReporter.reportError;
export const reportErrorAndRethrow = withTerraUIReporter.reportErrorAndRethrow;
export const withErrorReportingInModal = withTerraUIReporter.withErrorReportingInModal;
export const withErrorReporting = withTerraUIReporter.withErrorReporting;
