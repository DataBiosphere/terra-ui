import { Atom, atom } from '@terra-ui-packages/core-utils';
import { act, renderHook } from '@testing-library/react';

import { useDebouncedValue, useSettableStore } from './react-utils';

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

describe('useSettableStore', () => {
  it('handles direct value update', () => {
    // Arrange
    const myAtom = atom<string>('hello');
    const { result: hookReturnRef, rerender } = renderHook((args: [Atom<string>]) => useSettableStore(...args), {
      initialProps: [myAtom],
    });
    const [initialValue, setValue] = hookReturnRef.current;

    // Act
    setValue('goodbye');
    rerender([myAtom]);

    // Assert
    expect(initialValue).toBe('hello');
    const [value] = hookReturnRef.current;
    expect(value).toBe('goodbye');
    expect(myAtom.get()).toBe('goodbye');
  });

  it('reacts to updated atom value', () => {
    // Arrange
    const myAtom = atom<string>('hello');
    const { result: hookReturnRef, rerender } = renderHook((args: [Atom<string>]) => useSettableStore(...args), {
      initialProps: [myAtom],
    });

    const [initialValue] = hookReturnRef.current;

    // Act
    myAtom.set('goodbye');
    rerender([myAtom]);

    // Assert
    expect(initialValue).toBe('hello');
    const [value] = hookReturnRef.current;
    expect(value).toBe('goodbye');
    expect(myAtom.get()).toBe('goodbye');
  });
});
