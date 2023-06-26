import { h2 } from 'react-hyperscript-helpers';
import { wrapWorkflowsPage } from 'src/pages/workspaces/workspace/workflows-cbas/WorkflowsContainer';

export const SubmissionDetails = wrapWorkflowsPage({ name: 'SubmissionDetails' })((props, _ref) => {
  return h2(['Submission Details page']);
});

export const navPaths = [
  {
    name: 'workspace-workflows-cbas-submission-details',
    path: '/workspaces/:namespace/:name/workflows-cbas/submission-history/:submissionId',
    component: SubmissionDetails,
    title: ({ name }) => `${name} - Workflows`,
  },
];
