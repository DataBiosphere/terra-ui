import { useState } from 'react'
import LoadedState from 'src/libs/type-utils/LoadedState'
import { isFetchResponse } from 'src/libs/type-utils/type-helpers'

/**
 * The Tuple returned by useLoadedData custom helper hook
 */
export type UseLoadedDataResult<T> = [
  LoadedState<T, unknown>,
  (dataCall: () => Promise<T>) => Promise<void>
]

/**
 * A custom helper hook that will handle typical async data call mechanics and translate the possible outcomes to
 * the appropriate LoadedState<T> result.  Initial ('None'), 'Loading', 'Error' and 'Ready' states are handled.  The
 * Error case also handles error object as Fetch Response and extract the error message from response.text().
 *
 * @example
 * const [myData, updateMyData] = useLoadedData<MyDataType>()
 * //...
 * updateMyData(async () => {
 *   // any errors thrown by data call or additional checks here
 *   // will be translated to status: 'Error' LoadedState<T>
 *   cost coolData: MyDataType = await someDataMethod(args)
 *   return coolData
 * }
 * // ...
 * if (myData.status === 'Ready') {
 *   const goodData = myData.state
 *   // ...
 * }
 * @returns a tuple with [currentLoadedState, updateDataMethod]
 */
export const useLoadedData = <T>(): UseLoadedDataResult<T> => {
  const [loadedData, setLoadedData] = useState<LoadedState<T, unknown>>({ status: 'None' })

  const updateDataFn = async (dataCall: () => Promise<T>) => {
    const previousState = loadedData.status !== 'None' ? loadedData.state : null
    setLoadedData({
      status: 'Loading',
      state: previousState
    })
    try {
      const result = await dataCall()
      setLoadedData({
        status: 'Ready',
        state: result
      })
    } catch (err: unknown) {
      const error = isFetchResponse(err) ?
        Error(await err.text()) :
        err
      setLoadedData({
        status: 'Error',
        state: previousState,
        error
      })
    }
  }

  return ([
    loadedData,
    updateDataFn
  ])
}
