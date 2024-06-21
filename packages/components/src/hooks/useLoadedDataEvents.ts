import { ErrorState, LoadedState, ReadyState } from '@terra-ui-packages/core-utils';
import { useEffect } from 'react';

import { usePrevious } from './usePrevious';

export interface LoadedDataEvents<S, E = unknown> {
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
  onError?: (state: ErrorState<S, E>) => void;

  /**
   * An optional handler that will be called on successful data load.
   * Note that LoadedData object typing already allows expression of ready status, convenient for consumption by
   * visual components.  This handler is to accommodate additional side effects within the hook consuming
   * useLoadedData hook
   * @param state - the ready state as of when success happened (after loading state)
   * @example
   * const [pendingCreate, setPendingCreate] = useLoadedData<true>({
   *   onSuccess: (readyState) => doSomething(readyState.state)
   * })
   */
  onSuccess?: (state: ReadyState<S>) => void;
}

export const useLoadedDataEvents = <S, E = unknown>(loadedData: LoadedState<S, E>, events: LoadedDataEvents<S, E>) => {
  const { onSuccess, onError } = events;
  const previousStatus = usePrevious(loadedData.status);

  useEffect(() => {
    if (loadedData.status === 'Error' && previousStatus !== 'Error') {
      onError?.(loadedData);
    }
  }, [loadedData, previousStatus, onError]);
  useEffect(() => {
    if (loadedData.status === 'Ready' && previousStatus === 'Loading') {
      onSuccess?.(loadedData);
    }
  }, [loadedData, previousStatus, onSuccess]);
};
