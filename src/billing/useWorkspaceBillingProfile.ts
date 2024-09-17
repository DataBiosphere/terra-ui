import { useLoadedData, UseLoadedDataArgs } from '@terra-ui-packages/components';
import { LoadedState } from '@terra-ui-packages/core-utils';
import { useNotificationsFromContext } from '@terra-ui-packages/notifications';
import { useEffect } from 'react';
import { BillingProfile } from 'src/billing-core/models';
import { Billing } from 'src/libs/ajax/billing/Billing';
import { WorkspaceManagerResources } from 'src/libs/ajax/WorkspaceManagerResources';

export const useWorkspaceBillingProfile = (
  workspaceId: string,
  options: UseLoadedDataArgs<BillingProfile, unknown> = {}
): LoadedState<BillingProfile, unknown> => {
  const { reportError } = useNotificationsFromContext();
  const [state, load] = useLoadedData<BillingProfile>({
    ...options,
    onError: (error) => {
      reportError('Error loading billing project.', error);
      options.onError?.(error);
    },
  });

  useEffect(() => {
    const abortController = new AbortController();
    load(async () => {
      const workspace = await WorkspaceManagerResources(abortController.signal).getWorkspace(workspaceId);
      const billingProfile = await Billing(abortController.signal).getBillingProfile(workspace.spendProfile);
      return billingProfile;
    });
    return () => {
      abortController.abort();
    };
  }, [load, workspaceId]);

  return state;
};
