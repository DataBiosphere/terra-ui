import { icon, TooltipTrigger } from '@terra-ui-packages/components';
import { div, h, span } from 'react-hyperscript-helpers';
import { renderInProgressElement, renderTaskCostElement } from 'src/components/job-common';
import colors from 'src/libs/colors';

export const WorkflowCostBox = ({ workflow, cost }) => {
  // console.log(cost);
  return div({ style: { fontSize: 16, padding: '0rem 2.5rem 1rem' } }, [
    span({ style: { fontWeight: 'bold' } }, ['Approximate workflow cost: ']),
    renderInProgressElement(workflow),
    renderTaskCostElement(cost),
    h(
      TooltipTrigger,
      {
        content:
          'Approximate cost is calculated based on the list price of the VMs used and does not include disk cost, subworkflow cost, or any cloud account discounts',
      },
      [icon('info-circle', { style: { marginLeft: '0.4rem', color: colors.accent(1) } })]
    ),
  ]);
};
