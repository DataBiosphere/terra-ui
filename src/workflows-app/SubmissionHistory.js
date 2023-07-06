import { h2 } from 'react-hyperscript-helpers';
import { wrapWorkflowsPage } from 'src/workflows-app/WorkflowsContainer';

export const SubmissionHistory = wrapWorkflowsPage({ name: 'SubmissionHistory' })((props, _ref) => {
  return h2(['Submission History page']);
});

export const navPaths = [
  {
    name: 'workspace-workflows-app-submission-history',
    path: '/workspaces/:namespace/:name/workflows-app/submission-history',
    component: SubmissionHistory,
    title: ({ name }) => `${name} - Submission History`,
  },
];
