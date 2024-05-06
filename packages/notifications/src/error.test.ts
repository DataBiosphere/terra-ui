import { IgnoreErrorDecider, makeNotificationsProvider } from './error';
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
    const { reportError } = makeNotificationsProvider(mockNotifications, ignoreError);

    // Act
    await reportError('Things went BOOM', new Error('BOOM!'));

    // Assert
    const expectedError = new Error('BOOM!');
    expect(mockNotifications.notify).toBeCalledTimes(1);
    expect(mockNotifications.notify).toBeCalledWith('error', 'Things went BOOM', { detail: expectedError });
    expect(console.error).toBeCalledTimes(1);
    expect(console.error).toBeCalledWith('Things went BOOM', expectedError);
  });

  it('ignores error when ignore-checker is given', async () => {
    // Arrange
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { reportError } = makeNotificationsProvider(mockNotifications, ignoreError);

    // Act
    await reportError('Ignore Me', new Error('I cried wolf.'));

    // Assert
    expect(mockNotifications.notify).toBeCalledTimes(0);
    expect(console.error).toBeCalledTimes(1);
    expect(console.error).toBeCalledWith('Ignore Me', new Error('I cried wolf.'));
  });
});

describe('withErrorReporting (and rethrow)', () => {
  it('calls notify and rethrows error', async () => {
    // Arrange
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { withErrorReporting } = makeNotificationsProvider(mockNotifications, ignoreError);
    const callMe = withErrorReporting('Things went BOOM', { rethrow: true })(async () => {
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
  it('calls notify and console.error', async () => {
    // Arrange
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { withErrorReporting } = makeNotificationsProvider(mockNotifications, ignoreError);
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

describe('withErrorReporting (in modal)', () => {
  it('calls dismiss and notify', async () => {
    // Arrange
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const { withErrorReporting } = makeNotificationsProvider(mockNotifications, ignoreError);
    const onDismiss = jest.fn();

    // have withErrorReporting use args that match commonly desired behavior within a Modal
    const callMe = withErrorReporting('Things went BOOM', { onReported: onDismiss, rethrow: true })(async () => {
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
