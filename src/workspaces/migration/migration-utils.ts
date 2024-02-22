import { cond, DEFAULT } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import { icon } from 'src/components/icons';
import colors from 'src/libs/colors';

export type MigrationStep = ServerMigrationStep | 'Unscheduled';

export type MigrationOutcome = 'success' | 'failure';

export const errorIcon = icon('warning-standard', {
  size: 18,
  style: { color: colors.danger() },
});

export const successIcon = icon('check', {
  size: 18,
  style: { color: colors.success() },
});

export const inProgressIcon = icon('syncAlt', {
  size: 18,
  style: {
    animation: 'rotation 2s infinite linear',
    color: colors.success(),
  },
});

interface TransferProgress {
  totalBytesToTransfer: number;
  bytesTransferred: number;
  totalObjectsToTransfer: number;
  objectsTransferred: number;
}

export interface WorkspaceMigrationInfo {
  namespace: string;
  name: string;
  migrationStep: MigrationStep;
  outcome?: MigrationOutcome;
  failureReason?: string;
  tempBucketTransferProgress?: TransferProgress;
  finalBucketTransferProgress?: TransferProgress;
}

export interface BillingProjectMigrationInfo {
  namespace: string;
  workspaces: WorkspaceMigrationInfo[];
}

export interface WorkspaceWithNamespace {
  name: string;
  namespace: string;
}

// Server types that are transformed into the exported types.
type ServerMigrationStep =
  | 'ScheduledForMigration'
  | 'PreparingTransferToTempBucket'
  | 'TransferringToTempBucket'
  | 'PreparingTransferToFinalBucket'
  | 'TransferringToFinalBucket'
  | 'FinishingUp'
  | 'Finished';

interface ServerMigrationStatus {
  migrationStep: ServerMigrationStep;
  outcome?: 'success' | { failure: string };
  tempBucketTransferProgress?: TransferProgress;
  finalBucketTransferProgress?: TransferProgress;
}

export const parseServerResponse = (
  response: Record<string, ServerMigrationStatus | null>
): BillingProjectMigrationInfo[] => {
  // Group workspaces by namespace (billing project)
  const workspacesByNamespace: Record<
    string,
    { namespace: string; name: string; status: ServerMigrationStatus | null }[]
  > = {};
  _.forEach((workspace) => {
    const workspaceNameParts = workspace.split('/');
    const namespace = workspaceNameParts[0];
    const name = workspaceNameParts[1];
    if (!(namespace in workspacesByNamespace)) {
      workspacesByNamespace[namespace] = [];
    }
    workspacesByNamespace[namespace].push({ namespace, name, status: response[workspace] });
  }, _.keys(response));

  // Sort namespaces
  const sortedNamespaceKeys = _.orderBy([(key) => _.lowerCase(key)], ['asc'], _.keys(workspacesByNamespace));

  // Transform workspace information into exported types.
  const billingProjectWorkspaces: BillingProjectMigrationInfo[] = _.map((namespace: string) => {
    // Sort workspaces
    const sortedWorkspaces = _.orderBy([({ name }) => _.lowerCase(name)], ['asc'], workspacesByNamespace[namespace]);
    // Transform the information
    const expandedWorkspaces: WorkspaceMigrationInfo[] = _.map(({ name, status }) => {
      if (status === null) {
        return { namespace, name, migrationStep: 'Unscheduled' };
      }
      const getFailureMessage = () => {
        let failureMessage;
        if (_.isObject(status.outcome)) {
          try {
            failureMessage = JSON.parse(status.outcome.failure).message;
          } catch {
            failureMessage = status.outcome.failure;
          }
        }
        return failureMessage;
      };

      return {
        namespace,
        name,
        migrationStep: status.migrationStep ?? 'Unscheduled',
        // TODO: Remove nested ternary to align with style guide
        // eslint-disable-next-line no-nested-ternary
        outcome: status.outcome === 'success' ? 'success' : _.isObject(status.outcome) ? 'failure' : undefined,
        failureReason: getFailureMessage(),
        tempBucketTransferProgress: status.tempBucketTransferProgress,
        finalBucketTransferProgress: status.finalBucketTransferProgress,
      };
    }, sortedWorkspaces);
    return { namespace, workspaces: expandedWorkspaces };
  }, sortedNamespaceKeys);
  return billingProjectWorkspaces;
};

export interface BillingProjectMigrationStats {
  workspaceCount: number;
  succeeded: number;
  unscheduled: number;
  errored: number;
  inProgress: number;
}

export const getBillingProjectMigrationStats = (
  billingProjectInfo: BillingProjectMigrationInfo
): BillingProjectMigrationStats => {
  const migrationStats: BillingProjectMigrationStats = {
    workspaceCount: billingProjectInfo.workspaces.length,
    unscheduled: 0,
    errored: 0,
    succeeded: 0,
    inProgress: 0,
  };

  billingProjectInfo.workspaces.forEach((workspaceMigrationInfo) => {
    cond(
      [
        workspaceMigrationInfo.migrationStep === 'Unscheduled',
        () => {
          migrationStats.unscheduled += 1;
        },
      ],
      [
        workspaceMigrationInfo.migrationStep === 'Finished',
        () => {
          if (workspaceMigrationInfo.outcome === 'success') {
            migrationStats.succeeded += 1;
          } else {
            migrationStats.errored += 1;
          }
        },
      ],
      [
        DEFAULT,
        () => {
          migrationStats.inProgress += 1;
        },
      ]
    );
  });
  return migrationStats;
};

export const mergeBillingProjectMigrationInfo = (
  original: BillingProjectMigrationInfo[],
  updated: BillingProjectMigrationInfo[]
) => {
  const modified = _.cloneDeep(original);
  updated.forEach((migrationInfo) => {
    modified.forEach((modifiedMigrationInfo) => {
      if (migrationInfo.namespace === modifiedMigrationInfo.namespace) {
        modifiedMigrationInfo.workspaces = _.unionBy(
          'name',
          migrationInfo.workspaces,
          modifiedMigrationInfo.workspaces
        );
        modifiedMigrationInfo.workspaces = _.orderBy(
          [({ name }) => _.lowerCase(name)],
          ['asc'],
          modifiedMigrationInfo.workspaces
        );
      }
    });
  });
  return modified;
};

export const mergeWorkspacesWithNamespaces = (
  original: WorkspaceWithNamespace[],
  updated: WorkspaceWithNamespace[]
) => {
  return _.unionWith(_.isEqual, original, updated);
};
