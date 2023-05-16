import { act, renderHook } from '@testing-library/react-hooks';
import _ from 'lodash/fp';
import { ErrorState, LoadingState, ReadyState } from 'src/libs/type-utils/LoadedState';

import IncrementalResponse from './IncrementalResponse';
import useIncrementalResponse from './useIncrementalResponse';

describe('useIncrementalResponse', () => {
  // Returns an incremental response with 3 pages of 3 numbers each
  const getTestIncrementalResponse = (): Promise<IncrementalResponse<number>> => {
    const getNextPage = (previousItems: number[], pageNumber: number): Promise<IncrementalResponse<number>> => {
      const items = [...previousItems, ..._.range(pageNumber * 3 + 1, (pageNumber + 1) * 3 + 1)];
      const hasNextPage = pageNumber < 2;
      return Promise.resolve({
        items,
        getNextPage: hasNextPage
          ? () => getNextPage(items, pageNumber + 1)
          : () => {
              throw new Error('No next page');
            },
        hasNextPage,
      });
    };

    const firstPageItems = [1, 2, 3];
    return Promise.resolve({
      items: firstPageItems,
      getNextPage: () => getNextPage(firstPageItems, 1),
      hasNextPage: true,
    });
  };

  it('gets initial response', async () => {
    // Act
    const { result: hookReturnRef, waitForNextUpdate } = renderHook(() =>
      useIncrementalResponse(getTestIncrementalResponse)
    );
    await waitForNextUpdate();
    const state = hookReturnRef.current.state;

    // Assert
    const expectedState: ReadyState<number[]> = { status: 'Ready', state: [1, 2, 3] };
    expect(state).toEqual(expectedState);
  });

  it('has loading state', async () => {
    // Act
    const { result: hookReturnRef, waitForNextUpdate } = renderHook(() =>
      useIncrementalResponse(getTestIncrementalResponse)
    );
    const initialState = hookReturnRef.current.state;
    await waitForNextUpdate();

    act(() => {
      hookReturnRef.current.loadNextPage();
    });
    const stateAfterLoadingNextPage = hookReturnRef.current.state;
    await waitForNextUpdate();

    // Assert
    const expectedInitialState: LoadingState<number[]> = { status: 'Loading', state: [] };
    expect(initialState).toEqual(expectedInitialState);

    const expectedStateAfterLoadingNextPage: LoadingState<number[]> = { status: 'Loading', state: [1, 2, 3] };
    expect(stateAfterLoadingNextPage).toEqual(expectedStateAfterLoadingNextPage);
  });

  it('has error state', async () => {
    // Arrange
    const throwError = () => Promise.reject(new Error('Something went wrong'));

    // Act
    const { result: hookReturnRef, waitForNextUpdate } = renderHook(() => useIncrementalResponse(throwError));
    await waitForNextUpdate();
    const state = hookReturnRef.current.state;

    // Assert
    const expectedErrorState: ErrorState<number[]> = {
      status: 'Error',
      error: new Error('Something went wrong'),
      state: [],
    };
    expect(state).toEqual(expectedErrorState);
  });

  it('loads next page', async () => {
    // Arrange
    const { result: hookReturnRef, waitForNextUpdate } = renderHook(() =>
      useIncrementalResponse(getTestIncrementalResponse)
    );
    await waitForNextUpdate();

    // Act
    act(() => {
      hookReturnRef.current.loadNextPage();
    });
    await waitForNextUpdate();
    const state = hookReturnRef.current.state;

    // Assert
    const expectedSecondPageState: ReadyState<number[]> = { status: 'Ready', state: [1, 2, 3, 4, 5, 6] };
    expect(state).toEqual(expectedSecondPageState);
  });

  it('loads all remaining pages', async () => {
    // Arrange
    const { result: hookReturnRef, waitForNextUpdate } = renderHook(() =>
      useIncrementalResponse(getTestIncrementalResponse)
    );
    await waitForNextUpdate();

    // Act
    act(() => {
      hookReturnRef.current.loadAllRemainingItems();
    });
    await waitForNextUpdate();
    const state = hookReturnRef.current.state;

    // Assert
    const expectedAllPagesState: ReadyState<number[]> = { status: 'Ready', state: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
    expect(state).toEqual(expectedAllPagesState);
  });

  it('returns hasNextPage', async () => {
    // Arrange
    const { result: hookReturnRef, waitForNextUpdate } = renderHook(() =>
      useIncrementalResponse(getTestIncrementalResponse)
    );
    await waitForNextUpdate();

    // Act
    const firstPageHasNextPage = hookReturnRef.current.hasNextPage;

    act(() => {
      hookReturnRef.current.loadAllRemainingItems();
    });
    await waitForNextUpdate();
    const lastPageHasNextPage = hookReturnRef.current.hasNextPage;

    // Assert
    expect(firstPageHasNextPage).toBe(true);
    expect(lastPageHasNextPage).toBe(false);
  });

  it('reloads / resets to first page', async () => {
    // Arrange
    const { result: hookReturnRef, waitForNextUpdate } = renderHook(() =>
      useIncrementalResponse(getTestIncrementalResponse)
    );
    await waitForNextUpdate();
    act(() => {
      hookReturnRef.current.loadAllRemainingItems();
    });
    await waitForNextUpdate();

    // Act
    const stateBeforeReloading = hookReturnRef.current.state;
    act(() => {
      hookReturnRef.current.reload();
    });
    await waitForNextUpdate();
    const stateAfterReloading = hookReturnRef.current.state;

    // Assert
    const expectedStateBeforeReloading: ReadyState<number[]> = { status: 'Ready', state: [1, 2, 3, 4, 5, 6, 7, 8, 9] };
    expect(stateBeforeReloading).toEqual(expectedStateBeforeReloading);

    const expectedStateAfterReloading: ReadyState<number[]> = { status: 'Ready', state: [1, 2, 3] };
    expect(stateAfterReloading).toEqual(expectedStateAfterReloading);
  });

  it('reloads when get first page function changes', async () => {
    // Arrange
    const getOtherTestIncrementalResponse = (): Promise<IncrementalResponse<number>> => {
      return Promise.resolve({
        items: [101, 102, 103],
        getNextPage: () => {
          throw new Error('No next page');
        },
        hasNextPage: false,
      });
    };

    const {
      rerender,
      result: hookReturnRef,
      waitForNextUpdate,
    } = renderHook(({ getFirstPage }) => useIncrementalResponse(getFirstPage), {
      initialProps: { getFirstPage: getTestIncrementalResponse },
    });
    await waitForNextUpdate();

    // Act
    const stateBeforeChange = hookReturnRef.current.state;
    rerender({ getFirstPage: getOtherTestIncrementalResponse });
    await waitForNextUpdate();
    const stateAfterChange = hookReturnRef.current.state;

    // Assert
    const expectedStateBeforeChange: ReadyState<number[]> = { status: 'Ready', state: [1, 2, 3] };
    expect(stateBeforeChange).toEqual(expectedStateBeforeChange);

    const expectedStateAfterChange: ReadyState<number[]> = { status: 'Ready', state: [101, 102, 103] };
    expect(stateAfterChange).toEqual(expectedStateAfterChange);
  });
});
