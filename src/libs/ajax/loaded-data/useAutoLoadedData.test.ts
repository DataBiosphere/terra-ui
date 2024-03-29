import { LoadedState } from '@terra-ui-packages/core-utils';
import { act, renderHook } from '@testing-library/react';
import { UseLoadedDataResult } from 'src/libs/ajax/loaded-data/useLoadedData';
import { controlledPromise } from 'src/testing/test-utils';

import { useAutoLoadedData } from './useAutoLoadedData';

describe('useAutoLoadedData', () => {
  it('auto-calls dataCall on init', async () => {
    // Arrange
    const [promise, controller] = controlledPromise<string>();
    const getData = () => promise;
    const onSuccess = jest.fn();
    const onError = jest.fn();

    // Act
    const hookRender = renderHook(() =>
      useAutoLoadedData<string>(getData, [], {
        onSuccess,
        onError,
      })
    );
    const hookResult1: UseLoadedDataResult<string> = hookRender.result.current;

    await act(async () => {
      controller.resolve('happy data');
    });
    const hookResultFinal: UseLoadedDataResult<string> = hookRender.result.current;

    // Assert
    const expectedState1: LoadedState<string> = { status: 'Loading', state: null };
    const expectedStateFinal: LoadedState<string> = {
      status: 'Ready',
      state: 'happy data',
    };

    expect(onSuccess).toBeCalledTimes(1);
    expect(onSuccess).toBeCalledWith(expectedStateFinal);
    expect(hookResult1[0]).toEqual(expectedState1);
    expect(hookResultFinal[0]).toEqual(expectedStateFinal);
  });
});
