import { IgnoreErrorDecider, makeNotificationsProvider, Notifier } from '@terra-ui-packages/notifications';
import { sessionTimedOutErrorMessage } from 'src/auth/auth-errors';
import { notify } from 'src/libs/notifications';

export { type ErrorCallback, withErrorHandling, withErrorIgnoring } from '@terra-ui-packages/notifications';

export const ignoreSessionTimeout: IgnoreErrorDecider = (_title: string, obj?: unknown): boolean => {
  // Do not show an error notification when a session times out.
  // Notification for this case is handled elsewhere.
  return obj instanceof Error && obj.message === sessionTimedOutErrorMessage;
};

const notifier: Notifier = {
  notify,
};

export const terraUINotifications = makeNotificationsProvider(notifier, ignoreSessionTimeout);

// provide backwards compatible fail-safes for existing code that is not yet ready for code-reuse

export const reportError = terraUINotifications.reportError;

export const reportErrorAndRethrow = (title: string) =>
  terraUINotifications.withErrorReporting(title, { rethrow: true });

export const withErrorReportingInModal = (title: string, onDismiss: () => void) =>
  terraUINotifications.withErrorReporting(title, { rethrow: true, onReported: onDismiss });

export const withErrorReporting = terraUINotifications.withErrorReporting;
