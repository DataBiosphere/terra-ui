import { div, h } from 'react-hyperscript-helpers';
import FooterWrapper from 'src/components/FooterWrapper';
import TopBar from 'src/components/TopBar';
import * as Nav from 'src/libs/nav';
import { BillingProjectList } from 'src/workspaces/migration/BillingProjectList';
import { MigrationInformation } from 'src/workspaces/migration/WorkspaceInformation';

const WorkspaceMigrationPage = () => {
  return h(FooterWrapper, [
    h(TopBar, { title: 'Workspace Multi-Region Bucket Migrations', href: Nav.getLink('workspace-migration') }, []),
    div({ role: 'main', style: { display: 'flex', flex: '1 1 auto', flexFlow: 'column' } }, [
      h(MigrationInformation, {}),
      h(BillingProjectList, {}),
    ]),
  ]);
};

export const navPaths = [
  {
    name: 'workspace-migration',
    path: '/workspace-migration',
    component: WorkspaceMigrationPage,
    title: 'Workspace Migration',
  },
];
