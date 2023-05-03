import _ from 'lodash/fp';
import { notify } from 'src/libs/notifications';
import { AnyPromiseFn, GenericPromiseFn } from 'src/libs/type-utils/general-types';
import { safeCurry } from 'src/libs/type-utils/lodash-fp-helpers';

export const reportError = async (title, obj) => {
  console.error(title, obj); // helpful when the notify component fails to render
  // Do not show an error notification when a session times out.
  // Notification for this case is handled elsewhere.
  if (obj instanceof Error && obj.message === 'Session timed out') {
    return;
  }

  notify('error', title, { detail: await (obj instanceof Response ? obj.text() : obj) });
};

export type ErrorCallback = (error: unknown) => void | Promise<void>;
const withErrorHandlingFn =
  <R, F extends AnyPromiseFn>(
    callback: ErrorCallback,
    fn: GenericPromiseFn<F, R | void>
  ): GenericPromiseFn<F, R | void> =>
  async (...args: Parameters<F>): Promise<R | void> => {
    try {
      return await fn(...args);
    } catch (error) {
      await callback(error);
    }
  };

/**
 * Invoke the `callback` with any error thrown when evaluating the async `fn` with `...args`.
 */
export const withErrorHandling = safeCurry(withErrorHandlingFn);

// TODO type this properly  - ticket: https://broadworkbench.atlassian.net/browse/UIE-67
/**
 * Return a Promise to the result of evaluating the async `fn` with `...args` or undefined if
 * evaluation fails.
 */
export const withErrorIgnoring = withErrorHandling(_.noop) as any;

/**
 * Return a Promise to the result of evaluating the async `fn` with `...args`. If evaluation fails,
 * report the error to the user with `title` as a side effect.
 */
export const reportErrorAndRethrow = _.curry((title, fn) => {
  return _.flip(withErrorHandling)(fn, (error) => {
    reportError(title, error);
    throw error;
  });
});

/**
 *  This function is designed for use in modals
 *  Modals can overlay any error reporting, with the `throw` in the default `withErrorReporting`
 *  preventing the modal itself from closing on error
 *  As such, we must ensure we call the dismiss function if an error occurs
 */
export const withErrorReportingInModal = _.curry((title, onDismiss, fn) => {
  return _.flip(withErrorHandling)(fn, (error) => {
    reportError(title, error);
    onDismiss();
    throw error;
  });
});

const withErrorReportingFn = <R, F extends AnyPromiseFn>(
  title: string,
  fn: GenericPromiseFn<F, R>
): GenericPromiseFn<F, R> => {
  return withErrorIgnoring(reportErrorAndRethrow(title)(fn));
};

/**
 * Return a Promise to the result of evaluating the async `fn` with `...args` or undefined if
 * evaluation fails. If evaluation fails, report the error to the user with `title`.
 */
export const withErrorReporting = safeCurry(withErrorReportingFn);
