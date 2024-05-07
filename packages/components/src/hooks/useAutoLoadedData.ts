import { ErrorState, LoadingState, ReadyState } from '@terra-ui-packages/core-utils';
import React, { useEffect } from 'react';

import { useLoadedData, UseLoadedDataArgs } from './useLoadedData';

/**
 * same as LoadedState<S, E>, but never in NoneState
 */
export type AutoLoadedState<S, E = unknown> = LoadingState<S> | ErrorState<S, E> | ReadyState<S>;

/**
 * same as UseLoadedDataResult, but state in tuple[0] of return is never in NoneState
 */
export type UseAutoLoadedDataResult<T, E = unknown> = [
  AutoLoadedState<T, E>,
  (dataCall: () => Promise<T>) => Promise<void>
];

/**
 * Provides the same basic mechanics of useLoadedData hook, but will auto-load the data 'on init',
 * or in response to the reloadDeps (dependencies) argument changing
 * @param dataCall - the promise-based data call to make
 * @param reloadDeps - any reload dependencies that should trigger a reload automatically
 * @param hookArgs - same as for useLoadedData
 */
export const useAutoLoadedData = <T>(
  dataCall: () => Promise<T>,
  reloadDeps: React.DependencyList,
  hookArgs?: UseLoadedDataArgs<T>
): UseAutoLoadedDataResult<T, unknown> => {
  const [data, updateData] = useLoadedData<T>(hookArgs);

  useEffect(() => {
    void updateData(dataCall);
  }, reloadDeps); // eslint-disable-line react-hooks/exhaustive-deps
  return [data as AutoLoadedState<T, unknown>, updateData];
};
