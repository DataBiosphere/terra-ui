import { Atom, LoadedState, ReadyState } from '@terra-ui-packages/core-utils';
import { useLoadedDataEvents } from 'src/libs/ajax/loaded-data/useLoadedDataEvents';
import { useSettableStore } from 'src/libs/react-utils';

/**
 * adds durable in-memory caching of the last good data result from a useLoadedData-like data hook.
 *
 * @param useLoadedDataHook - a parameterless data request hook with the same return signature as the useLoadedData family of hooks.
 * Data request hooks that require parameters should first be wrapped into a parameterless hook so that it can be generically invoked by useCachedData.
 * @param store - the Atom to use for durable application in-memory storage
 */
export const useCachedData = <S, HookResult extends LoadedState<S, unknown>>(
  useLoadedDataHook: () => [HookResult, (dataCall: () => Promise<S>) => Promise<void>],
  store: Atom<S>
): [HookResult, (dataCall: () => Promise<S>) => Promise<void>] => {
  const [stored, setStored] = useSettableStore(store);
  const [dataResult, updateData] = useLoadedDataHook();
  useLoadedDataEvents(dataResult, {
    onSuccess: (result: ReadyState<S>) => {
      setStored(result.state);
    },
  });

  const finalResult =
    dataResult.status !== 'None'
      ? {
          ...dataResult,
          state: stored, // reflect cached source-of-truth
        }
      : stored
      ? ({
          status: 'Ready', // treat 'None' status as 'Ready' if we have a stored value
          state: stored,
        } as HookResult)
      : dataResult;

  return [finalResult, updateData];
};
