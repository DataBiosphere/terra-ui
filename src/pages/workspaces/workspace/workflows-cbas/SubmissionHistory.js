import { h2 } from 'react-hyperscript-helpers';
import { wrapWorkflowsPage } from 'src/pages/workspaces/workspace/workflows-cbas/WorkflowsContainer';

export const SubmissionHistory = wrapWorkflowsPage({ name: 'SubmissionHistory' })((props, _ref) => {
  return h2(['Submission History page']);
});

export const navPaths = [
  {
    name: 'workspace-workflows-cbas-submission-history',
    path: '/workspaces/:namespace/:name/workflows-cbas/submission-history',
    component: SubmissionHistory,
    title: ({ name }) => `${name} - Workflows`,
  },
];
