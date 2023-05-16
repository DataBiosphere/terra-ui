import { renderHook } from '@testing-library/react-hooks';
import _ from 'lodash/fp';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useUniqueId } from './IdContainer';

beforeEach(() => {
  let uniqueSeed = 123;
  vi.spyOn(_, 'uniqueId').mockImplementation(() => {
    const result = uniqueSeed;
    uniqueSeed++;
    return result.toString(10);
  });
});

describe('useUniqueId', () => {
  it('returns a unique Id, prefixed or default', () => {
    // Act
    const namedId = renderHook(useUniqueId, { initialProps: 'button-a' }).result.current;
    const defaultId = renderHook(useUniqueId).result.current;

    // Assert
    expect(namedId).toBe('button-a-123');
    expect(defaultId).toBe('element-124');
  });

  it('returns a durable unique Id, not changing with re-renders', () => {
    // Act
    const hook = renderHook(useUniqueId, { initialProps: 'button-a' });
    const result1 = hook.result.current;
    hook.rerender('button-a');
    const result2 = hook.result.current;

    // Assert
    expect(result1).toBe('button-a-123');
    expect(result2).toBe('button-a-123');
  });
});
