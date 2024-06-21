import { AnyPromiseFn, withErrorHandling } from '@terra-ui-packages/core-utils';

/**
 * Should return true of a given error should be ignored
 */
export type IgnoreErrorDecider = (title: string, obj?: unknown) => boolean;

export type NotificationType = 'error' | 'warn' | 'info' | 'success' | 'welcome';
export interface NotificationOptions {
  /**
   * string, Error(unknown), or json object to be displayed in detail section
   */
  detail?: unknown;
}

export interface Notifier {
  notify: (type: NotificationType, title: string, options?: NotificationOptions) => void;
}

export interface ErrorReportingOptions {
  rethrow?: boolean; // default: false
  onReported?: () => void;
}

export interface ErrorReporter {
  /**
   * Reports the error visually to the user using the app's notification system
   * @param title - error title
   * @param obj - an error, response, or arbitrary json-style object
   */
  reportError: (title: string, obj?: unknown) => Promise<void>;

  /**
   * Returns a function augmenter (HoF).
   * If provided function fails when called, report the error to the user with `title` as a side effect.
   * Use options arg to give onReported callback, and/or rethrow on error.
   */
  withErrorReporting: <F extends AnyPromiseFn>(title: string, options?: ErrorReportingOptions) => (fn: F) => F;
}

export interface NotificationsProvider extends Notifier, ErrorReporter {}

/**
 * dependencies for NotificationsProvider factory method makeNotificationsProvider
 */
export interface NotificationsProviderDeps {
  notifier: Notifier;
  shouldIgnoreError: IgnoreErrorDecider;
}

/**
 * allows composition of NotificationsProvider dependency when useful for code reuse
 * @param deps
 */
export const makeNotificationsProvider = (deps: NotificationsProviderDeps): NotificationsProvider => {
  const notifications: NotificationsProvider = {
    notify: deps.notifier.notify,

    reportError: async (title: string, obj?: unknown) => {
      console.error(title, obj); // helpful when the notify component fails to render
      // Do not do anything if error should be ignored
      if (deps.shouldIgnoreError(title, obj)) {
        return;
      }
      const detail = await (obj instanceof Response ? obj.text().catch(() => 'Unknown error') : obj);
      deps.notifier.notify('error', title, { detail });
    },

    withErrorReporting: (title: string, args?: ErrorReportingOptions) => {
      return withErrorHandling(async (error) => {
        await notifications.reportError(title, error);
        args?.onReported?.();
        if (args?.rethrow) {
          throw error;
        }
      });
    },
  };
  return notifications;
};
