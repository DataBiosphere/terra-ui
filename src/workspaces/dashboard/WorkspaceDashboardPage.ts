import { ReactNode } from 'react';
import * as breadcrumbs from 'src/components/breadcrumbs';
import { wrapWorkspace } from 'src/workspaces/container/WorkspaceContainer';
import { WorkspaceDashboard } from 'src/workspaces/dashboard/WorkspaceDashboard';

export interface WorkspaceDashboardPageProps {
  namespace: string;
  name: string;
}
export const WorkspaceDashboardPage: (props: WorkspaceDashboardPageProps) => ReactNode = wrapWorkspace({
  breadcrumbs: (props) => breadcrumbs.commonPaths.workspaceDashboard(props),
  activeTab: 'dashboard',
  title: 'Dashboard',
})(WorkspaceDashboard);
