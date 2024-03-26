import { sessionTimedOutErrorMessage } from 'src/auth/auth-errors';
import { withErrorReporter } from 'src/libs/error';
import { mockNotifications } from 'src/testing/test-utils';

describe('report', () => {
  it('calls notify and console.error', async () => {
    // Arrange
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { reportError } = withErrorReporter(mockNotifications);

    let outerThrow: unknown | null = null;

    // Act
    try {
      await reportError('Things went BOOM', new Error('BOOM!'));
    } catch (e) {
      outerThrow = e;
    }

    // Assert
    const expectedError = new Error('BOOM!');
    expect(mockNotifications.notify).toBeCalledTimes(1);
    expect(mockNotifications.notify).toBeCalledWith('error', 'Things went BOOM', { detail: expectedError });
    expect(console.error).toBeCalledTimes(1);
    expect(console.error).toBeCalledWith('Things went BOOM', expectedError);
    expect(outerThrow).toEqual(null);
  });

  it('ignores session timeout error', async () => {
    // Arrange
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { reportError } = withErrorReporter(mockNotifications);

    let outerThrow: unknown | null = null;

    // Act
    try {
      await reportError('Things went BOOM', new Error(sessionTimedOutErrorMessage));
    } catch (e) {
      outerThrow = e;
    }

    // Assert
    expect(mockNotifications.notify).toBeCalledTimes(0);
    expect(console.error).toBeCalledTimes(1);
    expect(console.error).toBeCalledWith('Things went BOOM', new Error(sessionTimedOutErrorMessage));
    expect(outerThrow).toEqual(null);
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
