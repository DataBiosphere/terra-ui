import { renderHook } from '@testing-library/react-hooks';
import { Ajax } from 'src/libs/ajax';
import { asMockedFn } from 'src/testing/test-utils';
import { describe, expect, it, vi } from 'vitest';

import { useMetricsEvent } from './useMetrics';

type AjaxExports = typeof import('src/libs/ajax');
vi.mock('src/libs/ajax', async (): Promise<AjaxExports> => {
  return {
    ...(await vi.importActual('src/libs/ajax')),
    Ajax: vi.fn(),
  };
});

type AjaxContract = ReturnType<typeof Ajax>;
type AjaxMetricsContract = AjaxContract['Metrics'];

describe('useMetricsEvent', () => {
  it('calls event logger', () => {
    // Arrange
    const watchCaptureEvent = vi.fn();
    const mockMetrics: Partial<AjaxMetricsContract> = {
      captureEvent: (event, details) => watchCaptureEvent(event, details),
    };
    const mockAjax: Partial<AjaxContract> = {
      Metrics: mockMetrics as AjaxMetricsContract,
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    // Act
    const renderedHook = renderHook(() => useMetricsEvent());
    const { captureEvent } = renderedHook.result.current;
    captureEvent('hi there', { something: 'interesting' });

    // Assert
    expect(watchCaptureEvent).toBeCalledTimes(1);
    expect(watchCaptureEvent).toBeCalledWith('hi there', { something: 'interesting' });
  });
});
