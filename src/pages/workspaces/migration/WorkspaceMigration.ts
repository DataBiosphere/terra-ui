import { useEffect, useState } from 'react';
import { div, h, h2, p } from 'react-hyperscript-helpers';
import Collapse from 'src/components/Collapse';
import FooterWrapper from 'src/components/FooterWrapper';
import TopBar from 'src/components/TopBar';
import colors from 'src/libs/colors';
import * as Nav from 'src/libs/nav';
import { getLocalPref, setLocalPref } from 'src/libs/prefs';
import * as Style from 'src/libs/style';
import { BillingProjectList } from 'src/pages/workspaces/migration/BillingProjectList';

const MigrationInformation = () => {
  const persistenceId = 'multiregionBucketMigration';
  const [infoPanelOpen, setInfoPanelOpen] = useState(() => getLocalPref(persistenceId)?.infoPanelOpen);

  useEffect(() => {
    setLocalPref(persistenceId, {
      infoPanelOpen,
    });
  }, [persistenceId, infoPanelOpen]);

  return div({ style: { backgroundColor: 'white', borderBottom: `2px solid ${colors.primary(0.55)}` } }, [
    div({ style: Style.dashboard.rightBoxContainer }, [
      h(
        Collapse,
        {
          initialOpenState: infoPanelOpen !== undefined ? infoPanelOpen : true,
          titleFirst: false,
          title: h2({ style: { ...Style.dashboard.collapsibleHeader } }, ['Important information on bucket migration']),
          onClick: () => setInfoPanelOpen(!infoPanelOpen),
        },
        [
          div({ style: { margin: '10px 20px' } }, [
            p([
              'While we have done our best to protect bucket migration from egress charges through December 15, 2023, ' +
                'we cannot guarantee that there will be no egress or other operational charges when migrating buckets. ' +
                'If you have any concerns, you should contact your Google Billing Representative prior to migrating your buckets.',
            ]),
            p([
              'Some buckets may take a very long time to migrate. You are responsible for coordinating any extended downtime with users of your workspaces. ' +
                'We recommend planning for at least 24 hours of downtime for every 100TB of data in a bucket.',
            ]),
            p([
              'Migrations cannot be stopped once they begin. Migrations are only supported form US multi-region to US Central 1 (Iowa) at this time. ' +
                'Buckets that already exist in a single region will not be displayed.',
            ]),
            // Don't yet have the link
            // p([
            //   h(Link, { href: 'TBD', ...Utils.newTabLinkProps }, [
            //     'Blog post with additional information',
            //     icon('pop-out', {
            //       size: 12,
            //       style: { marginLeft: '0.25rem' },
            //     }),
            //   ]),
            // ]),
          ]),
        ]
      ),
    ]),
  ]);
};

export const WorkspaceMigrationPage = () => {
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
