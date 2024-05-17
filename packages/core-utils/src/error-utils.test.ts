import { withErrorHandling, withErrorIgnoring } from './error-utils';

describe('withErrorHandling', () => {
  it('calls callback on error', async () => {
    // Arrange
    const willThrow = async () => {
      throw new Error('BOOM!');
    };
    const callback = jest.fn();
    const callMe = withErrorHandling(callback)(willThrow);

    // Act
    await callMe();

    // Assert
    expect(callback).toBeCalledTimes(1);
    expect(callback).toBeCalledWith(new Error('BOOM!'));
  });
});

describe('withErrorIgnoring', () => {
  it('silences throw on error', async () => {
    // Arrange
    const willThrow = async () => {
      throw new Error('BOOM!');
    };
    const callMe = withErrorIgnoring(willThrow);

    // Act
    await callMe();

    // Assert
    // Nothing should happen.
    // if test gets here, all is well.
  });
});
