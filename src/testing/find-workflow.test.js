import { act, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { LandingPage } from 'src/pages/LandingPage';
import { Code } from 'src/pages/library/Code';
import { Showcase } from 'src/pages/library/Showcase';
import { WorkflowView } from 'src/pages/workspaces/workspace/workflows/WorkflowView';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

jest.mock('src/libs/ajax');
jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getCurrentUrl: jest.fn().mockReturnValue(new URL('https://app.terra.bio')),
  getLink: jest.fn().mockImplementation((_) => _),
  goToPath: jest.fn(),
  useRoute: jest.fn().mockImplementation(() => ({ query: {} })),
}));
jest.mock('src/libs/notifications', () => ({
  notify: jest.fn(),
}));
jest.mock('src/libs/state', () => ({
  ...jest.requireActual('src/libs/state'),
  getTerraUser: jest.fn(() => ({ email: 'christina@foo.com' })),
}));

describe('Find a Workflow', () => {
  it('loads the landing page', async () => {
    // Act
    await act(async () => {
      render(h(LandingPage, {}));
    });
    const viewExamplesButton = screen.getByRole('link', {
      name: 'View Examples Browse our gallery of showcase Workspaces to see how science gets done.',
    });
    expect(viewExamplesButton).toHaveAttribute('href', 'library-showcase');
  });

  it('loads the showcase page', async () => {
    // Act
    await act(async () => {
      render(h(Showcase, {}));
    });
    const codeAndWorkflows = await screen.getByRole('link', { name: 'code & workflows' });
    expect(codeAndWorkflows).toHaveAttribute('href', 'library-code');
  });

  it('loads the code page', async () => {
    const token = 'testtoken';
    const newToken = 'newtesttoken';

    const methodsList = [
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

    const featuredMethodsList = [
      {
        namespace: 'gatk',
        name: 'joint-discovery-gatk4',
      },
    ];

    const mockOidcUser = {
      id_token: undefined,
      session_state: null,
      access_token: token,
      refresh_token: '',
      token_type: '',
      scope: undefined,
      profile: {
        sub: '',
        iss: '',
        aud: '',
        exp: 0,
        iat: 0,
      },
      expires_at: undefined,
      state: undefined,
      expires_in: 0,
      expired: undefined,
      scopes: [],
      toStorageString: '',
    };

    Ajax.mockImplementation(() => {
      mockOidcUser.access_token = newToken;
      return Promise.resolve({
        status: 'success',
        oidcUser: mockOidcUser,
      });
    });

    Ajax.mockImplementation(() => {
      return {
        FirecloudBucket: {
          getFeaturedMethods: jest.fn(() => Promise.resolve(featuredMethodsList)),
        },
        Methods: {
          list: jest.fn(() => Promise.resolve(methodsList)),
        },
        Dockstore: {
          listTools: jest.fn(),
        },
      };
    });

    // Act
    await act(async () => {
      render(h(Code, {}));
    });
    const codeAndWorkflows = await screen.getByRole('link', { name: 'code & workflows' });
    expect(codeAndWorkflows).toHaveAttribute('href', 'library-code');

    const workflowName = await screen.getByRole('link', { name: 'joint-discovery-gatk4 Implements the joint discovery and VQSR filtering' });
    expect(workflowName.getAttribute('href')).toContain('?return=terra#methods/gatk/joint-discovery-gatk4/');
  });

  it('imports successfully', async () => {
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
