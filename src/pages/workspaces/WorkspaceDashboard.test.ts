import { navPaths } from 'src/pages/workspaces/WorkspaceDashboard';

describe('navPaths', () => {
  it('should define the correct paths and configurations', () => {
    expect(navPaths).toEqual([
      {
        path: '/workspaces/:namespace/:name',
        title: expect.any(Function),
        name: 'workspace-dashboard',
        component: expect.any(Function),
        public: true,
      },
      {
        path: '/workspaces/:id',
        title: '',
        name: 'workspace-dashboard',
        component: expect.any(Function),
        public: true,
      },
    ]);
  });

  it('should generate the correct title for the first path', () => {
    const titleFunction = navPaths[0].title as (params: { name: string }) => string;
    expect(titleFunction({ name: 'TestWorkspace' })).toBe('TestWorkspace - Dashboard');
  });
});
