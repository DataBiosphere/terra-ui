import { span } from 'react-hyperscript-helpers';
import { centeredSpinner } from 'src/components/icons';
import { renderInProgressElement, renderTaskCostElement } from 'src/components/job-common';

export interface CallCostCellProps {
  call: any;
  getCostOfCallFn: (fullyQualifiedCallPath: string) => number | undefined;
}

const isCostDataPresent = (call: any) => {
  if (call?.callCaching?.hit === true) {
    return false;
  }
  if (!call?.taskStartTime) {
    return false;
  }
  return true;
};

export const CallCostCell = (props: CallCostCellProps) => {
  const callName = props?.call?.taskName;
  const executionStatus = props?.call?.executionStatus;
  const costDataPresent = isCostDataPresent(props?.call);

  if (!callName || !executionStatus) {
    return centeredSpinner();
  }

  if (!costDataPresent) {
    return span(['N/A']);
  }
  return span({}, [
    renderInProgressElement({ status: executionStatus }),
    renderTaskCostElement(props.getCostOfCallFn(callName)),
  ]);
};
