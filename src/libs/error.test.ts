import { sessionTimedOutErrorMessage } from 'src/auth/auth-errors';
import { reportError as reportErrorFallback, withErrorReporter } from 'src/libs/error';
import { notify } from 'src/libs/notifications';
import { mockNotifications } from 'src/testing/test-utils';

jest.mock('src/libs/notifications');

describe('report', () => {
  it('calls notify and console.error', async () => {
    // Arrange
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { reportError } = withErrorReporter(mockNotifications);

    // Act
    await reportError('Things went BOOM', new Error('BOOM!'));

    // Assert
    const expectedError = new Error('BOOM!');
    expect(mockNotifications.notify).toBeCalledTimes(1);
    expect(mockNotifications.notify).toBeCalledWith('error', 'Things went BOOM', { detail: expectedError });
    expect(console.error).toBeCalledTimes(1);
    expect(console.error).toBeCalledWith('Things went BOOM', expectedError);
  });

  it('ignores session timeout error', async () => {
    // Arrange
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { reportError } = withErrorReporter(mockNotifications);

    // Act
    await reportError('Things went BOOM', new Error(sessionTimedOutErrorMessage));

    // Assert
    expect(mockNotifications.notify).toBeCalledTimes(0);
    expect(console.error).toBeCalledTimes(1);
    expect(console.error).toBeCalledWith('Things went BOOM', new Error(sessionTimedOutErrorMessage));
  });
});

describe('reportErrorAndRethrow', () => {
  it('calls notify and rethrows error', async () => {
    // Arrange
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { reportErrorAndRethrow } = withErrorReporter(mockNotifications);
    const callMe = reportErrorAndRethrow('Things went BOOM')(async () => {
      throw new Error('BOOM!');
    });
    let outerThrow: unknown | null = null;

    // Act
    try {
      await callMe();
    } catch (e) {
      outerThrow = e;
    }

    // Assert
    const expectedError = new Error('BOOM!');
    expect(mockNotifications.notify).toBeCalledTimes(1);
    expect(mockNotifications.notify).toBeCalledWith('error', 'Things went BOOM', { detail: expectedError });
    expect(console.error).toBeCalledTimes(1);
    expect(console.error).toBeCalledWith('Things went BOOM', expectedError);
    expect(outerThrow).toEqual(expectedError);
  });
});

describe('withErrorReportingInModal', () => {
  it('calls dismiss and notify', async () => {
    // Arrange
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { withErrorReportingInModal } = withErrorReporter(mockNotifications);
    const onDismiss = jest.fn();
    const callMe = withErrorReportingInModal(
      'Things went BOOM',
      onDismiss
    )(async () => {
      throw new Error('BOOM!');
    });
    let outerThrow: unknown | null = null;

    // Act
    try {
      await callMe();
    } catch (e) {
      outerThrow = e;
    }

    // Assert
    const expectedError = new Error('BOOM!');
    expect(onDismiss).toBeCalledTimes(1);
    expect(mockNotifications.notify).toBeCalledTimes(1);
    expect(mockNotifications.notify).toBeCalledWith('error', 'Things went BOOM', { detail: expectedError });
    expect(console.error).toBeCalledTimes(1);
    expect(console.error).toBeCalledWith('Things went BOOM', expectedError);
    expect(outerThrow).toEqual(expectedError);
  });
});

describe('reportError - using terra notificationsProvider fallback', () => {
  it('calls notify and console.error', async () => {
    // Arrange
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    await reportErrorFallback('Things went BOOM', new Error('BOOM!'));

    // Assert
    const expectedError = new Error('BOOM!');
    expect(notify).toBeCalledTimes(1);
    expect(notify).toBeCalledWith('error', 'Things went BOOM', { detail: expectedError });
    expect(console.error).toBeCalledTimes(1);
    expect(console.error).toBeCalledWith('Things went BOOM', expectedError);
  });
});
