import { ReactNode } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import { icon } from 'src/components/icons';
import { InfoBox } from 'src/components/InfoBox';
import colors from 'src/libs/colors';
import * as Utils from 'src/libs/utils';
import { WorkspaceMigrationInfo } from 'src/pages/workspaces/migration/migration-utils';

interface WorkspaceItemProps {
  workspaceMigrationInfo: WorkspaceMigrationInfo;
}

export const WorkspaceItem = (props: WorkspaceItemProps): ReactNode => {
  const workspaceInfo = props.workspaceMigrationInfo;

  const renderMigrationIcon = () => {
    return Utils.cond(
      [
        workspaceInfo.outcome === 'failure',
        () =>
          icon('warning-standard', {
            size: 18,
            style: { color: colors.danger() },
          }),
      ],
      [
        workspaceInfo.outcome === 'success',
        () =>
          icon('check', {
            size: 18,
            style: { color: colors.success() },
          }),
      ],
      [
        workspaceInfo.migrationStep !== 'Unscheduled',
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
  };

  const renderMigrationText = () => {
    const getTransferProgress = (transferType, processed, total) => {
      if (total === 0) {
        return `${transferType} Bucket Transfer`;
      }
      return `${transferType} Transfer in Progress (${Utils.formatBytes(processed)}/${Utils.formatBytes(total)})`;
    };

    return Utils.cond(
      [
        workspaceInfo.outcome === 'failure',
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
              [workspaceInfo.failureReason]
            ),
          ]),
      ],
      [workspaceInfo.outcome === 'success', () => span(['Migration Complete'])],
      [workspaceInfo.migrationStep === 'ScheduledForMigration', () => span(['Starting Migration'])],
      [workspaceInfo.migrationStep === 'PreparingTransferToTempBucket', () => span(['Preparing Original Bucket'])],
      [
        workspaceInfo.migrationStep === 'TransferringToTempBucket',
        () =>
          span([
            getTransferProgress(
              'Initial',
              workspaceInfo.tempBucketTransferProgress?.bytesTransferred,
              workspaceInfo.tempBucketTransferProgress?.totalBytesToTransfer
            ),
          ]),
      ],
      [workspaceInfo.migrationStep === 'PreparingTransferToFinalBucket', () => span(['Creating Destination Bucket'])],
      [
        workspaceInfo.migrationStep === 'TransferringToFinalBucket',
        () =>
          span([
            getTransferProgress(
              'Final',
              workspaceInfo.finalBucketTransferProgress?.bytesTransferred,
              workspaceInfo.finalBucketTransferProgress?.totalBytesToTransfer
            ),
          ]),
      ],
      // If workspace.outcome === 'success', we end earlier with a "Migration Complete" message.
      // Therefor we shouldn't encounter 'Finished' here, but handling it in case `outcome` updates later.
      [
        workspaceInfo.migrationStep === 'FinishingUp' || workspaceInfo.migrationStep === 'Finished',
        () => span(['Finishing Migration']),
      ]
    );
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
    [
      span([workspaceInfo.name]),
      div({ style: { display: 'flex' } }, [
        renderMigrationIcon(),
        div({ style: { display: 'flex', paddingLeft: '0.5rem', alignItems: 'center' } }, [renderMigrationText()]),
      ]),
    ]
  );
};
