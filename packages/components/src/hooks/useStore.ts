import { Atom } from '@terra-ui-packages/core-utils';
import { useEffect, useState } from 'react';

/**
 * Hook that returns the value of a given store. When the store changes, the component will re-render
 */
export const useStore = <T>(theStore: Atom<T>): T => {
  const [value, setValue] = useState(theStore.get());
  useEffect(() => {
    return theStore.subscribe((v) => setValue(v)).unsubscribe;
  }, [theStore]);
  return value;
};

/**
 * Hook that returns a tuple with [currentValue, setValueFn] for a given store.  This provides an alternative
 * to useStore hook above that more closely emulates the tuple return of built-in useState hook.
 * When the store changes, the component will re-render.
 * @param theStore
 */
export const useSettableStore = <T>(theStore: Atom<T>): [T, (value: T) => void] => {
  const currentStoreValue = useStore(theStore);

  return [currentStoreValue, theStore.set];
};
