import _ from 'lodash/fp';
import { useEffect, useState } from 'react';
import { div, h, h2, p, span } from 'react-hyperscript-helpers';
import Collapse from 'src/components/Collapse';
import { Link } from 'src/components/common';
import FooterWrapper from 'src/components/FooterWrapper';
import { icon, spinner } from 'src/components/icons';
import TopBar from 'src/components/TopBar';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import { reportErrorAndRethrow } from 'src/libs/error';
import * as Nav from 'src/libs/nav';
import { getLocalPref, setLocalPref } from 'src/libs/prefs';
import { useCancellation } from 'src/libs/react-utils';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { BillingProjectParent } from 'src/pages/workspaces/migration/BillingProjectParent';
import { BillingProjectMigrationInfo, parseServerResponse } from 'src/pages/workspaces/migration/migration-utils';

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
                'Migrations cannot be stopped once they begin. Migrations are only supported form US multi-region to ' +
                'US Central 1 (Iowa) at this time. Buckets that already exist in a single region will not be displayed.',
            ]),
            p([
              h(Link, { href: 'TBD', ...Utils.newTabLinkProps }, [
                'Blog post with additional information',
                icon('pop-out', {
                  size: 12,
                  style: { marginLeft: '0.25rem' },
                }),
              ]),
            ]),
          ]),
        ]
      ),
    ]),
  ]);
};

const ListView = () => {
  const [loadingMigrationInformation, setLoadingMigrationInformation] = useState(true);
  const [billingProjectWorkspaces, setBillingProjectWorkspaces] = useState<BillingProjectMigrationInfo[]>([]);
  const signal = useCancellation();
  useEffect(() => {
    const loadWorkspaces = _.flow(
      reportErrorAndRethrow('Error loading workspace migration information'),
      Utils.withBusyState(setLoadingMigrationInformation)
    )(async () => {
      const migrationResponse = (await Ajax(signal).Workspaces.bucketMigration()) as Record<string, any>;
      setBillingProjectWorkspaces(parseServerResponse(migrationResponse));
    });
    loadWorkspaces();
  }, [setBillingProjectWorkspaces, signal]);

  return div({ style: { padding: '10px', backgroundColor: colors.light(), flexGrow: 1 } }, [
    h2({ style: { fontSize: 16, marginLeft: '1rem' } }, ['Billing Projects']),
    loadingMigrationInformation &&
      div({ style: { display: 'flex', alignItems: 'center', marginLeft: '1rem' } }, [
        spinner({ size: 36 }),
        span({ style: { fontSize: 16, marginLeft: '0.5rem', marginTop: '0.5rem', fontStyle: 'italic' } }, [
          'Fetching billing projects',
        ]),
      ]),
    div(
      { role: 'list' },
      _.map((billingProjectWorkspaces) => h(BillingProjectParent, billingProjectWorkspaces), billingProjectWorkspaces)
    ),
  ]);
};

export const WorkspaceMigrationPage = () => {
  return h(FooterWrapper, [
    h(TopBar, { title: 'Workspace Multi-Region Bucket Migrations', href: Nav.getLink('workspace-migration') }, []),
    div({ role: 'main', style: { display: 'flex', flex: '1 1 auto', flexFlow: 'column' } }, [
      h(MigrationInformation, {}),
      h(ListView, {}),
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
