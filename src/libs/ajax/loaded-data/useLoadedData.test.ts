import { LoadedState } from '@terra-ui-packages/core-utils';
import { act, renderHook } from '@testing-library/react';
import { useLoadedData, UseLoadedDataResult } from 'src/libs/ajax/loaded-data/useLoadedData';
import { controlledPromise } from 'src/testing/test-utils';

interface TestData {
  propA: string;
  propB: number;
}

describe('useLoadedData hook', () => {
  it('handles initial none state', () => {
    // Act
    const hookRender = renderHook(() => useLoadedData<TestData>());
    const hookResult: UseLoadedDataResult<TestData> = hookRender.result.current;

    // Assert
    const expectedState: LoadedState<TestData> = { status: 'None' };
    expect(hookResult[0]).toEqual(expectedState);
  });

  it('handles loading, then ready state', async () => {
    // Act
    const hookRender = renderHook(() => useLoadedData<TestData>());
    const hookResult1: UseLoadedDataResult<TestData> = hookRender.result.current;
    const updateData = hookResult1[1];

    const [promise, controller] = controlledPromise<TestData>();
    act(() => {
      updateData(() => promise);
    });
    const hookResult2: UseLoadedDataResult<TestData> = hookRender.result.current;
    await act(async () => {
      controller.resolve({
        propA: 'abc',
        propB: 123,
      });
    });
    const hookResultFinal: UseLoadedDataResult<TestData> = hookRender.result.current;

    // Assert
    const expectedState1: LoadedState<TestData> = { status: 'None' };
    const expectedState2: LoadedState<TestData> = { status: 'Loading', state: null };
    const expectedStateFinal: LoadedState<TestData> = {
      status: 'Ready',
      state: {
        propA: 'abc',
        propB: 123,
      },
    };

    expect(hookResult1[0]).toEqual(expectedState1);
    expect(hookResult2[0]).toEqual(expectedState2);
    expect(hookResultFinal[0]).toEqual(expectedStateFinal);
  });

  it('handles loading, then error state', async () => {
    // Arrange
    const hookRender = renderHook(() => useLoadedData<TestData>());
    const hookResult1: UseLoadedDataResult<TestData> = hookRender.result.current;
    const updateData = hookResult1[1];

    // Act
    const [promise, controller] = controlledPromise<TestData>();
    act(() => {
      updateData(() => promise);
    });
    const hookResult2: UseLoadedDataResult<TestData> = hookRender.result.current;
    await act(async () => {
      controller.reject(new Error('BOOM!'));
    });
    const hookResultFinal: UseLoadedDataResult<TestData> = hookRender.result.current;

    // Assert
    const expectedState1: LoadedState<TestData> = { status: 'None' };
    const expectedState2: LoadedState<TestData> = { status: 'Loading', state: null };
    const expectedStateFinal: LoadedState<TestData> = {
      status: 'Error',
      state: null,
      error: Error('BOOM!'),
    };

    expect(hookResult1[0]).toEqual(expectedState1);
    expect(hookResult2[0]).toEqual(expectedState2);
    expect(hookResultFinal[0]).toEqual(expectedStateFinal);
  });

  it('handles error state from Fetch Response as error', async () => {
    // Arrange
    const hookRender = renderHook(() => useLoadedData<TestData>());
    const hookResult1: UseLoadedDataResult<TestData> = hookRender.result.current;
    const updateData = hookResult1[1];

    // Act
    const [promise, controller] = controlledPromise<TestData>();
    act(() => {
      updateData(() => promise);
    });
    const hookResult2: UseLoadedDataResult<TestData> = hookRender.result.current;

    const mockFetchResponse: Partial<Response> = {
      status: 500,
      statusText: 'Server Error',
      text: () => Promise.resolve('BOOM!'),
    };
    await act(async () => {
      controller.reject(mockFetchResponse);
    });
    const hookResultFinal: UseLoadedDataResult<TestData> = hookRender.result.current;

    // Assert
    const expectedState1: LoadedState<TestData> = { status: 'None' };
    const expectedState2: LoadedState<TestData> = { status: 'Loading', state: null };
    const expectedStateFinal: LoadedState<TestData> = {
      status: 'Error',
      state: null,
      error: Error('BOOM!'),
    };

    expect(hookResult1[0]).toEqual(expectedState1);
    expect(hookResult2[0]).toEqual(expectedState2);
    expect(hookResultFinal[0]).toEqual(expectedStateFinal);
  });

  it('handles ready state, then later error state', async () => {
    const onErrorListener = jest.fn();
    // Act
    const hookRender = renderHook(() =>
      useLoadedData<TestData>({
        onError: (errState) => onErrorListener(errState),
      })
    );
    const hookResult1: UseLoadedDataResult<TestData> = hookRender.result.current;
    let updateData = hookResult1[1];

    // produce ready result
    const [promise1, controller1] = controlledPromise<TestData>();
    act(() => {
      updateData(() => promise1);
    });
    const hookResult2: UseLoadedDataResult<TestData> = hookRender.result.current;
    await act(async () => {
      controller1.resolve({
        propA: 'abc',
        propB: 123,
      });
    });
    const hookResultReady: UseLoadedDataResult<TestData> = hookRender.result.current;
    updateData = hookResultReady[1];

    // produce error result
    const [promise2, controller2] = controlledPromise<TestData>();
    act(() => {
      updateData(() => promise2);
    });

    const hookResult3: UseLoadedDataResult<TestData> = hookRender.result.current;
    await act(async () => {
      controller2.reject(new Error('BOOM!'));
    });
    const hookResultFinal: UseLoadedDataResult<TestData> = hookRender.result.current;

    // Assert
    const expectedState1: LoadedState<TestData> = { status: 'None' };
    const expectedState2: LoadedState<TestData> = { status: 'Loading', state: null };
    const expectedStateReady: LoadedState<TestData> = {
      status: 'Ready',
      state: { propA: 'abc', propB: 123 },
    };

    // later states are expected to remember last ready state
    const expectedState3: LoadedState<TestData> = {
      status: 'Loading',
      state: { propA: 'abc', propB: 123 },
    };
    const expectedStateFinal: LoadedState<TestData> = {
      status: 'Error',
      state: { propA: 'abc', propB: 123 },
      error: Error('BOOM!'),
    };

    expect(hookResult1[0]).toEqual(expectedState1);
    expect(hookResult2[0]).toEqual(expectedState2);
    expect(hookResultReady[0]).toEqual(expectedStateReady);
    expect(hookResult3[0]).toEqual(expectedState3);
    expect(hookResultFinal[0]).toEqual(expectedStateFinal);
    expect(onErrorListener).toBeCalledTimes(1);
    expect(onErrorListener).toBeCalledWith(expectedStateFinal);
  });
});
