import { controlledPromise } from './promise-utils';

describe('controlledPromise', () => {
  it('returns a promise that can be resolved by the controller', async () => {
    // Arrange
    const onResolved = jest.fn();
    const [promise, controller] = controlledPromise<string>();
    promise.then(onResolved);

    // Act
    controller.resolve('foo');

    // Wait a tick for the promise callback
    await Promise.resolve();

    // Assert
    expect(onResolved).toHaveBeenCalledWith('foo');
  });

  it('returns a promise that can be rejected by the controller', async () => {
    // Arrange
    const onRejected = jest.fn();
    const [promise, controller] = controlledPromise<string>();
    promise.catch(onRejected);

    // Act
    controller.reject(new Error('Something went wrong'));

    // Wait a tick for the promise callback
    await Promise.resolve();

    // Assert
    expect(onRejected).toHaveBeenCalledWith(new Error('Something went wrong'));
  });
});
