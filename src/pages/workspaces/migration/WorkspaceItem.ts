import { div, h, span } from 'react-hyperscript-helpers';
import { icon } from 'src/components/icons';
import { InfoBox } from 'src/components/PopupTrigger';
import colors from 'src/libs/colors';
import * as Utils from 'src/libs/utils';
import { WorkspaceMigrationInfo } from 'src/pages/workspaces/migration/migration-utils';

export const WorkspaceItem = (workspace: WorkspaceMigrationInfo) => {
  const renderMigrationState = () => {
    const text = Utils.cond(
      [
        workspace.outcome === 'failure',
        () =>
          span({ style: { color: colors.danger() } }, [
            'Migration Failed',
            h(
              InfoBox,
              {
                style: { marginLeft: '0.5rem' },
                side: 'bottom',
                tooltip: 'Failure information',
                size: 18,
                iconOverride: undefined,
              },
              [workspace.failureReason]
            ),
          ]),
      ],
      [workspace.outcome === 'success', () => span(['Migration Complete'])],
      [workspace.migrationStep !== 'Unscheduled', span(['Migration in Progress'])]
    );
    const statusIcon = Utils.cond(
      [
        workspace.outcome === 'failure',
        () =>
          icon('warning-standard', {
            size: 18,
            style: { color: colors.danger() },
          }),
      ],
      [
        workspace.outcome === 'success',
        () =>
          icon('check', {
            size: 18,
            style: { color: colors.success() },
          }),
      ],
      [
        workspace.migrationStep !== 'Unscheduled',
        () =>
          icon('syncAlt', {
            size: 18,
            style: {
              animation: 'rotation 2s infinite linear',
              color: colors.success(),
            },
          }),
      ]
    );
    return div({ style: { display: 'flex' } }, [
      statusIcon,
      div({ style: { display: 'flex', paddingLeft: '0.5rem', alignItems: 'center' } }, [text]),
    ]);
  };

  return div(
    {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '1.0rem 2.5rem',
        borderTop: `1px solid ${colors.dark(0.2)}`,
      },
    },
    [span([workspace.name]), renderMigrationState()]
  );
};
