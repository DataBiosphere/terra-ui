import { navPaths } from 'src/pages/workspaces/workspace/SubmissionHistory';

describe('Route Accessibility', () => {
  test('should contain valid paths for SubmissionHistory', () => {
    const expectedPaths = [
      '/workspaces/:namespace/:name/submission_history',
      '/workspaces/:namespace/:name/job_history',
    ];

    const actualPaths = navPaths.map((route) => route.path);

    expect(actualPaths).toEqual(expect.arrayContaining(expectedPaths));
  });
});
