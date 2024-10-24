import { sessionExpirationErrorMessage } from 'src/auth/auth-errors';
import { reportError, reportErrorAndRethrow, withErrorReportingInModal } from 'src/libs/error';
import { notify } from 'src/libs/notifications';

jest.mock('src/libs/notifications');

describe('reportError - using terra NotificationsContextProvider fallback', () => {
  it('calls notify and console.error', async () => {
    // Arrange
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    await reportError('Things went BOOM', new Error('BOOM!'));

    // Assert
    const expectedError = new Error('BOOM!');
    expect(notify).toBeCalledTimes(1);
    expect(notify).toBeCalledWith('error', 'Things went BOOM', { detail: expectedError });
    expect(console.error).toBeCalledTimes(1);
    expect(console.error).toBeCalledWith('Things went BOOM', expectedError);
  });

  it('ignores session timeout error', async () => {
    // Arrange
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    await reportError('Session is over', new Error(sessionExpirationErrorMessage));

    // Assert
    expect(notify).toBeCalledTimes(0);
    expect(console.error).toBeCalledTimes(1);
    expect(console.error).toBeCalledWith('Session is over', new Error(sessionExpirationErrorMessage));
  });
});

describe('withErrorReporting fallbacks', () => {
  it('calls notify and rethrows error', async () => {
    // Arrange
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const callMe = reportErrorAndRethrow('Things went BOOM')(async () => {
      throw new Error('BOOM!');
    });

    // Act / Assert
    const expectedError = new Error('BOOM!');
    await expect(callMe).rejects.toThrow(expectedError);

    expect(notify).toBeCalledTimes(1);
    expect(notify).toBeCalledWith('error', 'Things went BOOM', { detail: expectedError });
    expect(console.error).toBeCalledTimes(1);
    expect(console.error).toBeCalledWith('Things went BOOM', expectedError);
  });

  it('calls dismiss and notify (in modal)', async () => {
    // Arrange
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const onDismiss = jest.fn();

    // have withErrorReporting use args that match commonly desired behavior within a Modal
    const callMe = withErrorReportingInModal(
      'Things went BOOM',
      onDismiss
    )(async () => {
      throw new Error('BOOM!');
    });

    // Act / Assert
    const expectedError = new Error('BOOM!');
    await expect(callMe).rejects.toThrow(expectedError);

    expect(onDismiss).toBeCalledTimes(1);
    expect(notify).toBeCalledTimes(1);
    expect(notify).toBeCalledWith('error', 'Things went BOOM', { detail: expectedError });
    expect(console.error).toBeCalledTimes(1);
    expect(console.error).toBeCalledWith('Things went BOOM', expectedError);
  });
});
