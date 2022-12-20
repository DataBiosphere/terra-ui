import { act, renderHook } from '@testing-library/react-hooks'
import { useLoadedData, UseLoadedDataResult } from 'src/libs/ajax/loaded-data/useLoadedData'
import LoadedState from 'src/libs/type-utils/LoadedState'
import { delay } from 'src/libs/utils'


interface TestData {
  propA: string
  propB: number
}

describe('useLoadedData hook', () => {
  it('handles initial none state', () => {
    // Act
    const hookRender = renderHook(() => useLoadedData<TestData>())
    const hookResult: UseLoadedDataResult<TestData> = hookRender.result.current

    // Assert
    const expectedState: LoadedState<TestData> = { status: 'None' }
    expect(hookResult[0]).toEqual(expectedState)
  })

  it('handles loading, then ready state', async () => {
    // Act
    const hookRender = renderHook(() => useLoadedData<TestData>())
    const hookResult1: UseLoadedDataResult<TestData> = hookRender.result.current
    const updateData = hookResult1[1]
    act(() => {
      void updateData(async (): Promise<TestData> => {
        await delay(100)
        const dataResult: TestData = {
          propA: 'abc',
          propB: 123
        }
        return dataResult
      })
    })
    const hookResult2: UseLoadedDataResult<TestData> = hookRender.result.current
    await hookRender.waitForNextUpdate()
    const hookResultFinal: UseLoadedDataResult<TestData> = hookRender.result.current

    // Assert
    const expectedState1: LoadedState<TestData> = { status: 'None' }
    const expectedState2: LoadedState<TestData> = { status: 'Loading', state: null }
    const expectedStateFinal: LoadedState<TestData> = {
      status: 'Ready',
      state: {
        propA: 'abc',
        propB: 123
      }
    }

    expect(hookResult1[0]).toEqual(expectedState1)
    expect(hookResult2[0]).toEqual(expectedState2)
    expect(hookResultFinal[0]).toEqual(expectedStateFinal)
  })

  it('handles loading, then error state', async () => {
    // Arrange
    const hookRender = renderHook(() => useLoadedData<TestData>())
    const hookResult1: UseLoadedDataResult<TestData> = hookRender.result.current
    const updateData = hookResult1[1]

    // Act
    act(() => {
      void updateData(async (): Promise<TestData> => {
        await delay(100)
        throw Error('BOOM!')
      })
    })
    const hookResult2: UseLoadedDataResult<TestData> = hookRender.result.current
    await hookRender.waitForNextUpdate()
    const hookResultFinal: UseLoadedDataResult<TestData> = hookRender.result.current

    // Assert
    const expectedState1: LoadedState<TestData> = { status: 'None' }
    const expectedState2: LoadedState<TestData> = { status: 'Loading', state: null }
    const expectedStateFinal: LoadedState<TestData> = {
      status: 'Error',
      state: null,
      error: Error('BOOM!')
    }

    expect(hookResult1[0]).toEqual(expectedState1)
    expect(hookResult2[0]).toEqual(expectedState2)
    expect(hookResultFinal[0]).toEqual(expectedStateFinal)
  })

  it('handles error state from Fetch Response as error', async () => {
    // Arrange
    const hookRender = renderHook(() => useLoadedData<TestData>())
    const hookResult1: UseLoadedDataResult<TestData> = hookRender.result.current
    const updateData = hookResult1[1]

    // Act
    act(() => {
      void updateData(async (): Promise<TestData> => {
        await delay(100)
        const mockFetchResponse: Partial<Response> = {
          status: 500,
          statusText: 'Server Error',
          text: async (): Promise<string> => {
            await delay(100)
            return 'BOOM!'
          }
        }
        throw mockFetchResponse
      })
    })
    const hookResult2: UseLoadedDataResult<TestData> = hookRender.result.current
    await hookRender.waitForNextUpdate()
    const hookResultFinal: UseLoadedDataResult<TestData> = hookRender.result.current

    // Assert
    const expectedState1: LoadedState<TestData> = { status: 'None' }
    const expectedState2: LoadedState<TestData> = { status: 'Loading', state: null }
    const expectedStateFinal: LoadedState<TestData> = {
      status: 'Error',
      state: null,
      error: Error('BOOM!')
    }

    expect(hookResult1[0]).toEqual(expectedState1)
    expect(hookResult2[0]).toEqual(expectedState2)
    expect(hookResultFinal[0]).toEqual(expectedStateFinal)
  })


  it('handles ready state, then later error state', async () => {
    // Act
    const hookRender = renderHook(() => useLoadedData<TestData>())
    const hookResult1: UseLoadedDataResult<TestData> = hookRender.result.current
    let updateData = hookResult1[1]

    // produce ready result
    act(() => {
      void updateData(async (): Promise<TestData> => {
        await delay(100)
        const dataResult: TestData = {
          propA: 'abc',
          propB: 123
        }
        return dataResult
      })
    })
    const hookResult2: UseLoadedDataResult<TestData> = hookRender.result.current
    await hookRender.waitForNextUpdate()
    const hookResultReady: UseLoadedDataResult<TestData> = hookRender.result.current
    updateData = hookResultReady[1]

    // produce error result
    act(() => {
      void updateData(async (): Promise<TestData> => {
        await delay(100)
        throw Error('BOOM!')
      })
    })

    const hookResult3: UseLoadedDataResult<TestData> = hookRender.result.current
    await hookRender.waitForNextUpdate()
    const hookResultFinal: UseLoadedDataResult<TestData> = hookRender.result.current

    // Assert
    const expectedState1: LoadedState<TestData> = { status: 'None' }
    const expectedState2: LoadedState<TestData> = { status: 'Loading', state: null }
    const expectedStateReady: LoadedState<TestData> = {
      status: 'Ready',
      state: { propA: 'abc', propB: 123 }
    }

    // later states are expected to remember last ready state
    const expectedState3: LoadedState<TestData> = {
      status: 'Loading',
      state: { propA: 'abc', propB: 123 }
    }
    const expectedStateFinal: LoadedState<TestData> = {
      status: 'Error',
      state: { propA: 'abc', propB: 123 },
      error: Error('BOOM!')
    }

    expect(hookResult1[0]).toEqual(expectedState1)
    expect(hookResult2[0]).toEqual(expectedState2)
    expect(hookResultReady[0]).toEqual(expectedStateReady)
    expect(hookResult3[0]).toEqual(expectedState3)
    expect(hookResultFinal[0]).toEqual(expectedStateFinal)
  })
})
