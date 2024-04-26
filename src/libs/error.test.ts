import { sessionTimedOutErrorMessage } from 'src/auth/auth-errors';
import { reportError as reportErrorFallback } from 'src/libs/error';
import { notify } from 'src/libs/notifications';
import { mockNotifications } from 'src/testing/test-utils';

jest.mock('src/libs/notifications');

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

  it('ignores session timeout error', async () => {
    // Arrange
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    await reportErrorFallback('Session is over', new Error(sessionTimedOutErrorMessage));

    // Assert
    expect(mockNotifications.notify).toBeCalledTimes(0);
    expect(console.error).toBeCalledTimes(1);
    expect(console.error).toBeCalledWith('Session is over', new Error(sessionTimedOutErrorMessage));
  });
});
