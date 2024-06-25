import { icon, TooltipTrigger } from '@terra-ui-packages/components';
import { div, h, span } from 'react-hyperscript-helpers';
import { centeredSpinner } from 'src/components/icons';
import { renderInProgressElement, renderTaskCostElement } from 'src/components/job-common';
import colors from 'src/libs/colors';

export const WorkflowCostBox = ({ workflow, cost }) => {
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
