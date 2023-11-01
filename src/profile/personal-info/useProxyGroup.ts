import { LoadedState, NoneState } from '@terra-ui-packages/core-utils';
import { useEffect, useState } from 'react';
import { User } from 'src/libs/ajax/User';
import { useCancellation } from 'src/libs/react-utils';

export interface UseProxyGroupResult {
  /** The proxy group and its loading status. */
  proxyGroup: Exclude<LoadedState<string, unknown>, NoneState>;
}

/**
 * Load a user's proxy group
 *
 * @param userEmail - The user's email.
 */
export const useProxyGroup = (userEmail: string | undefined): UseProxyGroupResult => {
  const [proxyGroupState, setProxyGroupState] = useState<UseProxyGroupResult['proxyGroup']>({
    status: 'Loading',
    state: null,
  });

  const signal = useCancellation();
  useEffect(() => {
    if (userEmail) {
      (async () => {
        try {
          const proxyGroup = await User(signal).getProxyGroup(userEmail);
          setProxyGroupState({ status: 'Ready', state: proxyGroup });
        } catch (error) {
          setProxyGroupState({
            status: 'Error',
            state: null,
            error,
          });
        }
      })();
    }
  }, [signal, userEmail]);

  return { proxyGroup: proxyGroupState };
};
