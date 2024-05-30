import { useLoadedData, UseLoadedDataArgs } from '@terra-ui-packages/components';
import { LoadedState } from '@terra-ui-packages/core-utils';
import { useNotificationsFromContext } from '@terra-ui-packages/notifications';
import { useEffect } from 'react';
import { BillingProject } from 'src/billing-core/models';
import { Billing } from 'src/libs/ajax/Billing';

export const useBillingProject = (
  name: string,
  options: UseLoadedDataArgs<BillingProject, unknown> = {}
): LoadedState<BillingProject, unknown> => {
  const { reportError } = useNotificationsFromContext();
  const [state, load] = useLoadedData<BillingProject>({
    ...options,
    onError: (error) => {
      reportError('Error loading billing project.', error);
      options.onError?.(error);
    },
  });

  useEffect(() => {
    const abortController = new AbortController();
    load(() => Billing(abortController.signal).getProject(name));
    return () => {
      abortController.abort();
    };
  }, [load, name]);

  return state;
};
