import { icon, Link } from '@terra-ui-packages/components';
import { useEffect, useState } from 'react';
import { div, h, h2, p } from 'react-hyperscript-helpers';
import Collapse from 'src/components/Collapse';
import FooterWrapper from 'src/components/FooterWrapper';
import TopBar from 'src/components/TopBar';
import colors from 'src/libs/colors';
import * as Nav from 'src/libs/nav';
import { getLocalPref, setLocalPref } from 'src/libs/prefs';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { BillingProjectList } from 'src/workspaces/migration/BillingProjectList';

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
              'While we have done our best to protect bucket migrations from egress charges through March 15, 2024, ' +
                'we cannot guarantee that there will be no egress or other operational charges when migrating buckets. ' +
                'Large buckets with hundreds of thousands of files or more may see a one-time Storage Log operational charge equaling about $2.50 for every 1 million files in the bucket. ' +
                'If you have any concerns, you should contact your Google Billing Representative prior to migrating your buckets.',
            ]),
            p([
              'Some buckets may take a very long time to migrate. You are responsible for coordinating any extended downtime with users of your workspaces. ' +
                'We recommend planning for at least 24 hours of downtime for every 100TB of data in a bucket.',
            ]),
            p([
              'Migrations cannot be stopped once they begin. Migrations are only supported from US multi-region to US Central 1 (Iowa) at this time. ' +
                'Buckets that already exist in a single region will not be displayed.',
            ]),
            p([
              h(
                Link,
                {
                  href: 'https://support.terra.bio/hc/en-us/articles/19677261508507-Workspace-multi-region-bucket-migration',
                  ...Utils.newTabLinkProps,
                },
                [
                  'Support article with additional information',
                  icon('pop-out', {
                    size: 12,
                    style: { marginLeft: '0.25rem' },
                  }),
                ]
              ),
            ]),
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
