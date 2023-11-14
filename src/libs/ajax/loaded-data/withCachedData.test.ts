import { atom } from '@terra-ui-packages/core-utils';
import { act, renderHook } from '@testing-library/react';
import { useLoadedData, UseLoadedDataResult } from 'src/libs/ajax/loaded-data/useLoadedData';
import { withCachedData } from 'src/libs/ajax/loaded-data/withCachedData';
import { controlledPromise } from 'src/testing/test-utils';

describe('withCachedData', () => {
  it('calls data method and retains state in store', async () => {
    // Arrange
    const store = atom('');
    const useData = withCachedData(store, useLoadedData<string>);
    const hookRender1 = renderHook(() => useData());
    const hookResult1: UseLoadedDataResult<string> = hookRender1.result.current;
    const updateData = hookResult1[1];

    const [promise, controller] = controlledPromise<string>();

    // Act
    act(() => {
      updateData(() => promise);
    });
    await act(async () => {
      controller.resolve('happy data');
    });
    const hookResultFinal: UseLoadedDataResult<string> = hookRender1.result.current;

    // Assert
    expect(hookResultFinal[0]).toEqual({ status: 'Ready', state: 'happy data' });
    expect(store.get()).toEqual('happy data');
  });

  it('handles external update to store (during None state)', async () => {
    // Arrange
    const store = atom('');
    const useData = withCachedData(store, useLoadedData<string>);
    const hookRender1 = renderHook(() => useData());

    // Act
    act(() => {
      store.set('other value');
    });
    const hookResultFinal: UseLoadedDataResult<string> = hookRender1.result.current;

    // Assert
    expect(hookResultFinal[0]).toEqual({ status: 'Ready', state: 'other value' });
    expect(store.get()).toEqual('other value');
  });

  it('handles external update to store (after None state)', async () => {
    // Arrange
    const store = atom('');
    const useData = withCachedData(store, useLoadedData<string>);
    const hookRender1 = renderHook(() => useData());
    const hookResult1: UseLoadedDataResult<string> = hookRender1.result.current;
    const updateData = hookResult1[1];

    const [promise, controller] = controlledPromise<string>();

    act(() => {
      updateData(() => promise);
    });
    await act(async () => {
      controller.resolve('happy data');
    });

    // Act
    act(() => {
      store.set('other value');
    });
    const hookResultFinal: UseLoadedDataResult<string> = hookRender1.result.current;

    // Assert
    expect(hookResultFinal[0]).toEqual({ status: 'Ready', state: 'other value' });
    expect(store.get()).toEqual('other value');
  });
});
