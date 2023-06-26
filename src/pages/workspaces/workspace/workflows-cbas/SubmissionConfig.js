import { h2 } from 'react-hyperscript-helpers';
import { wrapWorkflowsPage } from 'src/pages/workspaces/workspace/workflows-cbas/WorkflowsContainer';

export const SubmissionConfig = wrapWorkflowsPage({ name: 'SubmissionConfig' })((props, _ref) => {
  return h2(['Submission Config page']);
});

export const navPaths = [
  {
    name: 'workspace-workflows-cbas-submission-config',
    path: '/workspaces/:namespace/:name/workflows-cbas/submission-config/:methodId',
    component: SubmissionConfig,
    title: ({ name }) => `${name} - Workflows`,
  },
];
