import { Atom, LoadedState, ReadyState } from '@terra-ui-packages/core-utils';
import { useLoadedDataEvents } from 'src/libs/ajax/loaded-data/useLoadedData';
import { useSettableStore } from 'src/libs/react-utils';

export const useCachedData = <S, HookResult extends LoadedState<S, unknown>>(
  useHookInvoker: () => [HookResult, (dataCall: () => Promise<S>) => Promise<void>],
  store: Atom<S>
): [HookResult, (dataCall: () => Promise<S>) => Promise<void>] => {
  const [stored, setStored] = useSettableStore(store);
  const [dataResult, updateData] = useHookInvoker();
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
