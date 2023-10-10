import { DeepPartial } from '@terra-ui-packages/core-utils';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { useWorkspaces } from 'src/components/workspace-utils';
import { Ajax } from 'src/libs/ajax';
import { DataRepo, DataRepoContract, Snapshot } from 'src/libs/ajax/DataRepo';
import { useRoute } from 'src/libs/nav';
import { fetchDataCatalog } from 'src/pages/library/dataBrowser-utils';
import { asMockedFn, renderWithAppContexts as render, SelectHelper } from 'src/testing/test-utils';
import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';

import { ImportDataContainer } from './ImportData';

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

type DataRepoExports = typeof import('src/libs/ajax/DataRepo');
jest.mock('src/libs/ajax/DataRepo', (): DataRepoExports => {
  return {
    ...jest.requireActual<DataRepoExports>('src/libs/ajax/DataRepo'),
    DataRepo: jest.fn(),
  };
});

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
    fetchDataCatalog: jest.fn(),
  };
});

const azureSnapshotFixture: Snapshot = {
  id: 'aaaabbbb-cccc-dddd-0000-111122223333',
  name: 'test-snapshot',
  source: [
    {
      dataset: {
        id: 'aaaabbbb-cccc-dddd-0000-111122223333',
        name: 'test-dataset',
        secureMonitoringEnabled: false,
      },
    },
  ],
  cloudPlatform: 'azure',
};

const googleSnapshotFixture: Snapshot = {
  id: '00001111-2222-3333-aaaa-bbbbccccdddd',
  name: 'test-snapshot',
  source: [
    {
      dataset: {
        id: '00001111-2222-3333-aaaa-bbbbccccdddd',
        name: 'test-dataset',
        secureMonitoringEnabled: false,
      },
    },
  ],
  cloudPlatform: 'gcp',
};

interface SetupOptions {
  queryParams: { [key: string]: unknown };
}

const setup = async (opts: SetupOptions) => {
  const { queryParams } = opts;

  const mockDataRepo = {
    snapshot: (snapshotId: string): Partial<ReturnType<DataRepoContract['snapshot']>> => ({
      details: jest.fn().mockImplementation(() => {
        if (snapshotId === azureSnapshotFixture.id) {
          return azureSnapshotFixture;
        }
        if (snapshotId === googleSnapshotFixture.id) {
          return googleSnapshotFixture;
        }
        throw new Response('{"message":"Snapshot not found"}', { status: 404 });
      }),
    }),
  };
  asMockedFn(DataRepo).mockReturnValue(mockDataRepo as unknown as DataRepoContract);

  const exportDataset = jest.fn().mockResolvedValue(undefined);

  const importBagit = jest.fn().mockResolvedValue(undefined);
  const importJob = jest.fn().mockResolvedValue({ jobId: 'new-job' });
  const importJSON = jest.fn().mockResolvedValue(undefined);
  const importSnapshot = jest.fn().mockResolvedValue(undefined);

  const getWorkspaceApi = jest.fn().mockReturnValue({
    importBagit,
    importJob,
    importJSON,
    importSnapshot,
  });

  const importTdr = jest.fn().mockResolvedValue(undefined);

  const wdsProxyUrl = 'https://proxyurl';
  const mockAjax: DeepPartial<AjaxContract> = {
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
    Billing: {
      listProjects: jest.fn().mockResolvedValue([{}]),
    },
    Catalog: {
      exportDataset,
    },
    DataRepo: mockDataRepo,
    FirecloudBucket: {
      getTemplateWorkspaces: jest.fn().mockResolvedValue([]),
    },
    Metrics: {
      captureEvent: jest.fn(),
    },
    WorkspaceData: {
      importTdr,
    },
    Workspaces: {
      workspace: getWorkspaceApi,
    },
  };
  asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

  asMockedFn(useRoute).mockReturnValue({
    query: queryParams,
  });

  render(h(ImportDataContainer));

  await waitFor(() => {
    expect(screen.queryByTestId('loading-spinner')).toBeNull();
  });

  return {
    exportDataset,
    getWorkspaceApi,
    importBagit,
    importJob,
    importJSON,
    importSnapshot,
    importTdr,
    wdsProxyUrl,
  };
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
  });

  describe('files', () => {
    it('imports PFB files', async () => {
      // Arrange
      const user = userEvent.setup();

      const importUrl = 'https://example.com/path/to/file.pfb';
      const { getWorkspaceApi, importJob } = await setup({
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

    it('imports BagIt files when format is unspecified', async () => {
      // Arrange
      const user = userEvent.setup();

      const importUrl = 'https://example.com/path/to/file.bagit';
      const { getWorkspaceApi, importBagit } = await setup({
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

    it('imports Rawls entities JSON files', async () => {
      // Arrange
      const user = userEvent.setup();

      const importUrl = 'https://example.com/path/to/file.json';
      const { getWorkspaceApi, importJSON } = await setup({
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

  describe('TDR', () => {
    describe('snapshot exports', () => {
      const commonSnapshotExportQueryParams = {
        format: 'tdrexport',
        tdrmanifest: 'https://example.com/path/to/manifest.json',
        tdrSyncPermissions: 'true',
        url: 'https://data.terra.bio',
      };

      it('imports snapshot exports into Google workspaces', async () => {
        // Arrange
        const user = userEvent.setup();

        const queryParams = {
          ...commonSnapshotExportQueryParams,
          snapshotId: googleSnapshotFixture.id,
        };
        const { getWorkspaceApi, importJob } = await setup({ queryParams });

        // Act
        await importIntoExistingWorkspace(user, defaultGoogleWorkspace.workspace.name);

        // Assert
        expect(getWorkspaceApi).toHaveBeenCalledWith(
          defaultGoogleWorkspace.workspace.namespace,
          defaultGoogleWorkspace.workspace.name
        );

        expect(importJob).toHaveBeenCalledWith(queryParams.tdrmanifest, 'tdrexport', { tdrSyncPermissions: true });
      });

      it('imports snapshots into Azure workspaces', async () => {
        // Arrange
        const user = userEvent.setup();

        const queryParams = {
          ...commonSnapshotExportQueryParams,
          snapshotId: azureSnapshotFixture.id,
        };
        const { importTdr, wdsProxyUrl } = await setup({ queryParams });

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

    describe('snapshot references', () => {
      it('imports a snapshot by reference', async () => {
        // Arrange
        const user = userEvent.setup();

        const queryParams = {
          format: 'snapshot',
          snapshotId: googleSnapshotFixture.id,
        };
        const { getWorkspaceApi, importSnapshot } = await setup({ queryParams });

        // Act
        await importIntoExistingWorkspace(user, defaultGoogleWorkspace.workspace.name);

        // Assert
        expect(getWorkspaceApi).toHaveBeenCalledWith(
          defaultGoogleWorkspace.workspace.namespace,
          defaultGoogleWorkspace.workspace.name
        );

        expect(importSnapshot).toHaveBeenCalledWith(queryParams.snapshotId, googleSnapshotFixture.name);
      });
    });
  });

  describe('catalog', () => {
    it('imports multiple snapshots by reference from the data catalog', async () => {
      // Arrange
      const user = userEvent.setup();

      asMockedFn(fetchDataCatalog).mockResolvedValue([
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
      ]);

      const queryParams = {
        format: 'snapshot',
        snapshotIds: ['00001111-2222-3333-aaaa-bbbbccccdddd', 'aaaabbbb-cccc-1111-2222-333333333333'],
      };
      const { getWorkspaceApi, importSnapshot } = await setup({ queryParams });

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

    it('imports from the data catalog', async () => {
      // Arrange
      const user = userEvent.setup();

      const queryParams = {
        format: 'catalog',
        catalogDatasetId: '00001111-2222-3333-aaaa-bbbbccccdddd',
      };
      const { exportDataset } = await setup({ queryParams });

      // Act
      await importIntoExistingWorkspace(user, defaultGoogleWorkspace.workspace.name);

      // Assert
      expect(exportDataset).toHaveBeenCalledWith({
        id: queryParams.catalogDatasetId,
        workspaceId: defaultGoogleWorkspace.workspace.workspaceId,
      });
    });
  });

  it.each([
    { queryParams: { format: 'pfb' } },
    { queryParams: { format: 'tdrexport', snapshotId: '00001111-2222-3333-aaaa-bbbbccccdddd' } },
  ] as { queryParams: Record<string, any> }[])(
    'renders an error message for invalid import requests',
    async ({ queryParams }) => {
      // Act
      await setup({ queryParams });

      // Assert
      screen.getByText('Invalid import request.');
    }
  );
});
