import _ from 'lodash/fp';
import {
  BillingProjectMigrationInfo,
  getBillingProjectMigrationStats,
  mergeBillingProjectMigrationInfo,
  mergeWorkspacesWithNamespaces,
  parseServerResponse,
  WorkspaceMigrationInfo,
} from 'src/workspaces/migration/migration-utils';

export const mockServerData = {
  'CARBilling-2/notmigrated': null,
  'CARBilling-2/april29': {
    finalBucketTransferProgress: {
      bytesTransferred: 288912,
      objectsTransferred: 561,
      totalBytesToTransfer: 288912,
      totalObjectsToTransfer: 561,
    },
    migrationStep: 'Finished' as const,
    outcome: 'success' as const,
    tempBucketTransferProgress: {
      bytesTransferred: 288912,
      objectsTransferred: 561,
      totalBytesToTransfer: 288912,
      totalObjectsToTransfer: 561,
    },
  },
  'general-dev-billing-account/Christina test': {
    finalBucketTransferProgress: {
      bytesTransferred: 0,
      objectsTransferred: 0,
      totalBytesToTransfer: 0,
      totalObjectsToTransfer: 0,
    },
    migrationStep: 'TransferringToTempBucket' as const,
    tempBucketTransferProgress: {
      bytesTransferred: 1000,
      objectsTransferred: 2,
      totalBytesToTransfer: 2000,
      totalObjectsToTransfer: 4,
    },
  },
  'CARBillingTest/testdata': {
    migrationStep: 'Finished' as const,
    outcome: {
      failure:
        '{"billingProjectBillingAccount":"RawlsBillingAccountName(billingAccounts/00708C-45D19D-27AAFA)","migrationId":"3","workspace":"CARBillingTest/testdata","billingProject":"RawlsBillingProjectName(CARBillingTest)","message":"The bucket migration failed while removing workspace bucket IAM: invalid billing account on billing project."}',
    },
  },
};

export const bpWithSucceededAndUnscheduled: BillingProjectMigrationInfo = {
  namespace: 'CARBilling-2',
  workspaces: [
    {
      failureReason: undefined,
      finalBucketTransferProgress: {
        bytesTransferred: 288912,
        objectsTransferred: 561,
        totalBytesToTransfer: 288912,
        totalObjectsToTransfer: 561,
      },
      migrationStep: 'Finished',
      name: 'april29',
      namespace: 'CARBilling-2',
      outcome: 'success',
      tempBucketTransferProgress: {
        bytesTransferred: 288912,
        objectsTransferred: 561,
        totalBytesToTransfer: 288912,
        totalObjectsToTransfer: 561,
      },
    },
    { migrationStep: 'Unscheduled', name: 'notmigrated', namespace: 'CARBilling-2' },
  ],
};

export const bpWithFailed: BillingProjectMigrationInfo = {
  namespace: 'CARBillingTest',
  workspaces: [
    {
      failureReason:
        'The bucket migration failed while removing workspace bucket IAM: invalid billing account on billing project.',
      finalBucketTransferProgress: undefined,
      migrationStep: 'Finished',
      name: 'testdata',
      namespace: 'CARBillingTest',
      outcome: 'failure',
      tempBucketTransferProgress: undefined,
    },
  ],
};

export const bpWithInProgress: BillingProjectMigrationInfo = {
  namespace: 'general-dev-billing-account',
  workspaces: [
    {
      failureReason: undefined,
      finalBucketTransferProgress: {
        bytesTransferred: 0,
        objectsTransferred: 0,
        totalBytesToTransfer: 0,
        totalObjectsToTransfer: 0,
      },
      migrationStep: 'TransferringToTempBucket',
      name: 'Christina test',
      namespace: 'general-dev-billing-account',
      outcome: undefined,
      tempBucketTransferProgress: {
        bytesTransferred: 1000,
        objectsTransferred: 2,
        totalBytesToTransfer: 2000,
        totalObjectsToTransfer: 4,
      },
    },
  ],
};

const billingProjectList = [bpWithSucceededAndUnscheduled, bpWithFailed, bpWithInProgress];

describe('parseServerResponse', () => {
  it('Can handle an empty response', () => {
    expect(parseServerResponse({})).toEqual([]);
  });

  it('Transforms the server data to a list format', () => {
    expect(parseServerResponse(mockServerData)).toEqual(billingProjectList);
  });

  it('Can handle a non-jSON failure message', () => {
    const alternateErrorFormat = {
      'CARBillingTest/testdata': {
        migrationStep: 'Finished' as const,
        outcome: {
          failure: 'io.grpc.StatusRuntimeException: NOT_FOUND: Service account',
        },
      },
    };
    const expected = [
      {
        namespace: 'CARBillingTest',
        workspaces: [
          {
            failureReason: 'io.grpc.StatusRuntimeException: NOT_FOUND: Service account',
            finalBucketTransferProgress: undefined,
            migrationStep: 'Finished',
            name: 'testdata',
            namespace: 'CARBillingTest',
            outcome: 'failure',
            tempBucketTransferProgress: undefined,
          },
        ],
      },
    ];
    expect(parseServerResponse(alternateErrorFormat)).toEqual(expected);
  });
});

describe('getBillingProjectMigrationStats', () => {
  it('Can handle an empty workspace array', () => {
    expect(getBillingProjectMigrationStats({ namespace: 'foo', workspaces: [] })).toEqual({
      workspaceCount: 0,
      unscheduled: 0,
      errored: 0,
      succeeded: 0,
      inProgress: 0,
    });
  });

  it('Can handle actual data', () => {
    expect(getBillingProjectMigrationStats(bpWithSucceededAndUnscheduled as BillingProjectMigrationInfo)).toEqual({
      workspaceCount: 2,
      unscheduled: 1,
      errored: 0,
      succeeded: 1,
      inProgress: 0,
    });

    expect(getBillingProjectMigrationStats(bpWithFailed as BillingProjectMigrationInfo)).toEqual({
      workspaceCount: 1,
      unscheduled: 0,
      errored: 1,
      succeeded: 0,
      inProgress: 0,
    });

    expect(getBillingProjectMigrationStats(bpWithInProgress as BillingProjectMigrationInfo)).toEqual({
      workspaceCount: 1,
      unscheduled: 0,
      errored: 0,
      succeeded: 0,
      inProgress: 1,
    });
  });
});

describe('mergeBillingProjectMigrationInfo', () => {
  it('Can handle an empty update list', () => {
    const original = [bpWithSucceededAndUnscheduled, bpWithInProgress];
    expect(mergeBillingProjectMigrationInfo(original, [])).toEqual(original);
  });

  it('Can merge in a workspace that has started migration', () => {
    const original: BillingProjectMigrationInfo[] = [bpWithSucceededAndUnscheduled, bpWithInProgress];
    const updatedWorkspaceInfo: WorkspaceMigrationInfo = {
      migrationStep: 'ScheduledForMigration',
      name: 'notmigrated',
      namespace: 'CARBilling-2',
      failureReason: undefined,
      outcome: undefined,
      finalBucketTransferProgress: undefined,
      tempBucketTransferProgress: undefined,
    };

    const updated: BillingProjectMigrationInfo[] = [
      {
        namespace: 'CARBilling-2',
        workspaces: [updatedWorkspaceInfo],
      },
    ];
    const expected = [
      {
        namespace: 'CARBilling-2',
        workspaces: [bpWithSucceededAndUnscheduled.workspaces[0], updatedWorkspaceInfo],
      },
      bpWithInProgress,
    ];
    expect(mergeBillingProjectMigrationInfo(original, updated)).toMatchObject(expected);
  });

  it('Can merge in a workspace that has finished migration', () => {
    const original: BillingProjectMigrationInfo[] = [bpWithSucceededAndUnscheduled, bpWithInProgress];
    const updatedWorkspaceInfo: WorkspaceMigrationInfo = {
      failureReason: undefined,
      finalBucketTransferProgress: {
        bytesTransferred: 288912,
        objectsTransferred: 561,
        totalBytesToTransfer: 288912,
        totalObjectsToTransfer: 561,
      },
      migrationStep: 'Finished',
      name: 'Christina test',
      namespace: 'general-dev-billing-account',
      outcome: 'success',
      tempBucketTransferProgress: {
        bytesTransferred: 288912,
        objectsTransferred: 561,
        totalBytesToTransfer: 288912,
        totalObjectsToTransfer: 561,
      },
    };
    const updated: BillingProjectMigrationInfo[] = [
      {
        namespace: 'general-dev-billing-account',
        workspaces: [updatedWorkspaceInfo],
      },
    ];
    const expected = [bpWithSucceededAndUnscheduled, updated[0]];
    expect(mergeBillingProjectMigrationInfo(original, updated)).toMatchObject(expected);
  });

  it('Can merge in a workspace that has failed', () => {
    const original: BillingProjectMigrationInfo[] = [bpWithInProgress];
    const updatedWorkspaceInfo: WorkspaceMigrationInfo = {
      failureReason:
        'The bucket migration failed while removing workspace bucket IAM: invalid billing account on billing project.',
      finalBucketTransferProgress: undefined,
      migrationStep: 'Finished',
      name: 'Christina test',
      namespace: 'general-dev-billing-account',
      outcome: 'failure',
      tempBucketTransferProgress: undefined,
    };
    const updated: BillingProjectMigrationInfo[] = [
      {
        namespace: 'general-dev-billing-account',
        workspaces: [updatedWorkspaceInfo],
      },
    ];
    expect(mergeBillingProjectMigrationInfo(original, updated)).toMatchObject(updated);
  });
});

describe('mergeWorkspacesWithNamespaces', () => {
  it('Can handle an empty update list', () => {
    const original = [{ name: 'name1', namespace: 'namespace1' }];
    expect(mergeWorkspacesWithNamespaces(original, [])).toEqual(original);
  });

  it('Can handle an empty update list with duplicates', () => {
    const original = [
      { name: 'name1', namespace: 'namespace1' },
      { name: 'name2', namespace: 'namespace2' },
    ];
    const updated = [
      { name: 'name3', namespace: 'namespace3' },
      { name: 'name2', namespace: 'namespace2' },
    ];

    const merged = mergeWorkspacesWithNamespaces(original, updated);
    const expected = [
      { name: 'name1', namespace: 'namespace1' },
      { name: 'name3', namespace: 'namespace3' },
      { name: 'name2', namespace: 'namespace2' },
    ];
    expect(_.sortBy('name', merged)).toEqual(_.sortBy('name', expected));
  });
});
