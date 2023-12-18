import { ReactNode } from 'react';
import * as breadcrumbs from 'src/components/breadcrumbs';
import { WorkspaceDashboard } from 'src/pages/workspaces/workspace/Dashboard/WorkspaceDashboard';
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer';

export interface WorkspaceDashboardPageProps {
  namespace: string;
  name: string;
}
export const WorkspaceDashboardPage: (props: WorkspaceDashboardPageProps) => ReactNode = wrapWorkspace({
  breadcrumbs: (props) => breadcrumbs.commonPaths.workspaceDashboard(props),
  activeTab: 'dashboard',
  title: 'Dashboard',
})(WorkspaceDashboard);
