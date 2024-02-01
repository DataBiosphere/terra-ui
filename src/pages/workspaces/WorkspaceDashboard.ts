import { DashboardAuthContainer } from 'src/workspaces/dashboard/DashboardAuthContainer';

export const navPaths = [
  {
    name: 'workspace-dashboard',
    path: '/workspaces/:namespace/:name',
    component: DashboardAuthContainer,
    title: ({ name }) => `${name} - Dashboard`,
    public: true,
  },
];
