import { h2 } from 'react-hyperscript-helpers';
import { wrapWorkflowsPage } from 'src/workflows-app/WorkflowsContainer';

export const SubmissionConfig = wrapWorkflowsPage({ name: 'SubmissionConfig' })((props, _ref) => {
  return h2(['Submission Config page']);
});

export const navPaths = [
  {
    name: 'workspace-workflows-app-submission-config',
    path: '/workspaces/:namespace/:name/workflows-app/submission-config/:methodId',
    component: SubmissionConfig,
    title: ({ name }) => `${name} - Submission Config`,
  },
];
