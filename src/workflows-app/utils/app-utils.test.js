import { appStatuses } from 'src/libs/ajax/leonardo/models/app-models';
import { AppProxyUrlStatus, workflowsAppStore } from 'src/libs/state';
import { cloudProviderTypes } from 'src/libs/workspace-utils';
import { cromwellLinkProps, doesAppProxyUrlExist, resolveRunningCromwellAppUrl } from 'src/workflows-app/utils/app-utils';

describe('resolveRunningCromwellAppUrl', () => {
  const mockCbasUrl = 'https://abc.servicebus.windows.net/terra-app-3b8d9c55-7eee-49e9-a998-e8c6db05e374-79201ea6-519a-4077-a9a4-75b2a7c4cdeb/cbas';
  const mockCbasUiUrl = 'https://abc.servicebus.windows.net/terra-app-3b8d9c55-7eee-49e9-a998-e8c6db05e374-79201ea6-519a-4077-a9a4-75b2a7c4cdeb/';
  const mockCromwellUrl =
    'https://abc.servicebus.windows.net/terra-app-3b8d9c55-7eee-49e9-a998-e8c6db05e374-79201ea6-519a-4077-a9a4-75b2a7c4cdeb/cromwell';

  const mockCurrentUserEmail = 'abc@gmail.com';

  const appResponseCommonField = {
    workspaceId: '79201ea6-519a-4077-a9a4-75b2a7c4cdeb',
    appName: 'terra-app-3b8d9c55-7eee-49e9-a998-e8c6db05e374',
    cloudContext: {
      cloudProvider: cloudProviderTypes.AZURE,
      cloudResource: 'terra-test-e4000484',
    },
    kubernetesRuntimeConfig: { numNodes: 1, machineType: 'n1-highmem-8', autoscalingEnabled: false },
    errors: [],
    labels: { saturnWorkspaceName: 'test-workspace' },
  };

  it.each([
    { appStatus: appStatuses.running.status, expectedUrl: { cbasUrl: mockCbasUrl, cbasUiUrl: mockCbasUiUrl, cromwellUrl: mockCromwellUrl } },
    { appStatus: appStatuses.provisioning.status, expectedUrl: null },
    { appStatus: appStatuses.stopped.status, expectedUrl: null },
    { appStatus: appStatuses.stopping.status, expectedUrl: null },
    { appStatus: appStatuses.error.status, expectedUrl: null },
  ])('returns correct value for Cromwell app in $appStatus from the Leo response', ({ appStatus, expectedUrl }) => {
    const mockAppsResponse = [
      {
        ...appResponseCommonField,
        appType: 'CROMWELL',
        status: appStatus,
        proxyUrls: {
          cbas: mockCbasUrl,
          'cbas-ui': mockCbasUiUrl,
          cromwell: mockCromwellUrl,
        },
        auditInfo: {
          creator: mockCurrentUserEmail,
          createdDate: '2021-12-10T20:19:13.162484Z',
          dateAccessed: '2021-12-11T20:19:13.162484Z',
        },
      },
    ];
    expect(resolveRunningCromwellAppUrl(mockAppsResponse, mockCurrentUserEmail)).toEqual(expectedUrl);
  });

  it('returns null for Cromwell app not created by current user in the workspace', () => {
    const mockApps = [
      {
        ...appResponseCommonField,
        appType: 'CROMWELL',
        status: 'RUNNING',
        proxyUrls: {
          cbas: mockCbasUrl,
          'cbas-ui': mockCbasUiUrl,
          cromwell: mockCromwellUrl,
        },
        auditInfo: {
          creator: 'not-abc@gmail.com',
          createdDate: '2021-12-10T20:19:13.162484Z',
          dateAccessed: '2021-12-11T20:19:13.162484Z',
        },
      },
    ];

    expect(resolveRunningCromwellAppUrl(mockApps, mockCurrentUserEmail)).toBe(null);
  });

  it('returns null if there exists apps other than Cromwell in the workspace', () => {
    const mockApps = [
      {
        ...appResponseCommonField,
        appType: 'HAIL_BATCH',
        status: 'RUNNING',
        proxyUrls: {},
        auditInfo: {
          creator: mockCurrentUserEmail,
          createdDate: '2021-12-10T20:19:13.162484Z',
          dateAccessed: '2021-12-11T20:19:13.162484Z',
        },
      },
    ];

    expect(resolveRunningCromwellAppUrl(mockApps, mockCurrentUserEmail)).toBe(null);
  });
});

describe('doesAppProxyUrlExist', () => {
  const currentWorkspaceId = 'abc-123';
  const otherWorkspaceId = 'xyz-890';
  const mockCbasUrl = 'https://lz-abc/terra-app-abc/cbas';
  const mockCromwellUrl = 'https://lz-abc/terra-app-abc/cromwell';
  const mockWdsUrl = 'https://lz-abc/wds-abc-c07807929cd1/';

  it('returns true for CBAS app in Ready state for current workspace', () => {
    workflowsAppStore.set({
      workspaceId: currentWorkspaceId,
      cbasProxyUrlState: { status: AppProxyUrlStatus.Ready, state: mockCbasUrl },
    });

    expect(doesAppProxyUrlExist(currentWorkspaceId, 'cbasProxyUrlState')).toBe(true);
  });

  it('returns true for WDS app in Ready state for current workspace', () => {
    workflowsAppStore.set({
      workspaceId: currentWorkspaceId,
      wdsProxyUrlState: { status: AppProxyUrlStatus.Ready, state: mockWdsUrl },
    });

    expect(doesAppProxyUrlExist(currentWorkspaceId, 'wdsProxyUrlState')).toBe(true);
  });

  it('returns true for Cromwell app in Ready state for current workspace', () => {
    workflowsAppStore.set({
      workspaceId: currentWorkspaceId,
      cromwellProxyUrlState: { status: AppProxyUrlStatus.Ready, state: mockCromwellUrl },
    });

    expect(doesAppProxyUrlExist(currentWorkspaceId, 'cromwellProxyUrlState')).toBe(true);
  });

  it('returns false for CBAS app in None state for current workspace', () => {
    workflowsAppStore.set({
      workspaceId: currentWorkspaceId,
      cbasProxyUrlState: { status: AppProxyUrlStatus.None, state: '' },
    });

    expect(doesAppProxyUrlExist(currentWorkspaceId, 'cbasProxyUrlState')).toBe(false);
  });

  it('returns false for WDS app in Error state for current workspace', () => {
    workflowsAppStore.set({
      workspaceId: currentWorkspaceId,
      wdsProxyUrlState: { status: AppProxyUrlStatus.Error, state: '' },
    });

    expect(doesAppProxyUrlExist(currentWorkspaceId, 'wdsProxyUrlState')).toBe(false);
  });

  it('returns false for Cromwell app in None state for current workspace', () => {
    workflowsAppStore.set({
      workspaceId: currentWorkspaceId,
      cromwellProxyUrlState: { status: AppProxyUrlStatus.None, state: '' },
    });

    expect(doesAppProxyUrlExist(currentWorkspaceId, 'cromwellProxyUrlState')).toBe(false);
  });

  it('returns false for CBAS app in Ready state but in different workspace', () => {
    workflowsAppStore.set({
      workspaceId: otherWorkspaceId,
      cbasProxyUrlState: { status: AppProxyUrlStatus.Ready, state: mockCbasUrl },
    });

    expect(doesAppProxyUrlExist(currentWorkspaceId, 'cbasProxyUrlState')).toBe(false);
  });

  it('returns false for WDS app in Ready state but in different workspace', () => {
    workflowsAppStore.set({
      workspaceId: otherWorkspaceId,
      wdsProxyUrlState: { status: AppProxyUrlStatus.Ready, state: mockWdsUrl },
    });

    expect(doesAppProxyUrlExist(currentWorkspaceId, 'wdsProxyUrlState')).toBe(false);
  });

  it('returns true for Cromwell app in Ready state but in different workspace', () => {
    workflowsAppStore.set({
      workspaceId: otherWorkspaceId,
      cromwellProxyUrlState: { status: AppProxyUrlStatus.Ready, state: mockCromwellUrl },
    });

    expect(doesAppProxyUrlExist(currentWorkspaceId, 'cromwellProxyUrlState')).toBe(false);
  });
});

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getLink: jest.fn().mockImplementation((_, { namespace, name }) => `#workspaces/${namespace}/${name}/workflows-app`),
}));

describe('cromwellLinkProps', () => {
  const app = {
    proxyUrls: {
      'cbas-ui': 'http://cbas-ui.mock',
      'cromwell-service': 'http://cromwell-service.mock',
    },
  };
  const namespace = 'mock-namespace';
  const name = 'mock-workspace-name';

  it('props for Azure', () => {
    expect(
      cromwellLinkProps({
        cloudProvider: cloudProviderTypes.AZURE,
        namespace,
        name,
        app,
      })
    ).toEqual({
      href: `#workspaces/${namespace}/${name}/workflows-app`,
    });
  });

  it('props for GCP', () => {
    expect(cromwellLinkProps({ cloudProvider: cloudProviderTypes.GCP, namespace, name, app })).toEqual({
      href: 'http://cromwell-service.mock',
      rel: 'noopener',
      target: '_blank',
    });
  });
});
