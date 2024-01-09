import { act, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { WorkflowView } from 'src/pages/workspaces/workspace/workflows/WorkflowView';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

jest.mock('src/libs/ajax');
jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn().mockImplementation((_) => _),
}));

describe('Workflow View', () => {
  it('view workflow in workspace from mock import', async () => {
    const selectionKey = 'foobar';

    const mockAgoraResponse = [
      {
        name: 'joint-discovery-gatk4',
        createDate: '2018-11-30T22:19:35Z',
        url: 'http://agora.dsde-dev.broadinstitute.org/api/v1/methods/gatk/joint-discovery-gatk4/1',
        synopsis: 'Implements the joint discovery and VQSR filtering',
        entityType: 'Workflow',
        snapshotComment: '',
        snapshotId: 1,
        namespace: 'gatk',
      },
    ];

    const initializedGoogleWorkspace = {
      accessLevel: 'OWNER',
      owners: ['bar@foo.com'],
      workspace: {
        attributes: {
          description: '',
        },
        authorizationDomain: [],
        billingAccount: 'billingAccounts/google-billing-account',
        bucketName: 'bucket-name',
        cloudPlatform: 'Gcp',
        completedCloneWorkspaceFileTransfer: '2023-02-03T22:29:04.319Z',
        createdBy: 'bar@foo.com',
        createdDate: '2023-02-03T22:26:06.124Z',
        googleProject: 'google-project-id',
        isLocked: false,
        lastModified: '2023-02-03T22:26:06.202Z',
        name: 'testName',
        namespace: 'gatk',
        workspaceId: 'google-workspace-id',
        workspaceType: 'rawls',
        workspaceVersion: 'v2',
      },
      canShare: true,
      canCompute: true,
      workspaceInitialized: true,
    };

    const mockStorageDetails = {
      fetchedLocation: 'SUCCESS',
    };

    const methodList = [
      {
        name: 'joint-discovery-gatk4',
        createDate: '2018-11-30T22:19:35Z',
        url: 'http://agora.dsde-dev.broadinstitute.org/api/v1/methods/gatk/joint-discovery-gatk4/1',
        synopsis: 'Implements the joint discovery and VQSR filtering',
        entityType: 'Workflow',
        snapshotComment: '',
        snapshotId: 1,
        namespace: 'gatk',
      },
    ];

    Ajax.mockImplementation(() => {
      return {
        Methods: {
          list: jest.fn(() => Promise.resolve(methodList)),
          method: {
            get: jest.fn(() => Promise.resolve(mockAgoraResponse)),
          },
        },
        Workspaces: {
          workspace: () => ({
            details: jest.fn().mockResolvedValue(initializedGoogleWorkspace),
            checkBucketReadAccess: jest.fn(),
            storageCostEstimate: jest.fn(),
            bucketUsage: jest.fn(),
            checkBucketLocation: jest.fn().mockResolvedValue(mockStorageDetails),
            entityMetadata: jest.fn().mockReturnValue({}),
            listSnapshots: jest.fn().mockResolvedValue({
              gcpDataRepoSnapshots: [],
            }),
            methodConfig: () => ({
              validate: jest.fn(),
              get: jest.fn().mockResolvedValue({
                methodRepoMethod: {
                  methodNamespace: 'gatk',
                  methodName: 'joint-discovery-gatk4',
                  sourceRepo: 'agora',
                  methodPath: 'agora://gatk/joint-discovery-gatk4/1',
                  methodVersion: 1,
                },
                rootEntityType: 'participant',
                name: 'joint-discovery-gatk4',
              }),
            }),
          }),
        },
      };
    });

    // Act
    await act(async () => {
      render(h(WorkflowView, { queryParams: { selectionKey } }));
    });

    expect(
      screen.getByRole('button', {
        name: /inputs/i,
      })
    );

    expect(screen.getByText('joint-discovery-gatk4'));
  });
});
