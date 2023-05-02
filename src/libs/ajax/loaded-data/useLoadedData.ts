import { useState } from 'react';
import LoadedState, { ErrorState } from 'src/libs/type-utils/LoadedState';
import { isFetchResponse } from 'src/libs/type-utils/type-helpers';

export interface UseLoadedDataArgs<T> {
  /**
   * An optional handler that will be called if there is an error.
   * Note that LoadedData object typing already allows expression of error status, convenient for consumption by
   * visual components.  This handler is to accommodate additional side effects within the hook consuming
   * useLoadedData hook
   * @param state - the error state as of when the error happened
   * @example
   * const [pendingCreate, setPendingCreate] = useLoadedData<true>({
   *   onError: (errState) => ReportError(errState.error)
   * })
   */
  onError?: (state: ErrorState<T, unknown>) => void;
}

/**
 * The Tuple returned by useLoadedData custom helper hook
 */
export type UseLoadedDataResult<T> = [LoadedState<T, unknown>, (dataCall: () => Promise<T>) => Promise<void>];

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
export const useLoadedData = <T>(hookArgs?: UseLoadedDataArgs<T>): UseLoadedDataResult<T> => {
  const args: UseLoadedDataArgs<T> = hookArgs || {};
  const [loadedData, setLoadedData] = useState<LoadedState<T, unknown>>({ status: 'None' });

  const updateDataFn = async (dataCall: () => Promise<T>) => {
    const previousState = loadedData.status !== 'None' ? loadedData.state : null;
    setLoadedData({
      status: 'Loading',
      state: previousState,
    });
    try {
      const result = await dataCall();
      setLoadedData({
        status: 'Ready',
        state: result,
      });
    } catch (err: unknown) {
      const error = isFetchResponse(err) ? Error(await err.text()) : err;
      const errorResult: ErrorState<T, unknown> = {
        status: 'Error',
        state: previousState,
        error,
      };
      setLoadedData(errorResult);
      if (args.onError) {
        args.onError(errorResult);
      }
    }
  };

  return [loadedData, updateDataFn];
};
