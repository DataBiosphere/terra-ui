import { AnyPromiseFn } from '@terra-ui-packages/core-utils';

import { ErrorReportingOptions, NotificationsProvider, Notifier } from './useNotifications';

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
 * allows composition of NotificationsProvider dependency when useful for code reuse
 * @param notifier
 */
export const makeNotificationsProvider = (
  notifier: Notifier,
  shouldIgnoreError: IgnoreErrorDecider
): NotificationsProvider => {
  const notifications: NotificationsProvider = {
    notify: notifier.notify,

    reportError: async (title: string, obj?: unknown) => {
      console.error(title, obj); // helpful when the notify component fails to render
      // Do not do anything if error should be ignored
      if (shouldIgnoreError(title, obj)) {
        return;
      }
      const detail = await (obj instanceof Response ? obj.text().catch(() => 'Unknown error') : obj);
      notifier.notify('error', title, { detail });
    },

    withErrorReporting: (title: string, args?: ErrorReportingOptions) => {
      return withErrorHandling(async (error) => {
        await notifications.reportError(title, error);
        if (args && args.onReported) {
          args.onReported();
        }
        if (args && args.rethrow) {
          throw error;
        }
      });
    },
  };
  return notifications;
};
