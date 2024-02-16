import { Atom, LoadedState, ReadyState } from '@terra-ui-packages/core-utils';
import { AutoLoadedState } from 'src/libs/ajax/loaded-data/useAutoLoadedData';
import { useLoadedDataEvents } from 'src/libs/ajax/loaded-data/useLoadedDataEvents';
import { useSettableStore } from 'src/libs/react-utils';

type LoadedDataFn<S, E = unknown> = (
  ...args: any[]
) => [LoadedState<S, E> | AutoLoadedState<S, E>, (dataCall: () => Promise<S>) => Promise<void>];

/**
 * adds durable in-memory caching of the last good data result from a useLoadedData-like data hook.
 *
 * @param store - the Atom to use for durable application in-memory storage
 *
 * @param useLoadedDataHook - a request hook function with the same return signature as the useLoadedData family of hooks.
 *
 * @returns a wrapped hook with the same function signature as provided useLoadedDataHook function
 */
export const withCachedData = <S, F extends LoadedDataFn<S>>(store: Atom<S>, useLoadedDataHook: F): F => {
  const useWrappedHook: F = ((...args) => {
    const [stored, setStored] = useSettableStore(store);
    const [dataResult, updateData] = useLoadedDataHook(...args);
    useLoadedDataEvents(dataResult, {
      onSuccess: (result: ReadyState<S>) => {
        setStored(result.state);
      },
    });

    const finalResult: typeof dataResult =
      // eslint-disable-next-line no-nested-ternary
      dataResult.status !== 'None'
        ? {
            ...dataResult,
            state: stored, // reflect cached source-of-truth
          }
        : stored
        ? {
            status: 'Ready', // treat 'None' status as 'Ready' if we have a stored value
            state: stored,
          }
        : dataResult;

    return [finalResult, updateData];
  }) as F;
  return useWrappedHook;
};
