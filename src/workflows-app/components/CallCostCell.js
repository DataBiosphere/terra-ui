import { useEffect, useState } from 'react';
import { span } from 'react-hyperscript-helpers';
import { centeredSpinner } from 'src/components/icons';
import { calculateTotalCost, renderInProgressElement, renderTaskCostElement } from 'src/components/job-common';

export const CallCostCell = ({ call, loadForSubworkflows }) => {
  const [cost, setCost] = useState(0);
  useEffect(() => {
    calculateTotalCost(call, loadForSubworkflows).then((callCost) => setCost(callCost));
  }, [call, loadForSubworkflows]);

  if (cost === undefined) {
    return centeredSpinner();
  }
  return span({}, [renderInProgressElement({ status: call.executionStatus }), renderTaskCostElement(cost)]);
};
