import { h2 } from 'react-hyperscript-helpers';
import { wrapWorkflowsPage } from 'src/workflows-app/WorkflowsContainer';

export const SubmissionDetails = wrapWorkflowsPage({ name: 'SubmissionDetails' })((props, _ref) => {
  return h2(['Submission Details page']);
});

export const navPaths = [
  {
    name: 'workspace-workflows-app-submission-details',
    path: '/workspaces/:namespace/:name/workflows-app/submission-history/:submissionId',
    component: SubmissionDetails,
    title: ({ name }) => `${name} - Submission Details`,
  },
];
