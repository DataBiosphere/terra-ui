import { DeepPartial } from '@terra-ui-packages/core-utils';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { useWorkspaces } from 'src/components/workspace-utils';
import { Ajax } from 'src/libs/ajax';
import { useRoute } from 'src/libs/nav';
import { useDataCatalog } from 'src/pages/library/dataBrowser-utils';
import { asMockedFn, renderWithAppContexts as render, SelectHelper } from 'src/testing/test-utils';
import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';

import { ImportData } from './ImportData';

type UserEvent = ReturnType<typeof userEvent.setup>;

type WorkspaceUtilsExports = typeof import('src/components/workspace-utils');
jest.mock('src/components/workspace-utils', (): WorkspaceUtilsExports => {
  return {
    ...jest.requireActual<WorkspaceUtilsExports>('src/components/workspace-utils'),
    useWorkspaces: jest.fn(),
  };
});

type AjaxExports = typeof import('src/libs/ajax');
type AjaxContract = ReturnType<AjaxExports['Ajax']>;
jest.mock('src/libs/ajax');

type NavExports = typeof import('src/libs/nav');
jest.mock('src/libs/nav', (): NavExports => {
  return {
    ...jest.requireActual<NavExports>('src/libs/nav'),
    goToPath: jest.fn(),
    useRoute: jest.fn(),
  };
});

type NotificationsExports = typeof import('src/libs/notifications');
jest.mock('src/libs/notifications', (): NotificationsExports => {
  return {
    ...jest.requireActual<NotificationsExports>('src/libs/notifications'),
    notify: jest.fn(),
  };
});

type DataBrowserUtilsExports = typeof import('src/pages/library/dataBrowser-utils');
jest.mock('src/pages/library/dataBrowser-utils', (): DataBrowserUtilsExports => {
  return {
    ...jest.requireActual<DataBrowserUtilsExports>('src/pages/library/dataBrowser-utils'),
    useDataCatalog: jest.fn(),
  };
});

interface SetupOptions {
  mockAjax: DeepPartial<AjaxContract>;
  queryParams: { [key: string]: unknown };
}

const setup = (opts: SetupOptions) => {
  const { mockAjax, queryParams } = opts;

  const mockAjaxWithCommonFunctions: DeepPartial<AjaxContract> = {
    ...mockAjax,
    Billing: {
      listProjects: jest.fn().mockResolvedValue([{}]),
      ...mockAjax.Billing,
    },
    FirecloudBucket: {
      getTemplateWorkspaces: jest.fn().mockResolvedValue([]),
      ...mockAjax.FirecloudBucket,
    },
    Metrics: {
      captureEvent: jest.fn(),
      ...mockAjax.Metrics,
    },
  };
  asMockedFn(Ajax).mockImplementation(() => mockAjaxWithCommonFunctions as AjaxContract);

  asMockedFn(useRoute).mockReturnValue({
    query: queryParams,
  });

  render(h(ImportData));
};

const importIntoExistingWorkspace = async (user: UserEvent, workspaceName: string): Promise<void> => {
  const existingWorkspace = screen.getByText('Start with an existing workspace', { exact: false });
  await user.click(existingWorkspace);

  const workspaceSelect = new SelectHelper(screen.getByLabelText('Select a workspace'), user);
  await workspaceSelect.selectOption(workspaceName);

  await user.click(screen.getByRole('button', { name: 'Import' }));
};

describe('ImportData', () => {
  beforeEach(() => {
    // Arrange
    asMockedFn(useWorkspaces).mockReturnValue({
      workspaces: [defaultAzureWorkspace, defaultGoogleWorkspace],
      loading: false,
      refresh: () => Promise.resolve(),
    });

    asMockedFn(useDataCatalog).mockReturnValue({
      dataCatalog: [],
      loading: false,
      refresh: () => Promise.resolve(),
    });
  });

  describe('PFB imports', () => {
    it('imports PFB files', async () => {
      // Arrange
      const user = userEvent.setup();

      const importJob = jest.fn().mockResolvedValue({ jobId: 'new-job' });
      const getWorkspaceApi = jest.fn().mockReturnValue({
        importJob,
      });

      const importUrl = 'https://example.com/path/to/file.pfb';
      setup({
        mockAjax: {
          Workspaces: {
            workspace: getWorkspaceApi,
          },
        },
        queryParams: {
          format: 'PFB',
          url: importUrl,
        },
      });

      // Act
      await importIntoExistingWorkspace(user, defaultGoogleWorkspace.workspace.name);

      // Assert
      expect(getWorkspaceApi).toHaveBeenCalledWith(
        defaultGoogleWorkspace.workspace.namespace,
        defaultGoogleWorkspace.workspace.name
      );

      expect(importJob).toHaveBeenCalledWith(importUrl, 'pfb', null);
    });
  });

  describe('BagIt imports', () => {
    it('imports BagIt file when format is unspecified', async () => {
      // Arrange
      const user = userEvent.setup();

      const importBagit = jest.fn().mockResolvedValue(undefined);
      const getWorkspaceApi = jest.fn().mockReturnValue({
        importBagit,
      });

      const importUrl = 'https://example.com/path/to/file.bagit';
      setup({
        mockAjax: {
          Workspaces: {
            workspace: getWorkspaceApi,
          },
        },
        queryParams: {
          url: importUrl,
        },
      });

      // Act
      await importIntoExistingWorkspace(user, defaultGoogleWorkspace.workspace.name);

      // Assert
      expect(getWorkspaceApi).toHaveBeenCalledWith(
        defaultGoogleWorkspace.workspace.namespace,
        defaultGoogleWorkspace.workspace.name
      );

      expect(importBagit).toHaveBeenCalledWith(importUrl);
    });
  });

  describe('Entities JSON imports', () => {
    it('imports Rawls entities JSON', async () => {
      // Arrange
      const user = userEvent.setup();

      const importJSON = jest.fn().mockResolvedValue(undefined);
      const getWorkspaceApi = jest.fn().mockReturnValue({
        importJSON,
      });

      const importUrl = 'https://example.com/path/to/file.json';
      setup({
        mockAjax: {
          Workspaces: {
            workspace: getWorkspaceApi,
          },
        },
        queryParams: {
          format: 'entitiesJson',
          url: importUrl,
        },
      });

      // Act
      await importIntoExistingWorkspace(user, defaultGoogleWorkspace.workspace.name);

      // Assert
      expect(getWorkspaceApi).toHaveBeenCalledWith(
        defaultGoogleWorkspace.workspace.namespace,
        defaultGoogleWorkspace.workspace.name
      );

      expect(importJSON).toHaveBeenCalledWith(importUrl);
    });
  });

  describe('TDR imports', () => {
    describe('TDR exports', () => {
      const queryParams = {
        format: 'tdrexport',
        snapshotId: '00001111-2222-3333-aaaa-bbbbccccdddd',
        snapshotName: 'test-snapshot',
        tdrmanifest: 'https://example.com/path/to/manifest.json',
        tdrSyncPermissions: 'true',
        url: 'https://data.terra.bio',
      };

      it('imports TDR exports into Google workspaces', async () => {
        // Arrange
        const user = userEvent.setup();

        const importJob = jest.fn().mockResolvedValue({ jobId: 'new-job' });
        const getWorkspaceApi = jest.fn().mockReturnValue({
          importJob,
        });

        setup({
          mockAjax: {
            Workspaces: {
              workspace: getWorkspaceApi,
            },
          },
          queryParams,
        });

        // Act
        await importIntoExistingWorkspace(user, defaultGoogleWorkspace.workspace.name);

        // Assert
        expect(getWorkspaceApi).toHaveBeenCalledWith(
          defaultGoogleWorkspace.workspace.namespace,
          defaultGoogleWorkspace.workspace.name
        );

        expect(importJob).toHaveBeenCalledWith(queryParams.tdrmanifest, 'tdrexport', { tdrSyncPermissions: true });
      });

      it('copies snapshot into Azure workspaces', async () => {
        // Arrange
        const user = userEvent.setup();

        const importTdr = jest.fn().mockResolvedValue(undefined);

        const wdsProxyUrl = 'https://proxyurl';
        setup({
          mockAjax: {
            Apps: {
              listAppsV2: jest.fn().mockResolvedValue([
                {
                  appType: 'WDS',
                  appName: `wds-${defaultAzureWorkspace.workspace.workspaceId}`,
                  status: 'RUNNING',
                  proxyUrls: { wds: wdsProxyUrl },
                  workspaceId: defaultAzureWorkspace.workspace.workspaceId,
                },
              ]),
            },
            WorkspaceData: {
              importTdr,
            },
          },
          queryParams,
        });

        // Act
        await importIntoExistingWorkspace(user, defaultAzureWorkspace.workspace.name);

        // Assert
        expect(importTdr).toHaveBeenCalledWith(
          wdsProxyUrl,
          defaultAzureWorkspace.workspace.workspaceId,
          queryParams.snapshotId
        );
      });
    });

    describe('TDR snapshot references', () => {
      it('imports a snapshot by reference', async () => {
        // Arrange
        const user = userEvent.setup();

        const importSnapshot = jest.fn().mockResolvedValue(undefined);
        const getWorkspaceApi = jest.fn().mockReturnValue({
          importSnapshot,
        });

        const queryParams = {
          format: 'snapshot',
          snapshotId: '00001111-2222-3333-aaaa-bbbbccccdddd',
          snapshotName: 'test-snapshot',
        };
        setup({
          mockAjax: {
            Workspaces: {
              workspace: getWorkspaceApi,
            },
          },
          queryParams,
        });

        // Act
        await importIntoExistingWorkspace(user, defaultGoogleWorkspace.workspace.name);

        // Assert
        expect(getWorkspaceApi).toHaveBeenCalledWith(
          defaultGoogleWorkspace.workspace.namespace,
          defaultGoogleWorkspace.workspace.name
        );

        expect(importSnapshot).toHaveBeenCalledWith(queryParams.snapshotId, queryParams.snapshotName);
      });
    });

    describe('Catalog imports', () => {
      it('imports multiple snapshots by reference from the data catalog', async () => {
        // Arrange
        const user = userEvent.setup();

        const importSnapshot = jest.fn().mockResolvedValue(undefined);
        const getWorkspaceApi = jest.fn().mockReturnValue({
          importSnapshot,
        });

        const queryParams = {
          format: 'snapshot',
          snapshotIds: ['00001111-2222-3333-aaaa-bbbbccccdddd', 'aaaabbbb-cccc-1111-2222-333333333333'],
        };
        setup({
          mockAjax: {
            Workspaces: {
              workspace: getWorkspaceApi,
            },
          },
          queryParams,
        });

        asMockedFn(useDataCatalog).mockReturnValue({
          dataCatalog: [
            {
              id: 'aaaabbbb-cccc-dddd-eeee-ffffgggghhhh',
              'dct:creator': 'testowner',
              'dct:description': 'A test snapshot',
              'dct:identifier': '00001111-2222-3333-aaaa-bbbbccccdddd',
              'dct:issued': '2023-10-02T11:30:00.000000Z',
              'dct:title': 'test-snapshot-1',
              'dcat:accessURL':
                'https://jade.datarepo-dev.broadinstitute.org/snapshots/details/00001111-2222-3333-aaaa-bbbbccccdddd',
              'TerraDCAT_ap:hasDataCollection': [],
              accessLevel: 'reader',
              storage: [],
              counts: {},
              samples: {},
              contributors: [],
            },
            {
              id: '11112222-3333-4444-5555-666677778888',
              'dct:creator': 'testowner',
              'dct:description': 'Another test snapshot',
              'dct:identifier': 'aaaabbbb-cccc-1111-2222-333333333333',
              'dct:issued': '2023-10-02T11:30:00.000000Z',
              'dct:title': 'test-snapshot-2',
              'dcat:accessURL':
                'https://jade.datarepo-dev.broadinstitute.org/snapshots/details/aaaabbbb-cccc-1111-2222-333333333333',
              'TerraDCAT_ap:hasDataCollection': [],
              accessLevel: 'reader',
              storage: [],
              counts: {},
              samples: {},
              contributors: [],
            },
          ],
          loading: false,
          refresh: () => Promise.resolve(),
        });

        // Act
        await importIntoExistingWorkspace(user, defaultGoogleWorkspace.workspace.name);

        // Assert
        expect(getWorkspaceApi).toHaveBeenCalledWith(
          defaultGoogleWorkspace.workspace.namespace,
          defaultGoogleWorkspace.workspace.name
        );

        expect(importSnapshot).toHaveBeenCalledWith(
          '00001111-2222-3333-aaaa-bbbbccccdddd',
          'test-snapshot-1',
          'A test snapshot'
        );
        expect(importSnapshot).toHaveBeenCalledWith(
          'aaaabbbb-cccc-1111-2222-333333333333',
          'test-snapshot-2',
          'Another test snapshot'
        );
      });
    });

    it('imports from the data catalog', async () => {
      // Arrange
      const user = userEvent.setup();

      const exportDataset = jest.fn().mockResolvedValue(undefined);

      const queryParams = {
        format: 'catalog',
        catalogDatasetId: '00001111-2222-3333-aaaa-bbbbccccdddd',
      };
      setup({
        mockAjax: {
          Catalog: {
            exportDataset,
          },
        },
        queryParams,
      });

      // Act
      await importIntoExistingWorkspace(user, defaultGoogleWorkspace.workspace.name);

      // Assert
      expect(exportDataset).toHaveBeenCalledWith({
        id: queryParams.catalogDatasetId,
        workspaceId: defaultGoogleWorkspace.workspace.workspaceId,
      });
    });
  });
});
