import { delay } from './timer-utils';

describe('delay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns a Promise that resolves after the given delay', async () => {
    // Arrange
    const resolved = jest.fn();

    // Act
    delay(2000).then(resolved);
    const isResolvedImmediately = resolved.mock.calls.length > 0;

    jest.advanceTimersByTime(1000);
    await Promise.resolve();
    const isResolvedAfterOneSecond = resolved.mock.calls.length > 0;

    jest.advanceTimersByTime(1000);
    await Promise.resolve();
    const isResolvedAfterTwoSeconds = resolved.mock.calls.length > 0;

    // Assert
    expect(isResolvedImmediately).toBe(false);
    expect(isResolvedAfterOneSecond).toBe(false);
    expect(isResolvedAfterTwoSeconds).toBe(true);
  });
});
