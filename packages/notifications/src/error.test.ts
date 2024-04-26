import { IgnoreErrorDecider, makeNotificationsContract } from './error';
import { Notifier } from './useNotifications';

const mockNotifications: Notifier = {
  notify: jest.fn(),
};

const ignoreError: IgnoreErrorDecider = (title: string, _obj?: unknown): boolean => {
  return title === 'Ignore Me';
};
describe('reportError', () => {
  it('calls notify and console.error', async () => {
    // Arrange
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { reportError } = makeNotificationsContract(mockNotifications, ignoreError);

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
    const { reportError } = makeNotificationsContract(mockNotifications, ignoreError);

    // Act
    await reportError('Ignore Me', new Error('I cried wolf.'));

    // Assert
    expect(mockNotifications.notify).toBeCalledTimes(0);
    expect(console.error).toBeCalledTimes(1);
    expect(console.error).toBeCalledWith('Ignore Me', new Error('I cried wolf.'));
  });
});

describe('reportErrorAndRethrow', () => {
  it('calls notify and rethrows error', async () => {
    // Arrange
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { reportErrorAndRethrow } = makeNotificationsContract(mockNotifications, ignoreError);
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

describe('withErrorReporting', () => {
  it('calls dismiss and notify', async () => {
    // Arrange
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { withErrorReporting } = makeNotificationsContract(mockNotifications, ignoreError);
    const callMe = withErrorReporting('Things went BOOM')(async () => {
      throw new Error('BOOM!');
    });

    // Act
    await callMe();

    // Assert
    const expectedError = new Error('BOOM!');
    expect(mockNotifications.notify).toBeCalledTimes(1);
    expect(mockNotifications.notify).toBeCalledWith('error', 'Things went BOOM', { detail: expectedError });
    expect(console.error).toBeCalledTimes(1);
    expect(console.error).toBeCalledWith('Things went BOOM', expectedError);
  });
});

describe('withErrorReportingInModal', () => {
  it('calls dismiss and notify', async () => {
    // Arrange
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { withErrorReportingInModal } = makeNotificationsContract(mockNotifications, ignoreError);
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
