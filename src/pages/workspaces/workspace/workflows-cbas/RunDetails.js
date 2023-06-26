import { h2 } from 'react-hyperscript-helpers';
import { wrapWorkflowsPage } from 'src/pages/workspaces/workspace/workflows-cbas/WorkflowsContainer';

export const RunDetails = wrapWorkflowsPage({ name: 'RunDetails' })((props, _ref) => {
  return h2(['Run Details page']);
});

export const navPaths = [
  {
    name: 'workspace-workflows-cbas-run-details',
    path: '/workspaces/:namespace/:name/workflows-cbas/submission-monitoring/:submissionId/:workflowId',
    component: RunDetails,
    title: ({ name }) => `${name} - Workflows`,
  },
];
