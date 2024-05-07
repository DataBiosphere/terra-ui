import { renderHook } from '@testing-library/react';

import { usePrevious } from './usePrevious';

describe('usePrevious', () => {
  it('returns previous value', () => {
    // Act
    const { result: hookReturnRef, rerender } = renderHook(usePrevious, { initialProps: 1 });

    // Assert
    expect(hookReturnRef.current).toBeUndefined();

    // Act
    rerender(2);

    // Assert
    expect(hookReturnRef.current).toBe(1);
  });
});
