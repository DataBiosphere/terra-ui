import React, { useEffect } from 'react';
import { useLoadedData, UseLoadedDataArgs, UseLoadedDataResult } from 'src/libs/ajax/loaded-data/useLoadedData';

/**
 * Provides the same basic mechanics of useLoadedData hook, but will auto-load the data 'on init', or in response to reloadDeps (dependencies) argument
 * @param dataCall - the promise-based data call to make
 * @param reloadDeps - any reload dependencies that should trigger a reload automatically
 * @param hookArgs - same as for useLoadedData
 */
export const useAutoLoadedData = <T>(
  dataCall: () => Promise<T>,
  reloadDeps: React.DependencyList,
  hookArgs?: UseLoadedDataArgs<T>
): UseLoadedDataResult<T> => {
  const [data, updateData] = useLoadedData<T>(hookArgs);

  useEffect(() => {
    void updateData(dataCall);
  }, reloadDeps); // eslint-disable-line react-hooks/exhaustive-deps
  return [data, updateData];
};
