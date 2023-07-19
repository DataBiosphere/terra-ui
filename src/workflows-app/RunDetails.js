import { h2 } from 'react-hyperscript-helpers';
import { wrapWorkflowsPage } from 'src/workflows-app/WorkflowsContainer';

export const RunDetails = wrapWorkflowsPage({ name: 'RunDetails' })((props, _ref) => {
  return h2(['Run Details page']);
});

export const navPaths = [
  {
    name: 'workspace-workflows-app-run-details',
    path: '/workspaces/:namespace/:name/workflows-app/submission-monitoring/:submissionId/:workflowId',
    component: RunDetails,
    title: ({ name }) => `${name} - Run Details`,
  },
];
