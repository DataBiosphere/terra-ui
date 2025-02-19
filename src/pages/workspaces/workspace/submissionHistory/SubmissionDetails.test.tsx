import { navPaths } from 'src/pages/workspaces/workspace/submissionHistory/SubmissionDetails';

describe('Route Accessibility', () => {
  test('should contain valid paths for SubmissionDetails', () => {
    const expectedPaths = [
      '/workspaces/:namespace/:name/submission_history/:submissionId',
      '/workspaces/:namespace/:name/job_history/:submissionId',
    ];

    const actualPaths = navPaths.map((route) => route.path);

    expect(actualPaths).toEqual(expect.arrayContaining(expectedPaths));
  });
});
