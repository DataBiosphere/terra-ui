import { resolveRunningCromwellAppUrl } from 'src/libs/workflows-app-utils';

describe('resolveRunningCromwellAppUrl', () => {
  const mockCbasUrl = 'https://abc.servicebus.windows.net/terra-app-3b8d9c55-7eee-49e9-a998-e8c6db05e374-79201ea6-519a-4077-a9a4-75b2a7c4cdeb/cbas';
  const mockCbasUiUrl = 'https://abc.servicebus.windows.net/terra-app-3b8d9c55-7eee-49e9-a998-e8c6db05e374-79201ea6-519a-4077-a9a4-75b2a7c4cdeb/';

  const mockCurrentUserEmail = 'abc@gmail.com';

  it.each([
    { appStatus: 'RUNNING', expectedUrl: { cbasUrl: mockCbasUrl, cbasUiUrl: mockCbasUiUrl } },
    { appStatus: 'PROVISIONING', expectedUrl: null },
    { appStatus: 'STOPPED', expectedUrl: null },
    { appStatus: 'STOPPING', expectedUrl: null },
    { appStatus: 'ERROR', expectedUrl: null },
  ])('returns correct value for Cromwell app in $appStatus from the Leo response', ({ appStatus, expectedUrl }) => {
    const mockAppsResponse = [
      {
        appType: 'CROMWELL',
        status: appStatus,
        proxyUrls: {
          cbas: mockCbasUrl,
          'cbas-ui': mockCbasUiUrl,
        },
        auditInfo: { creator: mockCurrentUserEmail },
      },
    ];
    expect(resolveRunningCromwellAppUrl(mockAppsResponse, mockCurrentUserEmail)).toEqual(expectedUrl);
  });

  it('return empty string for Cromwell app not created by current user in the workspace', () => {
    const mockApps = [
      {
        appType: 'CROMWELL',
        status: 'RUNNING',
        proxyUrls: {
          cbas: mockCbasUrl,
          'cbas-ui': mockCbasUiUrl,
        },
        auditInfo: { creator: 'not-abc@gmail.com' },
      },
    ];

    expect(resolveRunningCromwellAppUrl(mockApps, mockCurrentUserEmail)).toBe(null);
  });

  it('return empty string if there exists only WDS app in the workspace', () => {
    const mockApps = [
      {
        appType: 'WDS',
        status: 'RUNNING',
        proxyUrls: {
          wds: 'https://abc.servicebus.windows.net/wds-79201ea6-519a-4077-a9a4-75b2a7c4cdeb-79201ea6-519a-4077-a9a4-75b2a7c4cdeb/',
        },
        auditInfo: { creator: mockCurrentUserEmail },
      },
    ];

    expect(resolveRunningCromwellAppUrl(mockApps, mockCurrentUserEmail)).toBe(null);
  });

  it('return the urls from Cromwell app when both Cromwell and WDS app exist in workspace', () => {
    const mockApps = [
      {
        appType: 'CROMWELL',
        workspaceId: '79201ea6-519a-4077-a9a4-75b2a7c4cdeb',
        appName: 'terra-app-3b8d9c55-7eee-49e9-a998-e8c6db05e374',
        status: 'RUNNING',
        proxyUrls: { cbas: mockCbasUrl, 'cbas-ui': mockCbasUiUrl },
        auditInfo: {
          creator: mockCurrentUserEmail,
        },
      },
      {
        appType: 'WDS',
        workspaceId: '79201ea6-519a-4077-a9a4-75b2a7c4cdeb',
        appName: 'wds-79201ea6-519a-4077-a9a4-75b2a7c4cdeb',
        status: 'RUNNING',
        proxyUrls: {
          wds: 'https://abc.servicebus.windows.net/wds-79201ea6-519a-4077-a9a4-75b2a7c4cdeb-79201ea6-519a-4077-a9a4-75b2a7c4cdeb/',
        },
        auditInfo: {
          creator: mockCurrentUserEmail,
        },
      },
    ];

    expect(resolveRunningCromwellAppUrl(mockApps, mockCurrentUserEmail)).toEqual({
      cbasUrl: mockCbasUrl,
      cbasUiUrl: mockCbasUiUrl,
    });
  });
});
