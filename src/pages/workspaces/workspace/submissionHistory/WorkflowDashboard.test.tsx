import { navPaths } from 'src/pages/workspaces/workspace/submissionHistory/WorkflowDashboard';

describe('Route Accessibility', () => {
  test('should contain valid paths for WorkflowDashboard', () => {
    const expectedPaths = [
      '/workspaces/:namespace/:name/submission_history/:submissionId/:workflowId',
      '/workspaces/:namespace/:name/job_history/:submissionId/:workflowId',
    ];

    const actualPaths = navPaths.map((route) => route.path);

    expect(actualPaths).toEqual(expect.arrayContaining(expectedPaths));
  });
});
