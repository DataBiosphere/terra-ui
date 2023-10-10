import {
  BillingProjectMigrationInfo,
  getBillingProjectMigrationStats,
  parseServerResponse,
} from 'src/pages/workspaces/migration/migration-utils';

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

export const bpWithFailed = {
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

export const bpWithInProgress = {
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
