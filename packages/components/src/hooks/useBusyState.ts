import { AnyPromiseFn } from '@terra-ui-packages/core-utils';
import { useState } from 'react';

export type UseBusyStateTuple = [isBusy: boolean, withBusyState: <F extends AnyPromiseFn>(fn: F) => F];

/**
 * tracks isBusy flag when a provided async function is called.
 *
 * @returns a [isBusy, withBusyState] tuple
 *
 * @example
 *   const [isLoadingXList, withLoadingXList] = useBusyState();
 *   // ...
 *   const loadXList = withHandlers([withLoadingXList], async () => {
 *       return await dataXProvider.list();
 *   }
 *   // render...
 *     isLoadingXList && Spinner
 */
export const useBusyState = (): UseBusyStateTuple => {
  const [busy, setBusy] = useState<boolean>(false);
  const withBusy = <F extends AnyPromiseFn>(fn: F): F => {
    return (async (...args: Parameters<F>) => {
      try {
        setBusy(true);
        return await fn(...args);
      } finally {
        setBusy(false);
      }
    }) as F;
  };

  return [busy, withBusy];
};
