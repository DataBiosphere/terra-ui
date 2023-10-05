import _ from 'lodash/fp';

export type MigrationStep = ServerMigrationStep | 'Unscheduled';

export type MigrationOutcome = 'success' | 'failure' | 'in progress';

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
  outcome: 'success' | { failure: string };
  tempBucketTransferProgress: TransferProgress;
  finalBucketTransferProgress: TransferProgress;
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
      if (!_.isObjectLike(status)) {
        return { namespace, name, migrationStep: 'Unscheduled' };
      }
      const serverStatus = status as ServerMigrationStatus;
      return {
        namespace,
        name,
        migrationStep: serverStatus.migrationStep ?? 'Unscheduled',
        outcome:
          serverStatus.outcome === 'success' ? 'success' : _.isObject(serverStatus.outcome) ? 'failure' : undefined,
        failureReason: _.isObject(serverStatus.outcome) ? JSON.parse(serverStatus.outcome.failure).message : undefined,
        tempBucketTransferProgress: serverStatus.tempBucketTransferProgress,
        finalBucketTransferProgress: serverStatus.finalBucketTransferProgress,
      };
    }, sortedWorkspaces);
    return { namespace, workspaces: expandedWorkspaces };
  }, sortedNamespaceKeys);
  return billingProjectWorkspaces;
};
