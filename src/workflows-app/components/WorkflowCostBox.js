import { icon, TooltipTrigger, useThemeFromContext } from '@terra-ui-packages/components';
import { useCallback, useEffect, useState } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import { centeredSpinner } from 'src/components/icons';
import { calculateTotalCost, renderInProgressElement, renderTaskCostElement } from 'src/components/job-common';
import { notify } from 'src/libs/notifications';
import { loadAppUrls } from 'src/workflows-app/utils/app-utils';
import { fetchMetadata } from 'src/workflows-app/utils/cromwell-metadata-utils';

export const WorkflowCostBox = ({ workflowId, signal, workspaceId, loadForSubworkflows }) => {
  const { colors } = useThemeFromContext();
  const [cost, setCost] = useState(0);
  const [workflow, setWorkflow] = useState();

  const loadForTotalWorkflowCost = useCallback(
    async (workflowId) => {
      try {
        const { cromwellProxyUrlState } = await loadAppUrls(workspaceId, 'cromwellProxyUrlState');
        const metadata = await fetchMetadata({
          cromwellProxyUrl: cromwellProxyUrlState.state,
          workflowId,
          signal,
          includeKeys: ['calls', 'taskStartTime', 'taskEndTime', 'vmCostUsd'],
          expandSubWorkflows: false,
        });
        if (metadata?.calls) {
          setWorkflow(metadata);
          const getCost = await calculateTotalCost(metadata?.calls, loadForSubworkflows);
          setCost(getCost);
        }
      } catch (error) {
        notify('error', 'Error loading cost details', { detail: error instanceof Response ? await error.text() : error });
      }
    },
    [loadForSubworkflows, signal, workspaceId]
  );

  useEffect(() => {
    loadForTotalWorkflowCost(workflowId).then();
  }, [loadForSubworkflows, loadForTotalWorkflowCost, workflowId]);

  return div({ style: { fontSize: 16, padding: '0rem 2.5rem 1rem' } }, [
    span({ style: { fontWeight: 'bold' } }, ['Approximate workflow cost: ']),
    renderInProgressElement({ status: workflow?.status }),
    span({}, [cost || cost === 0 ? renderTaskCostElement(cost) : centeredSpinner()]),
    h(
      TooltipTrigger,
      {
        content:
          'Approximate cost is calculated based on the list price of the VMs used and does not include disk cost or any cloud account discounts',
      },
      [icon('info-circle', { style: { marginLeft: '0.4rem', color: colors.accent(1) } })]
    ),
  ]);
};
