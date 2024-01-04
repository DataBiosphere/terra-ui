import { DeepPartial } from '@terra-ui-packages/core-utils';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { DataRepo, DataRepoContract, Snapshot } from 'src/libs/ajax/DataRepo';
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews';
import { ENABLE_AZURE_PFB_IMPORT, ENABLE_AZURE_TDR_IMPORT } from 'src/libs/feature-previews-config';
import { useRoute } from 'src/libs/nav';
import { asMockedFn, renderWithAppContexts as render, SelectHelper } from 'src/testing/test-utils';
import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';
import { useWorkspaces } from 'src/workspaces/useWorkspaces';

import { ImportDataContainer } from './ImportData';
import { selectExistingWorkspacePrompt } from './ImportDataDestination';

type UserEvent = ReturnType<typeof userEvent.setup>;

type WorkspaceUtilsExports = typeof import('src/workspaces/useWorkspaces');
jest.mock('src/workspaces/useWorkspaces', (): WorkspaceUtilsExports => {
  return {
    ...jest.requireActual<WorkspaceUtilsExports>('src/workspaces/useWorkspaces'),
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

type FeaturePreviewExports = typeof import('src/libs/feature-previews');
jest.mock(
  'src/libs/feature-previews',
  (): FeaturePreviewExports => ({
    ...jest.requireActual('src/libs/feature-previews'),
    isFeaturePreviewEnabled: jest.fn().mockReturnValue(false),
  })
);

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

type DataBrowserUtilsExports = typeof import('src/data-catalog/data-browser-utils');
jest.mock('src/data-catalog/data-browser-utils', (): DataBrowserUtilsExports => {
  return {
    ...jest.requireActual<DataBrowserUtilsExports>('src/data-catalog/data-browser-utils'),
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
  const startImportJob = jest.fn().mockResolvedValue({ jobId: 'new-job' });

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
      startImportJob,
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
    startImportJob,
    wdsProxyUrl,
  };
};

const importIntoExistingWorkspace = async (user: UserEvent, workspaceName: string): Promise<void> => {
  const existingWorkspace = screen.getByText(selectExistingWorkspacePrompt, { exact: false });
  await user.click(existingWorkspace);

  const workspaceSelect = new SelectHelper(screen.getByLabelText('Select a workspace'), user);
  await workspaceSelect.selectOption(new RegExp(workspaceName));

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
    describe('PFB files', () => {
      it('imports PFB files into GCP workspaces', async () => {
        // Arrange
        const user = userEvent.setup();

        const importUrl = 'https://example.com/path/to/file.pfb';
        const { getWorkspaceApi, importJob, startImportJob } = await setup({
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
        expect(startImportJob).not.toHaveBeenCalled();
      });

      it('imports PFB files into Azure workspaces', async () => {
        // Arrange
        const user = userEvent.setup();

        asMockedFn(isFeaturePreviewEnabled).mockImplementation(
          (featurePreview) => featurePreview === ENABLE_AZURE_PFB_IMPORT
        );

        const importUrl = 'https://example.com/path/to/file.pfb';
        const { importJob, startImportJob, wdsProxyUrl } = await setup({
          queryParams: {
            format: 'PFB',
            url: importUrl,
          },
        });

        // Act
        await importIntoExistingWorkspace(user, defaultAzureWorkspace.workspace.name);

        // Assert
        expect(startImportJob).toHaveBeenCalledWith(wdsProxyUrl, defaultAzureWorkspace.workspace.workspaceId, {
          url: importUrl,
          type: 'PFB',
        });
        expect(importJob).not.toHaveBeenCalled();
      });
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
        const { getWorkspaceApi, importJob, importTdr } = await setup({ queryParams });

        // Act
        await importIntoExistingWorkspace(user, defaultGoogleWorkspace.workspace.name);

        // Assert
        expect(getWorkspaceApi).toHaveBeenCalledWith(
          defaultGoogleWorkspace.workspace.namespace,
          defaultGoogleWorkspace.workspace.name
        );

        expect(importJob).toHaveBeenCalledWith(queryParams.tdrmanifest, 'tdrexport', { tdrSyncPermissions: true });
        expect(importTdr).not.toHaveBeenCalled();
      });

      it('imports snapshots into Azure workspaces', async () => {
        // Arrange
        const user = userEvent.setup();

        asMockedFn(isFeaturePreviewEnabled).mockImplementation(
          (featurePreview) => featurePreview === ENABLE_AZURE_TDR_IMPORT
        );

        const queryParams = {
          ...commonSnapshotExportQueryParams,
          snapshotId: azureSnapshotFixture.id,
        };
        const { importJob, importTdr, wdsProxyUrl } = await setup({ queryParams });

        // Act
        await importIntoExistingWorkspace(user, defaultAzureWorkspace.workspace.name);

        // Assert
        expect(importTdr).toHaveBeenCalledWith(
          wdsProxyUrl,
          defaultAzureWorkspace.workspace.workspaceId,
          queryParams.tdrmanifest
        );
        expect(importJob).not.toHaveBeenCalled();
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
    { queryParams: { format: 'pfb' }, expectedErrorMessage: 'A URL is required' },
    {
      queryParams: { format: 'tdrexport', snapshotId: '00001111-2222-3333-aaaa-bbbbccccdddd' },
      expectedErrorMessage: 'A manifest URL is required',
    },
  ] as { queryParams: Record<string, any>; expectedErrorMessage: string }[])(
    'renders an error message for invalid import requests',
    async ({ queryParams, expectedErrorMessage }) => {
      // Act
      await setup({ queryParams });

      // Assert
      screen.getByText('Invalid import request.');
      screen.getByText(expectedErrorMessage);
    }
  );
});
