import { atom } from '@terra-ui-packages/core-utils';
import { act, renderHook } from '@testing-library/react';

import { useSettableStore, useStore } from './useStore';

describe('useStore', () => {
  it('returns value from store', () => {
    // Act
    const store = atom<string>('foo');
    const { result: hookReturnRef } = renderHook(useStore, { initialProps: store });

    // Assert
    expect(hookReturnRef.current).toBe('foo');
  });

  it('handles update to store', () => {
    // Arrange
    const store = atom<string>('foo');
    const { result: hookReturnRef } = renderHook(useStore, { initialProps: store });

    // Act
    act(() => {
      store.set('bar');
    });

    // Assert
    expect(hookReturnRef.current).toBe('bar');
  });
});

describe('useSettableStore', () => {
  it('returns a function to update the store', () => {
    // Arrange
    const myAtom = atom<string>('hello');
    const { result: hookReturnRef } = renderHook(useSettableStore, { initialProps: myAtom });
    const [initialValue, setValue] = hookReturnRef.current;

    // Act
    act(() => {
      setValue('goodbye');
    });

    // Assert
    expect(initialValue).toBe('hello');
    const [value] = hookReturnRef.current;
    expect(value).toBe('goodbye');
    expect(myAtom.get()).toBe('goodbye');
  });

  it('reacts to updated atom value', () => {
    // Arrange
    const myAtom = atom<string>('hello');
    const { result: hookReturnRef } = renderHook(useSettableStore, { initialProps: myAtom });
    const [initialValue] = hookReturnRef.current;

    // Act
    act(() => {
      myAtom.set('goodbye');
    });

    // Assert
    expect(initialValue).toBe('hello');
    const [value] = hookReturnRef.current;
    expect(value).toBe('goodbye');
  });
});
