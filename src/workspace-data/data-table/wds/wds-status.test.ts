import { DeepPartial } from '@terra-ui-packages/core-utils';
import { Ajax } from 'src/libs/ajax';
import { ListAppResponse } from 'src/libs/ajax/leonardo/models/app-models';
import { WDSCloneStatusResponse } from 'src/libs/ajax/WorkspaceDataService';
import { abandonedPromise } from 'src/libs/utils';
import { asMockedFn, renderHookInAct } from 'src/testing/test-utils';

import { useWdsStatus } from './wds-status';

type AjaxExports = typeof import('src/libs/ajax');
jest.mock('src/libs/ajax', (): Partial<AjaxExports> => {
  return { Ajax: jest.fn() };
});

type AjaxContract = ReturnType<typeof Ajax>;

describe('useWdsStatus', () => {
  const workspaceId = '6601fdbb-4b53-41da-87b2-81385f4a760e';

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
    await renderHookInAct(() => useWdsStatus({ workspaceId }));

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
      const { result: hookReturnRef } = await renderHookInAct(() => useWdsStatus({ workspaceId }));

      // Assert
      expect(hookReturnRef.current.status).toEqual({
        numApps: 'unknown',
        appName: 'unknown',
        appStatus: 'unknown',
        proxyUrl: 'unknown',
        wdsResponsive: 'unknown',
        version: 'unknown',
        chartVersion: 'unknown',
        image: 'unknown',
        wdsStatus: 'unresponsive',
        wdsDbStatus: 'unknown',
        wdsPingStatus: 'unknown',
        wdsIamStatus: 'unknown',
        defaultInstanceExists: 'unknown',
        cloneSourceWorkspaceId: 'unknown',
        cloneStatus: 'unknown',
        cloneErrorMessage: 'unknown',
      });
    });
  });

  describe('if Leo apps are fetched successfully', () => {
    describe('if no WDS app is present', () => {
      it('returns number of apps and unknown for other fields', async () => {
        // Arrange
        const mockAjax: DeepPartial<AjaxContract> = {
          Apps: {
            listAppsV2: jest.fn().mockResolvedValue([]),
          },
        };
        asMockedFn(Ajax).mockReturnValue(mockAjax as AjaxContract);

        // Act
        const { result: hookReturnRef } = await renderHookInAct(() => useWdsStatus({ workspaceId }));

        // Assert
        expect(hookReturnRef.current.status).toEqual({
          numApps: '0',
          appName: 'unknown',
          appStatus: 'unknown',
          proxyUrl: 'unknown',
          wdsResponsive: 'unknown',
          version: 'unknown',
          chartVersion: 'unknown',
          image: 'unknown',
          wdsStatus: 'unresponsive',
          wdsDbStatus: 'unknown',
          wdsPingStatus: 'unknown',
          wdsIamStatus: 'unknown',
          defaultInstanceExists: 'unknown',
          cloneSourceWorkspaceId: 'unknown',
          cloneStatus: 'unknown',
          cloneErrorMessage: 'unknown',
        });
      });
    });
  });

  describe('if WDS app is present', () => {
    const wdsApp: ListAppResponse = {
      workspaceId: '6601fdbb-4b53-41da-87b2-81385f4a760e',
      cloudContext: {
        cloudProvider: 'AZURE',
        cloudResource:
          '0cb7a640-45a2-4ed6-be9f-63519f86e04b/ffd1069e-e34f-4d87-a8b8-44abfcba39af/mrg-terra-dev-previ-20230623095104',
      },
      kubernetesRuntimeConfig: {
        numNodes: 1,
        machineType: 'Standard_A2_v2',
        autoscalingEnabled: false,
      },
      errors: [],
      status: 'RUNNING',
      proxyUrls: {
        wds: 'https://lz34dd00bf3fdaa72f755eeea8f928bab7cd135043043d59d5.servicebus.windows.net/wds-6601fdbb-4b53-41da-87b2-81385f4a760e-6601fdbb-4b53-41da-87b2-81385f4a760e/',
      },
      appName: 'wds-6601fdbb-4b53-41da-87b2-81385f4a760e',
      appType: 'WDS',
      diskName: null,
      auditInfo: {
        creator: 'userWexample.com',
        createdDate: '2023-07-11T18:59:09.369822Z',
        destroyedDate: null,
        dateAccessed: '2023-07-11T18:59:09.369822Z',
      },
      accessScope: 'WORKSPACE_SHARED',
      labels: {},
    };

    it('updates status with app name and status', async () => {
      // Arrange
      const mockAjax: DeepPartial<AjaxContract> = {
        Apps: {
          listAppsV2: jest.fn().mockResolvedValue([wdsApp]),
        },
        WorkspaceData: {
          getVersion: jest.fn().mockReturnValue(abandonedPromise()),
          getStatus: jest.fn().mockReturnValue(abandonedPromise()),
          listInstances: jest.fn().mockReturnValue(abandonedPromise()),
          getCloneStatus: jest.fn().mockReturnValue(abandonedPromise()),
        },
      };
      asMockedFn(Ajax).mockReturnValue(mockAjax as AjaxContract);

      // Act
      const { result: hookReturnRef } = await renderHookInAct(() => useWdsStatus({ workspaceId }));

      // Assert
      expect(hookReturnRef.current.status).toEqual({
        numApps: '1',
        appName: 'wds-6601fdbb-4b53-41da-87b2-81385f4a760e',
        appStatus: 'RUNNING',
        proxyUrl:
          'https://lz34dd00bf3fdaa72f755eeea8f928bab7cd135043043d59d5.servicebus.windows.net/wds-6601fdbb-4b53-41da-87b2-81385f4a760e-6601fdbb-4b53-41da-87b2-81385f4a760e/',
        wdsResponsive: null,
        version: null,
        chartVersion: null,
        image: null,
        wdsStatus: null,
        wdsDbStatus: null,
        wdsPingStatus: null,
        wdsIamStatus: null,
        defaultInstanceExists: null,
        cloneSourceWorkspaceId: null,
        cloneStatus: null,
        cloneErrorMessage: null,
      });
    });

    it('requests WDS app version, status, instances, and clone status if app is running', async () => {
      // Arrange
      const getVersion = jest.fn().mockReturnValue(abandonedPromise());
      const getStatus = jest.fn().mockReturnValue(abandonedPromise());
      const listInstances = jest.fn().mockReturnValue(abandonedPromise());
      const getCloneStatus = jest.fn().mockReturnValue(abandonedPromise());

      const mockAjax: DeepPartial<AjaxContract> = {
        Apps: {
          listAppsV2: jest.fn().mockResolvedValue([wdsApp]),
        },
        WorkspaceData: {
          getVersion,
          getStatus,
          listInstances,
          getCloneStatus,
        },
      };
      asMockedFn(Ajax).mockReturnValue(mockAjax as AjaxContract);

      // Act
      await renderHookInAct(() => useWdsStatus({ workspaceId }));

      // Assert
      expect(getVersion).toHaveBeenCalledWith(wdsApp.proxyUrls.wds);
      expect(getStatus).toHaveBeenCalledWith(wdsApp.proxyUrls.wds);
      expect(listInstances).toHaveBeenCalledWith(wdsApp.proxyUrls.wds);
      expect(getCloneStatus).toHaveBeenCalledWith(wdsApp.proxyUrls.wds);
    });

    it('does not request WDS app version, status, instances, and clone status if app is not running', async () => {
      // Arrange
      const getVersion = jest.fn().mockReturnValue(abandonedPromise());
      const getStatus = jest.fn().mockReturnValue(abandonedPromise());
      const listInstances = jest.fn().mockReturnValue(abandonedPromise());
      const getCloneStatus = jest.fn().mockReturnValue(abandonedPromise());

      const mockAjax: DeepPartial<AjaxContract> = {
        Apps: {
          listAppsV2: jest.fn().mockResolvedValue([{ ...wdsApp, status: 'ERROR' }]),
        },
        WorkspaceData: {
          getVersion,
          getStatus,
          listInstances,
          getCloneStatus,
        },
      };
      asMockedFn(Ajax).mockReturnValue(mockAjax as AjaxContract);

      // Act
      const { result: hookReturnRef } = await renderHookInAct(() => useWdsStatus({ workspaceId }));

      // Assert
      expect(getVersion).not.toHaveBeenCalled();
      expect(getStatus).not.toHaveBeenCalled();
      expect(listInstances).not.toHaveBeenCalled();
      expect(getCloneStatus).not.toHaveBeenCalled();

      expect(hookReturnRef.current.status).toEqual({
        appName: 'wds-6601fdbb-4b53-41da-87b2-81385f4a760e',
        appStatus: 'ERROR',
        chartVersion: 'unknown',
        defaultInstanceExists: 'unknown',
        image: 'unknown',
        numApps: '1',
        proxyUrl:
          'https://lz34dd00bf3fdaa72f755eeea8f928bab7cd135043043d59d5.servicebus.windows.net/wds-6601fdbb-4b53-41da-87b2-81385f4a760e-6601fdbb-4b53-41da-87b2-81385f4a760e/',
        version: 'unknown',
        wdsDbStatus: 'unknown',
        wdsIamStatus: 'unknown',
        wdsPingStatus: 'unknown',
        wdsResponsive: 'unknown',
        wdsStatus: 'unresponsive',
        cloneSourceWorkspaceId: null,
        cloneStatus: null,
        cloneErrorMessage: null,
      });
    });

    describe('version request', () => {
      describe('if version request fails', () => {
        it('updates status with unknown for version fields', async () => {
          const mockAjax: DeepPartial<AjaxContract> = {
            Apps: {
              listAppsV2: jest.fn().mockResolvedValue([wdsApp]),
            },
            WorkspaceData: {
              getVersion: jest.fn().mockRejectedValue(new Error('Something went wrong')),
              getStatus: jest.fn().mockReturnValue(abandonedPromise()),
              listInstances: jest.fn().mockReturnValue(abandonedPromise()),
              getCloneStatus: jest.fn().mockReturnValue(abandonedPromise()),
            },
          };
          asMockedFn(Ajax).mockReturnValue(mockAjax as AjaxContract);

          // Act
          const { result: renderHookRef } = await renderHookInAct(() => useWdsStatus({ workspaceId }));

          // Assert
          expect(renderHookRef.current.status).toEqual(
            expect.objectContaining({
              wdsResponsive: 'false',
              version: 'unknown',
              chartVersion: 'unknown',
              image: 'unknown',
            })
          );
        });
      });

      describe('if version request succeeds', () => {
        it('updates status with git revision', async () => {
          const mockVersion = {
            app: {
              'chart-version': 'wds-0.24.0',
              image: 'us.gcr.io/broad-dsp-gcr-public/terra-workspace-data-service:eaf3f31',
            },
            git: { branch: 'main', commit: { id: 'c87286c', time: '2023-06-29T17:06:07Z' } },
            build: {
              artifact: 'service',
              name: 'service',
              time: '2023-06-29T21:19:57.307Z',
              version: '0.2.92-SNAPSHOT',
              group: 'org.databiosphere',
            },
          };
          const mockAjax: DeepPartial<AjaxContract> = {
            Apps: {
              listAppsV2: jest.fn().mockResolvedValue([wdsApp]),
            },
            WorkspaceData: {
              getVersion: jest.fn().mockResolvedValue(mockVersion),
              getStatus: jest.fn().mockReturnValue(abandonedPromise()),
              listInstances: jest.fn().mockReturnValue(abandonedPromise()),
              getCloneStatus: jest.fn().mockReturnValue(abandonedPromise()),
            },
          };
          asMockedFn(Ajax).mockReturnValue(mockAjax as AjaxContract);

          // Act
          const { result: renderHookRef } = await renderHookInAct(() => useWdsStatus({ workspaceId }));

          // Assert
          expect(renderHookRef.current.status).toEqual(
            expect.objectContaining({
              wdsResponsive: 'true',
              version: 'c87286c',
              chartVersion: 'wds-0.24.0',
              image: 'us.gcr.io/broad-dsp-gcr-public/terra-workspace-data-service:eaf3f31',
            })
          );
        });

        it('handles version response without app', async () => {
          const mockVersion = {
            git: { branch: 'main', commit: { id: 'c87286c', time: '2023-06-29T17:06:07Z' } },
            build: {
              artifact: 'service',
              name: 'service',
              time: '2023-06-29T21:19:57.307Z',
              version: '0.2.92-SNAPSHOT',
              group: 'org.databiosphere',
            },
          };
          const mockAjax: DeepPartial<AjaxContract> = {
            Apps: {
              listAppsV2: jest.fn().mockResolvedValue([wdsApp]),
            },
            WorkspaceData: {
              getVersion: jest.fn().mockResolvedValue(mockVersion),
              getStatus: jest.fn().mockReturnValue(abandonedPromise()),
              listInstances: jest.fn().mockReturnValue(abandonedPromise()),
              getCloneStatus: jest.fn().mockReturnValue(abandonedPromise()),
            },
          };
          asMockedFn(Ajax).mockReturnValue(mockAjax as AjaxContract);

          // Act
          const { result: renderHookRef } = await renderHookInAct(() => useWdsStatus({ workspaceId }));

          // Assert
          expect(renderHookRef.current.status).toEqual(
            expect.objectContaining({
              wdsResponsive: 'true',
              version: 'c87286c',
              chartVersion: 'unknown',
              image: 'unknown',
            })
          );
        });
      });
    });

    describe('status request', () => {
      describe('if status request fails', () => {
        it('updates status with unknown for status fields', async () => {
          const mockAjax: DeepPartial<AjaxContract> = {
            Apps: {
              listAppsV2: jest.fn().mockResolvedValue([wdsApp]),
            },
            WorkspaceData: {
              getVersion: jest.fn().mockReturnValue(abandonedPromise()),
              getStatus: jest.fn().mockRejectedValue(new Error('Something went wrong')),
              listInstances: jest.fn().mockReturnValue(abandonedPromise()),
              getCloneStatus: jest.fn().mockReturnValue(abandonedPromise()),
            },
          };
          asMockedFn(Ajax).mockReturnValue(mockAjax as AjaxContract);

          // Act
          const { result: renderHookRef } = await renderHookInAct(() => useWdsStatus({ workspaceId }));

          // Assert
          expect(renderHookRef.current.status).toEqual(
            expect.objectContaining({
              wdsStatus: 'unresponsive',
              wdsDbStatus: 'unknown',
              wdsPingStatus: 'unknown',
              wdsIamStatus: 'unknown',
            })
          );
        });
      });

      describe('if status request succeeds', () => {
        it('updates status with WDS status', async () => {
          const mockStatus = {
            status: 'UP',
            components: {
              Permissions: { status: 'UP', details: { samOK: true } },
              db: {
                status: 'UP',
                components: {
                  mainDb: { status: 'UP', details: { database: 'PostgreSQL', validationQuery: 'isValid()' } },
                  streamingDs: { status: 'UP', details: { database: 'PostgreSQL', validationQuery: 'isValid()' } },
                },
              },
              diskSpace: {
                status: 'UP',
                details: { total: 133003395072, free: 108678414336, threshold: 10485760, exists: true },
              },
              livenessState: { status: 'UP' },
              ping: { status: 'UP' },
              readinessState: { status: 'UP' },
            },
            groups: ['liveness', 'readiness'],
          };
          const mockAjax: DeepPartial<AjaxContract> = {
            Apps: {
              listAppsV2: jest.fn().mockResolvedValue([wdsApp]),
            },
            WorkspaceData: {
              getVersion: jest.fn().mockReturnValue(abandonedPromise()),
              getStatus: jest.fn().mockResolvedValue(mockStatus),
              listInstances: jest.fn().mockReturnValue(abandonedPromise()),
              getCloneStatus: jest.fn().mockReturnValue(abandonedPromise()),
            },
          };
          asMockedFn(Ajax).mockReturnValue(mockAjax as AjaxContract);

          // Act
          const { result: renderHookRef } = await renderHookInAct(() => useWdsStatus({ workspaceId }));

          // Assert
          expect(renderHookRef.current.status).toEqual(
            expect.objectContaining({
              wdsStatus: 'UP',
              wdsDbStatus: 'UP',
              wdsPingStatus: 'UP',
              wdsIamStatus: 'UP',
            })
          );
        });

        it('handles status response without permissions', async () => {
          const mockStatus = {
            status: 'UP',
            components: {
              db: {
                status: 'UP',
                components: {
                  mainDb: { status: 'UP', details: { database: 'PostgreSQL', validationQuery: 'isValid()' } },
                  streamingDs: { status: 'UP', details: { database: 'PostgreSQL', validationQuery: 'isValid()' } },
                },
              },
              diskSpace: {
                status: 'UP',
                details: { total: 133003395072, free: 108678414336, threshold: 10485760, exists: true },
              },
              livenessState: { status: 'UP' },
              ping: { status: 'UP' },
              readinessState: { status: 'UP' },
            },
            groups: ['liveness', 'readiness'],
          };
          const mockAjax: DeepPartial<AjaxContract> = {
            Apps: {
              listAppsV2: jest.fn().mockResolvedValue([wdsApp]),
            },
            WorkspaceData: {
              getVersion: jest.fn().mockReturnValue(abandonedPromise()),
              getStatus: jest.fn().mockResolvedValue(mockStatus),
              listInstances: jest.fn().mockReturnValue(abandonedPromise()),
              getCloneStatus: jest.fn().mockReturnValue(abandonedPromise()),
            },
          };
          asMockedFn(Ajax).mockReturnValue(mockAjax as AjaxContract);

          // Act
          const { result: renderHookRef } = await renderHookInAct(() => useWdsStatus({ workspaceId }));

          // Assert
          expect(renderHookRef.current.status).toEqual(
            expect.objectContaining({
              wdsStatus: 'UP',
              wdsDbStatus: 'UP',
              wdsPingStatus: 'UP',
              wdsIamStatus: 'disabled',
            })
          );
        });
      });
    });

    describe('instances request', () => {
      describe('if instances request fails', () => {
        it('updates status with unknown for instances', async () => {
          const mockAjax: DeepPartial<AjaxContract> = {
            Apps: {
              listAppsV2: jest.fn().mockResolvedValue([wdsApp]),
            },
            WorkspaceData: {
              getVersion: jest.fn().mockReturnValue(abandonedPromise()),
              getStatus: jest.fn().mockReturnValue(abandonedPromise()),
              listInstances: jest.fn().mockRejectedValue(new Error('Something went wrong')),
              getCloneStatus: jest.fn().mockReturnValue(abandonedPromise()),
            },
          };
          asMockedFn(Ajax).mockReturnValue(mockAjax as AjaxContract);

          // Act
          const { result: renderHookRef } = await renderHookInAct(() => useWdsStatus({ workspaceId }));

          // Assert
          expect(renderHookRef.current.status).toEqual(
            expect.objectContaining({
              defaultInstanceExists: 'unknown',
            })
          );
        });
      });

      describe('if instances request succeeds', () => {
        it('updates status with defaultInstanceExists field', async () => {
          const mockInstances = ['6601fdbb-4b53-41da-87b2-81385f4a760e'];
          const mockAjax: DeepPartial<AjaxContract> = {
            Apps: {
              listAppsV2: jest.fn().mockResolvedValue([wdsApp]),
            },
            WorkspaceData: {
              getVersion: jest.fn().mockReturnValue(abandonedPromise()),
              getStatus: jest.fn().mockReturnValue(abandonedPromise()),
              listInstances: jest.fn().mockResolvedValue(mockInstances),
              getCloneStatus: jest.fn().mockReturnValue(abandonedPromise()),
            },
          };
          asMockedFn(Ajax).mockReturnValue(mockAjax as AjaxContract);

          // Act
          const { result: renderHookRef } = await renderHookInAct(() => useWdsStatus({ workspaceId }));

          // Assert
          expect(renderHookRef.current.status).toEqual(
            expect.objectContaining({
              defaultInstanceExists: 'true',
            })
          );
        });
      });
    });

    describe('clone status request', () => {
      describe('if clone status request fails', () => {
        it('does not update status on a 404 response', async () => {
          const mockAjax: DeepPartial<AjaxContract> = {
            Apps: {
              listAppsV2: jest.fn().mockResolvedValue([wdsApp]),
            },
            WorkspaceData: {
              getVersion: jest.fn().mockReturnValue(abandonedPromise()),
              getStatus: jest.fn().mockReturnValue(abandonedPromise()),
              listInstances: jest.fn().mockReturnValue(abandonedPromise()),
              getCloneStatus: jest.fn().mockRejectedValue(new Response('', { status: 404 })),
            },
          };
          asMockedFn(Ajax).mockReturnValue(mockAjax as AjaxContract);

          // Act
          const { result: renderHookRef } = await renderHookInAct(() => useWdsStatus({ workspaceId }));

          // Assert
          expect(renderHookRef.current.status).toEqual(
            expect.objectContaining({
              cloneSourceWorkspaceId: null,
              cloneStatus: null,
            })
          );
        });

        it('updates status with unknown for clone status for other error responses', async () => {
          const mockAjax: DeepPartial<AjaxContract> = {
            Apps: {
              listAppsV2: jest.fn().mockResolvedValue([wdsApp]),
            },
            WorkspaceData: {
              getVersion: jest.fn().mockReturnValue(abandonedPromise()),
              getStatus: jest.fn().mockReturnValue(abandonedPromise()),
              listInstances: jest.fn().mockRejectedValue(new Error('Something went wrong')),
              getCloneStatus: jest.fn().mockReturnValue(abandonedPromise()),
            },
          };
          asMockedFn(Ajax).mockReturnValue(mockAjax as AjaxContract);

          // Act
          const { result: renderHookRef } = await renderHookInAct(() => useWdsStatus({ workspaceId }));

          // Assert
          expect(renderHookRef.current.status).toEqual(
            expect.objectContaining({
              defaultInstanceExists: 'unknown',
            })
          );
        });
      });

      describe('if clone status request succeeds', () => {
        it('updates status with clone status fields', async () => {
          const mockCloneStatus: WDSCloneStatusResponse = {
            created: '2023-07-20T18:49:17.264656',
            jobId: '761fd9ae-8fa1-4805-94b2-be27997249c7',
            result: { sourceWorkspaceId: 'b3cc4ed2-678c-483f-9953-5d4789d5fa1b', status: 'RESTORESUCCEEDED' },
            status: 'SUCCEEDED',
            updated: '2023-07-20T18:50:28.264989',
          };
          const mockAjax: DeepPartial<AjaxContract> = {
            Apps: {
              listAppsV2: jest.fn().mockResolvedValue([wdsApp]),
            },
            WorkspaceData: {
              getVersion: jest.fn().mockReturnValue(abandonedPromise()),
              getStatus: jest.fn().mockReturnValue(abandonedPromise()),
              listInstances: jest.fn().mockReturnValue(abandonedPromise()),
              getCloneStatus: jest.fn().mockResolvedValue(mockCloneStatus),
            },
          };
          asMockedFn(Ajax).mockReturnValue(mockAjax as AjaxContract);

          // Act
          const { result: renderHookRef } = await renderHookInAct(() => useWdsStatus({ workspaceId }));

          // Assert
          expect(renderHookRef.current.status).toEqual(
            expect.objectContaining({
              cloneSourceWorkspaceId: 'b3cc4ed2-678c-483f-9953-5d4789d5fa1b',
              cloneStatus: 'RESTORESUCCEEDED',
              cloneErrorMessage: null,
            })
          );
        });
      });
    });
  });

  it('resets status and reloads data when re-rendered for a different workspace', async () => {
    // Arrange
    const listAppsV2 = jest.fn().mockResolvedValue([]);
    const mockAjax: DeepPartial<AjaxContract> = {
      Apps: {
        listAppsV2,
      },
    };
    asMockedFn(Ajax).mockReturnValue(mockAjax as AjaxContract);

    // Arrange
    const { result: renderHookRef, rerender } = await renderHookInAct(useWdsStatus, { initialProps: { workspaceId } });
    expect(renderHookRef.current.status).toEqual({
      numApps: '0',
      appName: 'unknown',
      appStatus: 'unknown',
      proxyUrl: 'unknown',
      wdsResponsive: 'unknown',
      version: 'unknown',
      chartVersion: 'unknown',
      image: 'unknown',
      wdsStatus: 'unresponsive',
      wdsDbStatus: 'unknown',
      wdsPingStatus: 'unknown',
      wdsIamStatus: 'unknown',
      defaultInstanceExists: 'unknown',
      cloneSourceWorkspaceId: 'unknown',
      cloneStatus: 'unknown',
      cloneErrorMessage: 'unknown',
    });

    listAppsV2.mockReturnValue(abandonedPromise());

    // Act
    const otherWorkspaceId = 'other-workspace';
    rerender({ workspaceId: otherWorkspaceId });

    // Assert
    expect(renderHookRef.current.status).toEqual({
      numApps: null,
      appName: null,
      appStatus: null,
      proxyUrl: null,
      wdsResponsive: null,
      version: null,
      chartVersion: null,
      image: null,
      wdsStatus: null,
      wdsDbStatus: null,
      wdsPingStatus: null,
      wdsIamStatus: null,
      defaultInstanceExists: null,
      cloneSourceWorkspaceId: null,
      cloneStatus: null,
      cloneErrorMessage: null,
    });

    expect(listAppsV2).toHaveBeenCalledWith(otherWorkspaceId);
  });
});
