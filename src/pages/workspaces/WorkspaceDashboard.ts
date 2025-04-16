import { DashboardAuthContainer } from 'src/pages/workspaces/DashboardAuthContainer';

const workspacePathConfig = {
  name: 'workspace-dashboard',
  component: DashboardAuthContainer,
  public: true,
};

export const navPaths = [
  {
    path: '/workspaces/:namespace/:name',
    title: ({ name }) => `${name} - Dashboard`,
    ...workspacePathConfig,
  },
  {
    path: '/workspaces/:id',
    title: '',
    ...workspacePathConfig,
  },
];
