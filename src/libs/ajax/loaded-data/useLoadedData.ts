import { ErrorState, LoadedState, ReadyState } from '@terra-ui-packages/core-utils';
import { useCallback, useState } from 'react';
import { LoadedDataEvents, useLoadedDataEvents } from 'src/libs/ajax/loaded-data/useLoadedDataEvents';

export type UseLoadedDataArgs<S, E = unknown> = LoadedDataEvents<S, E>;

/**
 * The Tuple returned by useLoadedData custom helper hook
 */
export type UseLoadedDataResult<T, E = unknown> = [LoadedState<T, E>, (dataCall: () => Promise<T>) => Promise<void>];

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
  useLoadedDataEvents(loadedData, args);
  const updateDataFn = useCallback(async (dataCall: () => Promise<T>) => {
    setLoadedData((previousLoadedData) => {
      const previousState = previousLoadedData.status !== 'None' ? previousLoadedData.state : null;
      return {
        status: 'Loading',
        state: previousState,
      };
    });
    try {
      const result = await dataCall();
      const readyState: ReadyState<T> = {
        status: 'Ready',
        state: result,
      };
      setLoadedData(readyState);
    } catch (err: unknown) {
      const error = err instanceof Response ? Error(await err.text()) : err;
      setLoadedData((previousLoadedData) => {
        const previousState = previousLoadedData.status !== 'None' ? previousLoadedData.state : null;
        const errorResult: ErrorState<T, unknown> = {
          status: 'Error',
          state: previousState,
          error,
        };
        return errorResult;
      });
    }
  }, []);
  return [loadedData, updateDataFn];
};
