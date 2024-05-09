import { controlledPromise, ErrorState, ReadyState } from '@terra-ui-packages/core-utils';
import { act, renderHook } from '@testing-library/react';

import { useLoadedData, UseLoadedDataResult } from './useLoadedData';
import { useLoadedDataEvents } from './useLoadedDataEvents';

interface TestData {
  propA: string;
  propB: number;
}
describe('useLoadedDataEvents', () => {
  it('calls onSuccess when hitting ready state', async () => {
    // Act
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const useWrappedHook = (): UseLoadedDataResult<TestData> => {
      const [myData, updateMyData] = useLoadedData<TestData>();
      useLoadedDataEvents(myData, { onSuccess, onError });
      return [myData, updateMyData];
    };

    const hookRender = renderHook(() => useWrappedHook());
    const hookResult1 = hookRender.result.current;
    const updateData = hookResult1[1];

    const [promise, controller] = controlledPromise<TestData>();
    act(() => {
      updateData(() => promise);
    });
    await act(async () => {
      controller.resolve({
        propA: 'abc',
        propB: 123,
      });
    });

    // Assert
    const expectedStateFinal: ReadyState<TestData> = {
      status: 'Ready',
      state: { propA: 'abc', propB: 123 },
    };
    expect(onSuccess).toBeCalledTimes(1);
    expect(onSuccess).toBeCalledWith(expectedStateFinal);
    expect(onError).toBeCalledTimes(0);
  });

  it('calls onError when hitting error state', async () => {
    // Act
    const onSuccess = jest.fn();
    const onError = jest.fn();
    const useWrappedHook = (): UseLoadedDataResult<TestData> => {
      const [myData, updateMyData] = useLoadedData<TestData>();
      useLoadedDataEvents(myData, { onSuccess, onError });
      return [myData, updateMyData];
    };

    const hookRender = renderHook(() => useWrappedHook());
    const hookResult1 = hookRender.result.current;
    const updateData = hookResult1[1];

    const [promise, controller] = controlledPromise<TestData>();
    act(() => {
      updateData(() => promise);
    });

    const mockFetchResponse = new Response('BOOM!', { status: 500, statusText: 'Server Error' });
    await act(async () => {
      controller.reject(mockFetchResponse);
    });

    // Assert
    const expectedStateFinal: ErrorState<TestData> = {
      status: 'Error',
      state: null,
      error: Error('BOOM!'),
    };
    expect(onSuccess).toBeCalledTimes(0);
    expect(onError).toBeCalledTimes(1);
    expect(onError).toBeCalledWith(expectedStateFinal);
  });
});
