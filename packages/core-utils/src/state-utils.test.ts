import { atom, subscribable } from './state-utils';

describe('subscribable', () => {
  it('next calls all registered callbacks', () => {
    // Arrange
    const fn1 = jest.fn();
    const fn2 = jest.fn();

    const sub = subscribable();
    sub.subscribe(fn1);
    sub.subscribe(fn2);

    // Act
    sub.next('a', 'b', 'c');

    // Assert
    expect(fn1).toHaveBeenCalledWith('a', 'b', 'c');
    expect(fn2).toHaveBeenCalledWith('a', 'b', 'c');
  });

  it('subscribe returns a handle to unsubscribe', () => {
    // Arrange
    const fn1 = jest.fn();
    const fn2 = jest.fn();

    const sub = subscribable();
    sub.subscribe(fn1);
    const { unsubscribe: unsubscribeFn2 } = sub.subscribe(fn2);

    // Act
    sub.next();
    unsubscribeFn2();
    sub.next();

    // Assert
    expect(fn1).toHaveBeenCalledTimes(2);
    expect(fn2).toHaveBeenCalledTimes(1);
  });
});

describe('atom', () => {
  it('initializes state', () => {
    // Act
    const state = atom('foo');

    // Assert
    expect(state.get()).toBe('foo');
  });

  it('sets state', () => {
    // Arrange
    const state = atom('foo');

    // Act
    state.set('bar');

    // Assert
    expect(state.get()).toBe('bar');
  });

  it('updates state', () => {
    // Arrange
    const state = atom(1);

    // Act
    state.update((n) => n + 1);

    // Assert
    expect(state.get()).toBe(2);
  });

  it('resets state', () => {
    // Arrange
    const state = atom('foo');
    state.set('bar');

    // Act
    state.reset();

    // Assert
    expect(state.get()).toBe('foo');
  });

  it('allows subscribing to changes', () => {
    // Arrange
    const state = atom('foo');

    const fn = jest.fn();
    state.subscribe(fn);

    // Act
    state.set('bar');

    // Assert
    expect(fn).toHaveBeenCalledWith('bar', 'foo');
  });

  it('subscriptions can be unsubscribed', () => {
    // Arrange
    const state = atom('foo');

    const fn = jest.fn();
    const { unsubscribe } = state.subscribe(fn);

    // Act
    state.set('bar');
    unsubscribe();
    state.set('baz');

    // Assert
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
