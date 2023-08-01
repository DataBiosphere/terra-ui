import { act, renderHook } from '@testing-library/react';

import { useDebouncedValue } from './react-utils';

describe('useDebouncedValue', () => {
  it('debounces changes to value', () => {
    // Arrange
    jest.useFakeTimers();

    const { result: hookReturnRef, rerender } = renderHook((args: [string, number]) => useDebouncedValue(...args), {
      initialProps: ['foo', 1000],
    });
    const initialValue = hookReturnRef.current;

    // Act
    rerender(['bar', 1000]);
    const valueAfterUpdate = hookReturnRef.current;

    act(() => {
      jest.advanceTimersByTime(500);
    });
    const valueAfte500ms = hookReturnRef.current;

    act(() => {
      jest.advanceTimersByTime(500);
    });
    const valueAfter1000ms = hookReturnRef.current;

    // Assert
    expect(initialValue).toBe('foo');
    expect(valueAfterUpdate).toBe('foo');
    expect(valueAfte500ms).toBe('foo');
    expect(valueAfter1000ms).toBe('bar');
  });
});
