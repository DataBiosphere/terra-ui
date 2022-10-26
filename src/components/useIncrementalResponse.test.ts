import { act, renderHook } from '@testing-library/react-hooks'
import _ from 'lodash/fp'
import useIncrementalResponse from 'src/components/useIncrementalResponse'
import type IncrementalResponse from 'src/libs/ajax/IncrementalResponse'


describe('useIncrementalResponse', () => {
  // Returns an incremental response with 3 pages of 3 numbers each
  const getTestIncrementalResponse = (): Promise<IncrementalResponse<number>> => {
    const getNextPage = (previousResults: number[], pageNumber: number): Promise<IncrementalResponse<number>> => {
      const results = [...previousResults, ..._.range(pageNumber * 3 + 1, (pageNumber + 1) * 3 + 1)]
      const hasNextPage = pageNumber < 2
      return Promise.resolve({
        results,
        getNextPage: hasNextPage ?
          () => getNextPage(results, pageNumber + 1) :
          () => { throw new Error('No next page') },
        hasNextPage
      })
    }

    const firstPageResults = [1, 2, 3]
    return Promise.resolve({
      results: firstPageResults,
      getNextPage: () => getNextPage(firstPageResults, 1),
      hasNextPage: true
    })
  }

  it('gets initial response', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useIncrementalResponse(getTestIncrementalResponse))
    expect(result.current.results).toEqual([])
    await waitForNextUpdate()
    expect(result.current.results).toEqual([1, 2, 3])
  })

  it('has loading state', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useIncrementalResponse(getTestIncrementalResponse))
    expect(result.current.isLoading).toEqual(true)
    await waitForNextUpdate()
    expect(result.current.isLoading).toEqual(false)
  })

  it('has error state', async () => {
    const throwError = () => Promise.reject(new Error('Something went wrong'))
    const { result, waitForNextUpdate } = renderHook(() => useIncrementalResponse(throwError))
    await waitForNextUpdate()
    expect(result.current.error).toEqual(new Error('Something went wrong'))
  })

  it('loads next page', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useIncrementalResponse(getTestIncrementalResponse))
    await waitForNextUpdate()
    expect(result.current.results).toEqual([1, 2, 3])
    act(() => { result.current.loadNextPage() })
    await waitForNextUpdate()
    expect(result.current.results).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('loads all remaining pages', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useIncrementalResponse(getTestIncrementalResponse))
    await waitForNextUpdate()
    expect(result.current.results).toEqual([1, 2, 3])
    act(() => { result.current.loadAllRemaining() })
    await waitForNextUpdate()
    expect(result.current.results).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('has hasNextPage state', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useIncrementalResponse(getTestIncrementalResponse))
    await waitForNextUpdate()
    expect(result.current.hasNextPage).toBe(true)
    act(() => { result.current.loadAllRemaining() })
    await waitForNextUpdate()
    expect(result.current.hasNextPage).toBe(false)
  })

  it('reloads / resets to first page', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useIncrementalResponse(getTestIncrementalResponse))
    await waitForNextUpdate()
    expect(result.current.results).toEqual([1, 2, 3])
    act(() => { result.current.loadAllRemaining() })
    await waitForNextUpdate()
    expect(result.current.results).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])

    act(() => { result.current.reload() })
    await waitForNextUpdate()
    expect(result.current.results).toEqual([1, 2, 3])
  })

  it('reloads when get first page function changes', async () => {
    const getOtherTestIncrementalResponse = (): Promise<IncrementalResponse<number>> => {
      return Promise.resolve({
        results: [100, 101, 102],
        getNextPage: () => { throw new Error('No next page') },
        hasNextPage: false
      })
    }

    const { rerender, result, waitForNextUpdate } = renderHook(({ getFirstPage }) => useIncrementalResponse(getFirstPage), {
      initialProps: { getFirstPage: getTestIncrementalResponse }
    })
    await waitForNextUpdate()
    expect(result.current.results).toEqual([1, 2, 3])

    rerender({ getFirstPage: getOtherTestIncrementalResponse })
    await waitForNextUpdate()
    expect(result.current.results).toEqual([100, 101, 102])
  })
})
