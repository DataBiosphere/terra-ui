import { IgnoreErrorDecider, makeNotificationsContract, Notifier } from '@terra-ui-packages/notifications';
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

export const terraUIReporter = makeNotificationsContract(notifier, ignoreSessionTimeout);

// provide backwards compatible fail-safes for existing code that is not yet ready for code-reuse

export const reportError = terraUIReporter.reportError;
export const reportErrorAndRethrow = terraUIReporter.reportErrorAndRethrow;
export const withErrorReportingInModal = terraUIReporter.withErrorReportingInModal;
export const withErrorReporting = terraUIReporter.withErrorReporting;
