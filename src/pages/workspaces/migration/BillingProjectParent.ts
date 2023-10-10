import _ from 'lodash/fp';
import pluralize from 'pluralize';
import { ReactNode, useState } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import Collapse from 'src/components/Collapse';
import { ButtonOutline } from 'src/components/common';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import { reportErrorAndRethrow } from 'src/libs/error';
import * as Utils from 'src/libs/utils';
import {
  BillingProjectMigrationInfo,
  BillingProjectMigrationStats,
  errorIcon,
  getBillingProjectMigrationStats,
  inProgressIcon,
  successIcon,
} from 'src/pages/workspaces/migration/migration-utils';
import { WorkspaceItem } from 'src/pages/workspaces/migration/WorkspaceItem';
import { useMemo } from 'use-memo-one';

interface BillingProjectParentProps {
  billingProjectMigrationInfo: BillingProjectMigrationInfo;
}

export const BillingProjectParent = (props: BillingProjectParentProps): ReactNode => {
  const [migrationStats, setMigrationStats] = useState<BillingProjectMigrationStats>();
  const [migrateStarted, setMigrateStarted] = useState<boolean>(false);

  useMemo(() => {
    setMigrationStats(getBillingProjectMigrationStats(props.billingProjectMigrationInfo));
  }, [props.billingProjectMigrationInfo]);

  const renderErrorSummary = () => {
    return migrationStats?.errored === 0
      ? ''
      : span({ style: { paddingLeft: '0.5rem', paddingRight: '0.5rem' } }, [
          errorIcon,
          span({ style: { paddingLeft: '0.5rem', color: colors.danger() } }, [
            `${pluralize('Migration', migrationStats?.errored, true)} Failed`,
          ]),
        ]);
  };

  const renderMigrationSummary = () => {
    return Utils.cond(
      [
        migrationStats?.workspaceCount === migrationStats?.succeeded,
        () =>
          span({}, [
            successIcon,
            span({ style: { paddingLeft: '0.5rem', paddingRight: '0.5rem' } }, [
              `All ${pluralize('Workspace', migrationStats?.workspaceCount, true)} Migrated`,
            ]),
          ]),
      ],
      [
        !!migrationStats?.inProgress,
        () =>
          span({}, [
            inProgressIcon,
            span({ style: { paddingLeft: '0.5rem', paddingRight: '0.5rem' } }, [
              `${pluralize('Workspace', migrationStats?.inProgress, true)} Migrating`,
              !!migrationStats?.errored && ', ',
              renderErrorSummary(),
            ]),
          ]),
      ],
      [
        Utils.DEFAULT,
        () =>
          span({ style: { paddingRight: '0.5rem' } }, [
            !!migrationStats?.succeeded && `${pluralize('Workspace', migrationStats?.succeeded, true)} Migrated`,
            !!migrationStats?.succeeded && !!migrationStats?.errored && ', ',
            renderErrorSummary(),
          ]),
      ]
    );
  };

  return div({ role: 'listitem' }, [
    h(
      Collapse,
      {
        summaryStyle: { height: 60, paddingLeft: '1.5rem', paddingRight: '1.5rem', fontWeight: 600, display: 'flex' },
        titleFirst: true,
        style: {
          fontSize: 14,
          margin: '10px 15px',
          borderBottom: `1px solid ${colors.dark(0.2)}`,
          borderRadius: 5,
          background: 'white',
        },
        title: div({ style: {} }, [props.billingProjectMigrationInfo.namespace]),
        afterTitle: div(
          { style: { display: 'flex', marginLeft: 'auto', alignItems: 'center', fontWeight: 'normal' } },
          [
            div({ style: {} }, [renderMigrationSummary()]),
            !!migrationStats?.unscheduled &&
              h(
                ButtonOutline,
                {
                  disabled: migrateStarted,
                  tooltip: migrateStarted ? 'Migration has been scheduled' : '',
                  onClick: () => {
                    const migrateWorkspace = reportErrorAndRethrow('Error starting migration', async () => {
                      const workspacesToMigrate: { namespace: string; name: string }[] = [];
                      props.billingProjectMigrationInfo.workspaces.forEach((workspace) => {
                        if (workspace.migrationStep === 'Unscheduled') {
                          workspacesToMigrate.push({ namespace: workspace.namespace, name: workspace.name });
                        }
                      });
                      if (workspacesToMigrate.length > 0) {
                        setMigrateStarted(true);
                        await Ajax().Workspaces.startBatchBucketMigration(workspacesToMigrate);
                      }
                    });
                    migrateWorkspace();
                  },
                },
                [
                  migrationStats?.workspaceCount === migrationStats?.unscheduled
                    ? 'Migrate all workspaces'
                    : 'Migrate remaining workspaces',
                ]
              ),
          ]
        ),
        initialOpenState: true,
      },
      _.map(
        (workspaceMigrationInfo) => h(WorkspaceItem, { workspaceMigrationInfo }),
        props.billingProjectMigrationInfo.workspaces
      )
    ),
  ]);
};
