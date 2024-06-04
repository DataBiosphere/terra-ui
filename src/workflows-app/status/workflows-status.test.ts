import { abandonedPromise, DeepPartial } from '@terra-ui-packages/core-utils';
import { Ajax } from 'src/libs/ajax';
import { ListAppItem } from 'src/libs/ajax/leonardo/models/app-models';
import { asMockedFn, renderHookInAct } from 'src/testing/test-utils';
import { useWorkflowsStatus } from 'src/workflows-app/status/workflows-status';

type AjaxExports = typeof import('src/libs/ajax');
jest.mock('src/libs/ajax', (): Partial<AjaxExports> => {
  return { Ajax: jest.fn() };
});

type AjaxContract = ReturnType<typeof Ajax>;

const workspaceId = 'test-workspace-id';

const workflowsAppObject: ListAppItem = {
  workspaceId,
  cloudContext: {
    cloudProvider: 'AZURE',
    cloudResource: '(unused)',
  },
  kubernetesRuntimeConfig: {
    numNodes: 1,
    machineType: 'Standard_A2_v2',
    autoscalingEnabled: false,
  },
  errors: [],
  status: 'RUNNING',
  proxyUrls: {
    cbas: 'https://test-url/cbas-blah/',
    'cromwell-reader': 'https://test-url/cromwell-reader-blah/',
    listener: 'https://test-url/listener-blah/',
  },
  appName: 'wfa-blah',
  appType: 'WORKFLOWS_APP',
  diskName: null,
  auditInfo: {
    creator: 'user@example.com',
    createdDate: '2023-07-11T18:59:09.369822Z',
    destroyedDate: null,
    dateAccessed: '2023-07-11T18:59:09.369822Z',
  },
  accessScope: 'WORKSPACE_SHARED',
  labels: {},
  region: 'is-central1',
};

const cromwellRunnerAppObject: ListAppItem = {
  workspaceId,
  cloudContext: {
    cloudProvider: 'AZURE',
    cloudResource: '(unused)',
  },
  kubernetesRuntimeConfig: {
    numNodes: 1,
    machineType: 'Standard_A2_v2',
    autoscalingEnabled: false,
  },
  errors: [],
  status: 'RUNNING',
  proxyUrls: {
    'cromwell-runner': 'https://test-url/cromwell-runner-blah/',
    listener: 'https://test-url/listener-blah/',
  },
  appName: 'cra-blah',
  appType: 'CROMWELL_RUNNER_APP',
  diskName: null,
  auditInfo: {
    creator: 'user@example.com',
    createdDate: '2023-07-11T18:59:09.369822Z',
    destroyedDate: null,
    dateAccessed: '2023-07-11T18:59:09.369822Z',
  },
  accessScope: 'USER_PRIVATE',
  labels: {},
  region: 'is-central1',
};

const cbasStatusResponse = {
  ok: true,
  systems: {
    cromwell: {
      ok: true,
      messages: ['(unused)'],
    },
    ecm: {
      ok: true,
      messages: ['(unused)'],
    },
    sam: {
      ok: true,
      messages: ['(unused)'],
    },
    leonardo: {
      ok: true,
      messages: ['(unused)'],
    },
  },
};

const cromwellStatusResponse = { 'Engine Database': { ok: true } };

describe('useWorkflowsStatus', () => {
  it('fetches Leo apps', async () => {
    // Arrange
    const listAppsV2 = jest.fn().mockResolvedValue([]);
    const mockAjax: DeepPartial<AjaxContract> = {
      Apps: {
        listAppsV2,
      },
    };
    asMockedFn(Ajax).mockReturnValue(mockAjax as AjaxContract);

    // Act
    await renderHookInAct(() => useWorkflowsStatus({ workspaceId }));

    // Assert
    expect(listAppsV2).toHaveBeenCalledWith(workspaceId);
  });

  describe('if fetching Leo apps fails', () => {
    it('returns unknown for all fields', async () => {
      // Arrange
      const mockAjax: DeepPartial<AjaxContract> = {
        Apps: {
          listAppsV2: jest.fn().mockRejectedValue(new Error('Something went wrong')),
        },
      };
      asMockedFn(Ajax).mockReturnValue(mockAjax as AjaxContract);

      // Act
      const { result: hookReturnRef } = await renderHookInAct(() => useWorkflowsStatus({ workspaceId }));

      // Assert
      expect(hookReturnRef.current.status).toEqual({
        totalVisibleApps: 'unknown',
        workflowsAppName: 'unknown',
        workflowsAppStatus: 'unknown',
        cromwellRunnerAppName: 'unknown',
        cromwellRunnerAppStatus: 'unknown',
        cbasProxyUrl: 'unknown',
        cromwellReaderProxyUrl: 'unknown',
        cromwellRunnerProxyUrl: 'unknown',
        cbasResponsive: 'unknown',
        cbasCromwellConnection: 'unknown',
        cbasEcmConnection: 'unknown',
        cbasSamConnection: 'unknown',
        cbasLeonardoConnection: 'unknown',
        cromwellReaderResponsive: 'unknown',
        cromwellReaderDatabaseConnection: 'unknown',
        cromwellRunnerResponsive: 'unknown',
        cromwellRunnerDatabaseConnection: 'unknown',
      });
    });
  });

  describe('if Leo apps are fetched successfully', () => {
    describe('if no apps are present', () => {
      it('returns number of apps and unknown for other fields', async () => {
        // Arrange
        const mockAjax: DeepPartial<AjaxContract> = {
          Apps: {
            listAppsV2: jest.fn().mockResolvedValue([]),
          },
        };
        asMockedFn(Ajax).mockReturnValue(mockAjax as AjaxContract);

        // Act
        const { result: hookReturnRef } = await renderHookInAct(() => useWorkflowsStatus({ workspaceId }));

        // Assert
        expect(hookReturnRef.current.status).toEqual({
          totalVisibleApps: '0',
          workflowsAppName: 'unknown',
          workflowsAppStatus: 'unknown',
          cromwellRunnerAppName: 'unknown',
          cromwellRunnerAppStatus: 'unknown',
          cbasProxyUrl: 'unknown',
          cromwellReaderProxyUrl: 'unknown',
          cromwellRunnerProxyUrl: 'unknown',
          cbasResponsive: 'unknown',
          cbasCromwellConnection: 'unknown',
          cbasEcmConnection: 'unknown',
          cbasSamConnection: 'unknown',
          cbasLeonardoConnection: 'unknown',
          cromwellReaderResponsive: 'unknown',
          cromwellReaderDatabaseConnection: 'unknown',
          cromwellRunnerResponsive: 'unknown',
          cromwellRunnerDatabaseConnection: 'unknown',
        });
      });
    });
  });

  describe('if workflows app is present', () => {
    it('uses Leo app response to fill in fields while waiting for service status', async () => {
      // Arrange
      const mockAjax: DeepPartial<AjaxContract> = {
        Apps: {
          listAppsV2: jest.fn().mockResolvedValue([workflowsAppObject]),
        },
        Cbas: {
          status: jest.fn().mockReturnValue(abandonedPromise()),
        },
        CromwellApp: {
          engineStatus: jest.fn().mockReturnValue(abandonedPromise()),
        },
      };
      asMockedFn(Ajax).mockReturnValue(mockAjax as AjaxContract);

      // Act
      const { result: hookReturnRef } = await renderHookInAct(() => useWorkflowsStatus({ workspaceId }));

      // Assert
      // Note: remember 'null' means pending and 'unknown' means failed.
      expect(hookReturnRef.current.status).toEqual({
        totalVisibleApps: '1',
        workflowsAppName: 'wfa-blah',
        workflowsAppStatus: 'RUNNING',
        cromwellRunnerAppName: 'unknown',
        cromwellRunnerAppStatus: 'unknown',
        cbasProxyUrl: 'https://test-url/cbas-blah/',
        cromwellReaderProxyUrl: 'https://test-url/cromwell-reader-blah/',
        cromwellRunnerProxyUrl: 'unknown',
        cbasResponsive: null,
        cbasCromwellConnection: null,
        cbasEcmConnection: null,
        cbasSamConnection: null,
        cbasLeonardoConnection: null,
        cromwellReaderResponsive: null,
        cromwellReaderDatabaseConnection: null,
        cromwellRunnerResponsive: 'unknown',
        cromwellRunnerDatabaseConnection: 'unknown',
      });
      expect(mockAjax.Cbas.status).toHaveBeenCalledWith(workflowsAppObject.proxyUrls.cbas);
      expect(mockAjax.CromwellApp.engineStatus).toHaveBeenCalledWith(workflowsAppObject.proxyUrls['cromwell-reader']);
    });

    it('uses CBAS and Cromwell status endpoints', async () => {
      // Arrange
      const mockAjax: DeepPartial<AjaxContract> = {
        Apps: {
          listAppsV2: jest.fn().mockResolvedValue([workflowsAppObject]),
        },
        Cbas: {
          status: jest.fn().mockResolvedValue(cbasStatusResponse),
        },
        CromwellApp: {
          engineStatus: jest.fn().mockResolvedValue(cromwellStatusResponse),
        },
      };
      asMockedFn(Ajax).mockReturnValue(mockAjax as AjaxContract);

      // Act
      const { result: hookReturnRef } = await renderHookInAct(() => useWorkflowsStatus({ workspaceId }));

      // Assert
      // Note: remember 'null' means pending and 'unknown' means failed.
      expect(hookReturnRef.current.status).toEqual({
        totalVisibleApps: '1',
        workflowsAppName: 'wfa-blah',
        workflowsAppStatus: 'RUNNING',
        cromwellRunnerAppName: 'unknown',
        cromwellRunnerAppStatus: 'unknown',
        cbasProxyUrl: 'https://test-url/cbas-blah/',
        cromwellReaderProxyUrl: 'https://test-url/cromwell-reader-blah/',
        cromwellRunnerProxyUrl: 'unknown',
        cbasResponsive: 'true',
        cbasCromwellConnection: 'true',
        cbasEcmConnection: 'true',
        cbasSamConnection: 'true',
        cbasLeonardoConnection: 'true',
        cromwellReaderResponsive: 'true',
        cromwellReaderDatabaseConnection: 'true',
        cromwellRunnerResponsive: 'unknown',
        cromwellRunnerDatabaseConnection: 'unknown',
      });
    });
  });

  describe('if CROMWELL_RUNNER_APP is present', () => {
    it('uses Leo app response to fill in fields while waiting for service status', async () => {
      // Arrange
      const mockAjax: DeepPartial<AjaxContract> = {
        Apps: {
          listAppsV2: jest.fn().mockResolvedValue([cromwellRunnerAppObject]),
        },
        CromwellApp: {
          engineStatus: jest.fn().mockReturnValue(abandonedPromise()),
        },
      };
      asMockedFn(Ajax).mockReturnValue(mockAjax as AjaxContract);

      // Act
      const { result: hookReturnRef } = await renderHookInAct(() => useWorkflowsStatus({ workspaceId }));

      // Assert
      // Note: remember 'null' means pending and 'unknown' means failed.
      expect(hookReturnRef.current.status).toEqual({
        totalVisibleApps: '1',
        workflowsAppName: 'unknown',
        workflowsAppStatus: 'unknown',
        cromwellRunnerAppName: 'cra-blah',
        cromwellRunnerAppStatus: 'RUNNING',
        cbasProxyUrl: 'unknown',
        cromwellReaderProxyUrl: 'unknown',
        cromwellRunnerProxyUrl: 'https://test-url/cromwell-runner-blah/',
        cbasResponsive: 'unknown',
        cbasCromwellConnection: 'unknown',
        cbasEcmConnection: 'unknown',
        cbasSamConnection: 'unknown',
        cbasLeonardoConnection: 'unknown',
        cromwellReaderResponsive: 'unknown',
        cromwellReaderDatabaseConnection: 'unknown',
        cromwellRunnerResponsive: null,
        cromwellRunnerDatabaseConnection: null,
      });
      expect(mockAjax.CromwellApp.engineStatus).toHaveBeenCalledWith(
        cromwellRunnerAppObject.proxyUrls['cromwell-runner']
      );
    });

    it('fetches values from Cromwell status endpoint', async () => {
      // Arrange
      const mockAjax: DeepPartial<AjaxContract> = {
        Apps: {
          listAppsV2: jest.fn().mockResolvedValue([cromwellRunnerAppObject]),
        },
        CromwellApp: {
          engineStatus: jest.fn().mockResolvedValue(cromwellStatusResponse),
        },
      };
      asMockedFn(Ajax).mockReturnValue(mockAjax as AjaxContract);

      // Act
      const { result: hookReturnRef } = await renderHookInAct(() => useWorkflowsStatus({ workspaceId }));

      // Assert
      // Note: remember 'null' means pending and 'unknown' means failed.
      expect(hookReturnRef.current.status).toEqual({
        totalVisibleApps: '1',
        workflowsAppName: 'unknown',
        workflowsAppStatus: 'unknown',
        cromwellRunnerAppName: 'cra-blah',
        cromwellRunnerAppStatus: 'RUNNING',
        cbasProxyUrl: 'unknown',
        cromwellReaderProxyUrl: 'unknown',
        cromwellRunnerProxyUrl: 'https://test-url/cromwell-runner-blah/',
        cbasResponsive: 'unknown',
        cbasCromwellConnection: 'unknown',
        cbasEcmConnection: 'unknown',
        cbasSamConnection: 'unknown',
        cbasLeonardoConnection: 'unknown',
        cromwellReaderResponsive: 'unknown',
        cromwellReaderDatabaseConnection: 'unknown',
        cromwellRunnerResponsive: 'true',
        cromwellRunnerDatabaseConnection: 'true',
      });
    });
  });

  describe('if both apps are present', () => {
    it('fetches values from CBAS and both Cromwell status endpoints', async () => {
      // Arrange
      const mockAjax: DeepPartial<AjaxContract> = {
        Apps: {
          listAppsV2: jest.fn().mockResolvedValue([workflowsAppObject, cromwellRunnerAppObject]),
        },
        Cbas: {
          status: jest.fn().mockResolvedValue(cbasStatusResponse),
        },
        CromwellApp: {
          engineStatus: jest.fn().mockResolvedValue(cromwellStatusResponse),
        },
      };
      asMockedFn(Ajax).mockReturnValue(mockAjax as AjaxContract);

      // Act
      const { result: hookReturnRef } = await renderHookInAct(() => useWorkflowsStatus({ workspaceId }));

      // Assert
      // Note: remember 'null' means pending and 'unknown' means failed.
      expect(hookReturnRef.current.status).toEqual({
        totalVisibleApps: '2',
        workflowsAppName: 'wfa-blah',
        workflowsAppStatus: 'RUNNING',
        cromwellRunnerAppName: 'cra-blah',
        cromwellRunnerAppStatus: 'RUNNING',
        cbasProxyUrl: 'https://test-url/cbas-blah/',
        cromwellReaderProxyUrl: 'https://test-url/cromwell-reader-blah/',
        cromwellRunnerProxyUrl: 'https://test-url/cromwell-runner-blah/',
        cbasResponsive: 'true',
        cbasCromwellConnection: 'true',
        cbasEcmConnection: 'true',
        cbasSamConnection: 'true',
        cbasLeonardoConnection: 'true',
        cromwellReaderResponsive: 'true',
        cromwellReaderDatabaseConnection: 'true',
        cromwellRunnerResponsive: 'true',
        cromwellRunnerDatabaseConnection: 'true',
      });
    });
  });
});
