import { act, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { WorkflowView } from 'src/pages/workspaces/workspace/workflows/WorkflowView';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

jest.mock('src/libs/ajax');
jest.mock('src/libs/nav', () => ({
  getCurrentUrl: jest.fn().mockReturnValue(new URL('https://app.terra.bio')),
  getLink: jest.fn(),
  goToPath: jest.fn(),
}));

jest.mock('src/libs/notifications', () => ({
  notify: jest.fn(),
}));

describe('Workflow View (GCP)', () => {
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
import { act } from '@testing-library/react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { WorkflowView } from 'src/pages/workspaces/workspace/workflows/WorkflowView';
import { renderWithAppContexts as render, SelectHelper } from 'src/testing/test-utils';

jest.mock('src/libs/ajax');

jest.mock('src/libs/nav', () => ({
  getCurrentUrl: jest.fn().mockReturnValue(new URL('https://app.terra.bio')),
  getLink: jest.fn(),
  goToPath: jest.fn(),
}));

jest.mock('src/libs/notifications', () => ({
  notify: jest.fn(),
}));

describe('Workflow View (GCP)', () => {
  const namespace = 'testNamespace';
  const name = 'testName';
  const ws = {
    name,
    namespace,
    cloudPlatform: 'Gcp',
  };
  const onDismiss = jest.fn();
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
      name: 'echo_to_file',
      createDate: '2019-11-21T19:10:23Z',
      url: 'http://agora.dsde-dev.broadinstitute.org/api/v1/methods/gatk/echo_to_file/12',
      synopsis: '',
      entityType: 'Workflow',
      snapshotComment: '',
      snapshotId: 12,
      namespace: 'gatk',
    },
  ];

  it('renders Workflow View page', async () => {
    // Arrange
    const user = userEvent.setup();
    const props = { namespace, name, ws, onDismiss };
    const selectionKey = 'foobar';
    const mockAgoraResponse = [
      {
        name: 'echo_to_file',
        createDate: '2019-11-21T19:10:23Z',
        url: 'http://agora.dsde-dev.broadinstitute.org/api/v1/methods/gatk/echo_to_file/12',
        synopsis: '',
        entityType: 'Workflow',
        snapshotComment: '',
        snapshotId: 12,
        namespace: 'gatk',
      },
    ];
    const mockEntityMetadata = {
      sra: {
        attributeNames: ['biosample_accession', 'output'],
        count: 6,
        idName: 'sra_id',
      },
      sra_set: {
        attributeNames: ['sras'],
        count: 1,
        idName: 'sra_set_id',
      },
    };
    // const payload = {
    //   name: 'sra',
    //   entityType: 'Workflow',
    //   attributes: {
    //     [`${selectedEntityType}s`]: {
    //       itemsType: 'EntityReference',
    //       items: _.map((entityName) => ({ entityName, entityType: selectedEntityType }), selectedEntityNames),
    //     },
    //   },
    // };

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
            entityMetadata: jest.fn().mockReturnValue(mockEntityMetadata),
            listSnapshots: jest.fn().mockResolvedValue({
              gcpDataRepoSnapshots: [],
            }),
            methodConfig: () => ({
              validate: jest.fn(),
              get: jest.fn().mockResolvedValue({
                methodRepoMethod: {
                  methodNamespace: 'gatk',
                  methodName: 'echo_to_file',
                  sourceRepo: 'agora',
                  methodPath: 'agora://gatk/echo_to_file/12',
                  methodVersion: 12,
                },
                rootEntityType: 'sra',
                name: 'echo_to_file-configured',
              }),
            }),
          }),
        },
      };
    });

    // Act
    await act(async () => {
      render(h(WorkflowView, { props, queryParams: { selectionKey } }));
    });

    const selectDataButton = screen.getAllByRole('button').filter((button) => button.textContent.includes('Select Data'))[0];
    expect(selectDataButton).toHaveTextContent('Select Data');
    expect(screen.getByText('sra')).toBeInTheDocument();
    // screen.debug(undefined, 300000);
    const dropdown = screen.getByLabelText('Entity type selector');
    const dropdownHelper = new SelectHelper(dropdown, user);
    // console.log(dropdownHelper.getSelectedOptions());
    await dropdownHelper.selectOption('sra');
    screen.debug(undefined, 300000);

    // console.log(selectDataButton);
    screen.logTestingPlaygroundURL();
  });
});
