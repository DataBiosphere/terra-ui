import { act, renderHook } from '@testing-library/react-hooks'
import _ from 'lodash/fp'
import useIncrementalResponse from 'src/components/useIncrementalResponse'
import IncrementalResponse from 'src/libs/ajax/IncrementalResponse'
import { ErrorState, LoadingState, ReadyState } from 'src/libs/type-utils/LoadedState'


describe('useIncrementalResponse', () => {
  // Returns an incremental response with 3 pages of 3 numbers each
  const getTestIncrementalResponse = (): Promise<IncrementalResponse<number>> => {
    const getNextPage = (previousItems: number[], pageNumber: number): Promise<IncrementalResponse<number>> => {
      const items = [...previousItems, ..._.range(pageNumber * 3 + 1, (pageNumber + 1) * 3 + 1)]
      const hasNextPage = pageNumber < 2
      return Promise.resolve({
        items,
        getNextPage: hasNextPage ?
          () => getNextPage(items, pageNumber + 1) :
          () => { throw new Error('No next page') },
        hasNextPage
      })
    }

    const firstPageItems = [1, 2, 3]
    return Promise.resolve({
      items: firstPageItems,
      getNextPage: () => getNextPage(firstPageItems, 1),
      hasNextPage: true
    })
  }

  it('gets initial response', async () => {
    const expectedLoadingState: LoadingState<number[]> = { status: 'Loading', state: [] }
    const expectedReadyState: ReadyState<number[]> = { status: 'Ready', state: [1, 2, 3] }

    const { result, waitForNextUpdate } = renderHook(() => useIncrementalResponse(getTestIncrementalResponse))
    expect(result.current.state).toEqual(expectedLoadingState)
    await waitForNextUpdate()
    expect(result.current.state).toEqual(expectedReadyState)
  })

  it('has error state', async () => {
    const throwError = () => Promise.reject(new Error('Something went wrong'))
    const expectedErrorState: ErrorState<number[]> = { status: 'Error', error: new Error('Something went wrong'), state: [] }

    const { result, waitForNextUpdate } = renderHook(() => useIncrementalResponse(throwError))
    await waitForNextUpdate()
    expect(result.current.state).toEqual(expectedErrorState)
  })

  it('loads next page', async () => {
    const expectedFirstPageState: ReadyState<number[]> = { status: 'Ready', state: [1, 2, 3] }
    const expectedSecondPageState: ReadyState<number[]> = { status: 'Ready', state: [1, 2, 3, 4, 5, 6] }

    const { result, waitForNextUpdate } = renderHook(() => useIncrementalResponse(getTestIncrementalResponse))
    await waitForNextUpdate()
    expect(result.current.state).toEqual(expectedFirstPageState)

    act(() => { result.current.loadNextPage() })
    await waitForNextUpdate()
    expect(result.current.state).toEqual(expectedSecondPageState)
  })

  it('loads all remaining pages', async () => {
    const expectedFirstPageState: ReadyState<number[]> = { status: 'Ready', state: [1, 2, 3] }
    const expectedAllPagesState: ReadyState<number[]> = { status: 'Ready', state: [1, 2, 3, 4, 5, 6, 7, 8, 9] }

    const { result, waitForNextUpdate } = renderHook(() => useIncrementalResponse(getTestIncrementalResponse))
    await waitForNextUpdate()
    expect(result.current.state).toEqual(expectedFirstPageState)

    act(() => { result.current.loadAllRemainingItems() })
    await waitForNextUpdate()
    expect(result.current.state).toEqual(expectedAllPagesState)
  })

  it('returns hasNextPage', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useIncrementalResponse(getTestIncrementalResponse))
    await waitForNextUpdate()
    expect(result.current.hasNextPage).toBe(true)

    act(() => { result.current.loadAllRemainingItems() })
    await waitForNextUpdate()
    expect(result.current.hasNextPage).toBe(false)
  })

  it('reloads / resets to first page', async () => {
    const expectedFirstPageState: ReadyState<number[]> = { status: 'Ready', state: [1, 2, 3] }
    const expectedAllPagesState: ReadyState<number[]> = { status: 'Ready', state: [1, 2, 3, 4, 5, 6, 7, 8, 9] }

    const { result, waitForNextUpdate } = renderHook(() => useIncrementalResponse(getTestIncrementalResponse))

    await waitForNextUpdate()
    expect(result.current.state).toEqual(expectedFirstPageState)

    act(() => { result.current.loadAllRemainingItems() })
    await waitForNextUpdate()
    expect(result.current.state).toEqual(expectedAllPagesState)

    act(() => { result.current.reload() })
    await waitForNextUpdate()
    expect(result.current.state).toEqual(expectedFirstPageState)
  })

  it('reloads when get first page function changes', async () => {
    const getOtherTestIncrementalResponse = (): Promise<IncrementalResponse<number>> => {
      return Promise.resolve({
        items: [101, 102, 103],
        getNextPage: () => { throw new Error('No next page') },
        hasNextPage: false
      })
    }

    const expectedStateBeforeChange: ReadyState<number[]> = { status: 'Ready', state: [1, 2, 3] }
    const expectedStateAfterChange: ReadyState<number[]> = { status: 'Ready', state: [101, 102, 103] }

    const { rerender, result, waitForNextUpdate } = renderHook(({ getFirstPage }) => useIncrementalResponse(getFirstPage), {
      initialProps: { getFirstPage: getTestIncrementalResponse }
    })
    await waitForNextUpdate()
    expect(result.current.state).toEqual(expectedStateBeforeChange)

    rerender({ getFirstPage: getOtherTestIncrementalResponse })
    await waitForNextUpdate()
    expect(result.current.state).toEqual(expectedStateAfterChange)
  })
})
