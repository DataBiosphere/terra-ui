import { renderHook } from '@testing-library/react';

import { useUniqueId } from './useUniqueId';

describe('useUniqueId', () => {
  it('returns a unique ID from each call', () => {
    // Act
    const { result: hookReturnRef1 } = renderHook(useUniqueId);
    const { result: hookReturnRef2 } = renderHook(useUniqueId);

    // Assert
    expect(hookReturnRef1.current).not.toEqual(hookReturnRef2.current);
  });

  it('returns the same ID on each render', () => {
    // Act
    const { result: hookReturnRef, rerender } = renderHook(useUniqueId);
    const resultAfterFirstRender = hookReturnRef.current;

    rerender();
    const resultAfterSecondRender = hookReturnRef.current;

    // Assert
    expect(resultAfterSecondRender).toEqual(resultAfterFirstRender);
  });

  it('returns a string that starts with the given prefix', () => {
    // Act
    const { result: hookReturnRef } = renderHook(useUniqueId, { initialProps: 'test-prefix' });

    // Assert
    expect(hookReturnRef.current).toMatch(/^test-prefix-/);
  });
});
