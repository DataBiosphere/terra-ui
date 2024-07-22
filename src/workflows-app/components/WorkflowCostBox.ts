import { icon, TooltipTrigger, useThemeFromContext } from '@terra-ui-packages/components';
import { div, h, span } from 'react-hyperscript-helpers';
import { centeredSpinner } from 'src/components/icons';
import { renderInProgressElement, renderTaskCostElement } from 'src/components/job-common';

export interface WorkflowCostBoxProps {
  workflowStatus?: string;
  workflowCost?: number;
}

export const WorkflowCostBox = (props: WorkflowCostBoxProps) => {
  const { colors } = useThemeFromContext();
  const { workflowCost, workflowStatus } = props;

  return div({ style: { fontSize: 16, padding: '0rem 2.5rem 1rem' } }, [
    span({ style: { fontWeight: 'bold' } }, ['Approximate workflow cost: ']),
    renderInProgressElement({ status: workflowStatus }),
    span({}, [workflowCost || workflowCost === 0 ? renderTaskCostElement(workflowCost) : centeredSpinner()]),
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
