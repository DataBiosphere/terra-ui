import { partial } from '@terra-ui-packages/test-utils';
import { fetchDataCatalog } from 'src/data-catalog/data-browser-utils';
import { DataRepo, DataRepoContract, Snapshot } from 'src/libs/ajax/DataRepo';
import { SamResources, SamResourcesContract } from 'src/libs/ajax/SamResources';
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews';
import { ENABLE_AZURE_TDR_IMPORT } from 'src/libs/feature-previews-config';
import { asMockedFn } from 'src/testing/test-utils';

import {
  BagItImportRequest,
  CatalogDatasetImportRequest,
  EntitiesImportRequest,
  ImportRequest,
  PFBImportRequest,
  TDRSnapshotExportImportRequest,
  TDRSnapshotReferenceImportRequest,
} from './import-types';
import { getImportRequest } from './useImportRequest';

// Workaround for circular import errors.
jest.mock('src/auth/auth');

type DataRepoExports = typeof import('src/libs/ajax/DataRepo');
jest.mock('src/libs/ajax/DataRepo', (): DataRepoExports => {
  return {
    ...jest.requireActual<DataRepoExports>('src/libs/ajax/DataRepo'),
    DataRepo: jest.fn(),
  };
});

type SamResourcesExports = typeof import('src/libs/ajax/SamResources');
jest.mock('src/libs/ajax/SamResources', (): SamResourcesExports => {
  return {
    ...jest.requireActual<SamResourcesExports>('src/libs/ajax/SamResources'),
    SamResources: jest.fn(),
  };
});

type DataBrowserUtilsExports = typeof import('src/data-catalog/data-browser-utils');
jest.mock('src/data-catalog/data-browser-utils', (): DataBrowserUtilsExports => {
  return {
    ...jest.requireActual<DataBrowserUtilsExports>('src/data-catalog/data-browser-utils'),
    fetchDataCatalog: jest.fn(),
  };
});

type FeaturePreviewsExports = typeof import('src/libs/feature-previews');
jest.mock('src/libs/feature-previews', (): FeaturePreviewsExports => {
  return {
    ...jest.requireActual<FeaturePreviewsExports>('src/libs/feature-previews'),
    isFeaturePreviewEnabled: jest.fn(),
  };
});

describe('getImportRequest', () => {
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

  type TestCase = {
    queryParams: Record<string, any>;
    expectedResult: ImportRequest;
  };

  const testCases: TestCase[] = [
    // PFB
    {
      queryParams: {
        format: 'PFB',
        url: 'https://example.com/path/to/file.pfb',
      },
      expectedResult: {
        type: 'pfb',
        url: new URL('https://example.com/path/to/file.pfb'),
      } satisfies PFBImportRequest,
    },
    // BagIt
    {
      queryParams: {
        url: 'https://example.com/path/to/file.bagit',
      },
      expectedResult: {
        type: 'bagit',
        url: new URL('https://example.com/path/to/file.bagit'),
      } satisfies BagItImportRequest,
    },
    // Rawls entities
    {
      queryParams: {
        format: 'entitiesJson',
        url: 'https://example.com/path/to/file.json',
      },
      expectedResult: {
        type: 'entities',
        url: new URL('https://example.com/path/to/file.json'),
      } satisfies EntitiesImportRequest,
    },
    // TDR snapshot export
    {
      queryParams: {
        format: 'tdrexport',
        snapshotId: googleSnapshotFixture.id,
        tdrmanifest: 'https://example.com/path/to/manifest.json',
        tdrSyncPermissions: 'true',
        url: 'https://data.terra.bio',
      },
      expectedResult: {
        type: 'tdr-snapshot-export',
        manifestUrl: new URL('https://example.com/path/to/manifest.json'),
        snapshot: googleSnapshotFixture,
        snapshotAccessControls: [],
        syncPermissions: true,
      } satisfies TDRSnapshotExportImportRequest,
    },
    // TDR snapshot by reference
    {
      queryParams: {
        format: 'snapshot',
        snapshotId: googleSnapshotFixture.id,
        snapshotName: 'test-snapshot',
      },
      expectedResult: {
        type: 'tdr-snapshot-reference',
        snapshot: googleSnapshotFixture,
        snapshotAccessControls: [],
      } satisfies TDRSnapshotReferenceImportRequest,
    },
    // Catalog dataset
    {
      queryParams: {
        format: 'catalog',
        catalogDatasetId: '00001111-2222-3333-aaaa-bbbbccccdddd',
      },
      expectedResult: {
        type: 'catalog-dataset',
        datasetId: '00001111-2222-3333-aaaa-bbbbccccdddd',
      } satisfies CatalogDatasetImportRequest,
    },
  ];

  const mockSnapshotDetails = (snapshotId: string) =>
    jest.fn().mockImplementation(() => {
      if (snapshotId === azureSnapshotFixture.id) {
        return Promise.resolve(azureSnapshotFixture);
      }
      if (snapshotId === googleSnapshotFixture.id) {
        return Promise.resolve(googleSnapshotFixture);
      }
      return Promise.reject(new Response('{"message":"Snapshot not found"}', { status: 404 }));
    });

  beforeAll(() => {
    const mockDataRepo = {
      snapshot: (snapshotId: string): Partial<ReturnType<DataRepoContract['snapshot']>> => ({
        details: mockSnapshotDetails(snapshotId),
      }),
    };
    asMockedFn(DataRepo).mockReturnValue(mockDataRepo as unknown as DataRepoContract);

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
      {
        id: 'zzzzyyyy-xxxx-1111-2222-333333333333',
        'dct:creator': 'testowner',
        'dct:description': 'Yet another test snapshot',
        'dct:identifier': '99998888-7777-xxxx-yyyy-zzzzzzzzzzzz',
        'dct:issued': '2023-10-02T11:30:00.000000Z',
        'dct:title': 'test-snapshot-3',
        'dcat:accessURL':
          'https://jade.datarepo-dev.broadinstitute.org/snapshots/details/99998888-7777-xxxx-yyyy-zzzzzzzzzzzz',
        'TerraDCAT_ap:hasDataCollection': [],
        accessLevel: 'reader',
        storage: [],
        counts: {},
        samples: {},
        contributors: [],
      },
    ]);

    asMockedFn(SamResources).mockReturnValue(
      partial<SamResourcesContract>({
        getAuthDomains: jest.fn().mockResolvedValue([]),
      })
    );
  });

  it.each(testCases)(
    'parses $expectedResult.type import request from query parameters',
    async ({ queryParams, expectedResult }) => {
      // Act
      const importRequest = await getImportRequest(queryParams);

      // Assert
      expect(importRequest).toEqual(expectedResult);
    }
  );

  describe('snapshot imports', () => {
    it.each([
      // Snapshot export
      {
        queryParams: {
          format: 'tdrexport',
          snapshotId: '00001111-2222-3333-xxxx-yyyyyyzzzzzz',
          tdrmanifest: 'https://example.com/path/to/manifest.json',
          tdrSyncPermissions: 'true',
          url: 'https://data.terra.bio',
        },
      },
      // Snapshot reference
      {
        queryParams: {
          format: 'snapshot',
          snapshotId: '00001111-2222-3333-xxxx-yyyyyyzzzzzz',
        },
      },
    ] as { queryParams: Record<string, any> }[])(
      'throws an error if unable to load the snapshot',
      async ({ queryParams }) => {
        // Act
        const importRequestPromise = getImportRequest(queryParams);

        // Assert
        expect(importRequestPromise).rejects.toEqual(new Error('Unable to load snapshot.'));
      }
    );

    it.each([
      // Snapshot export
      {
        queryParams: {
          format: 'tdrexport',
          snapshotId: googleSnapshotFixture.id,
          tdrmanifest: 'https://example.com/path/to/manifest.json',
          tdrSyncPermissions: 'true',
          url: 'https://data.terra.bio',
        },
      },
      // Snapshot by reference
      {
        queryParams: {
          format: 'snapshot',
          snapshotId: googleSnapshotFixture.id,
          snapshotName: 'test-snapshot',
        },
      },
    ] as { queryParams: Record<string, any> }[])(
      'fetches access controls from Sam ($queryParams.format)',
      async ({ queryParams }) => {
        // Arrange
        const mockAccessControlGroups = ['example-group'];
        asMockedFn(SamResources).mockReturnValue(
          partial<SamResourcesContract>({
            getAuthDomains: jest.fn().mockResolvedValue(mockAccessControlGroups),
          })
        );
        // Act
        const importRequest = await getImportRequest(queryParams);

        // Assert
        const snapshotAccessControls =
          'snapshotAccessControls' in importRequest ? importRequest.snapshotAccessControls : undefined;
        expect(snapshotAccessControls).toEqual(mockAccessControlGroups);
      }
    );

    it('supports generating a manifest for a snapshot export', async () => {
      const queryParams = {
        format: 'tdrexport',
        snapshotId: googleSnapshotFixture.id,
        tdrSyncPermissions: 'false',
        url: 'https://data.terra.bio',
      };
      // Arrange
      const manifestUrl = new URL('https://example.com/manifest.parquet');
      const mockDataRepo = {
        snapshot: (snapshotId: string): Partial<ReturnType<DataRepoContract['snapshot']>> => ({
          exportSnapshot: jest.fn().mockResolvedValue({ jobId: '1234' }),
          details: mockSnapshotDetails(snapshotId),
        }),
        job: (_jobId: string): Partial<ReturnType<DataRepoContract['job']>> => ({
          details: jest
            .fn()
            .mockResolvedValueOnce({ job_status: 'running' })
            .mockResolvedValueOnce({ job_status: 'succeeded' }),
          result: jest.fn().mockResolvedValue({ format: { parquet: { manifest: manifestUrl } } }),
        }),
      };
      asMockedFn(DataRepo).mockReturnValue(mockDataRepo as unknown as DataRepoContract);
      // Reset mock state from previous tests.
      asMockedFn(SamResources).mockReturnValue(
        partial<SamResourcesContract>({
          getAuthDomains: jest.fn().mockResolvedValue([]),
        })
      );
      // Act
      const importRequest = await getImportRequest(queryParams);
      // Assert
      expect(importRequest).toEqual({
        manifestUrl,
        snapshot: googleSnapshotFixture,
        snapshotAccessControls: [],
        syncPermissions: false,
        type: 'tdr-snapshot-export',
      });
    });

    it('rejects snapshot imports for Azure snapshots unless feature preview is enabled', async () => {
      // Arrange
      const queryParams = {
        format: 'tdrexport',
        snapshotId: azureSnapshotFixture.id,
        tdrmanifest: 'https://example.com/path/to/manifest.json',
        tdrSyncPermissions: 'true',
        url: 'https://data.terra.bio',
      };

      asMockedFn(isFeaturePreviewEnabled).mockReturnValue(false);

      // Act/Assert
      await expect(getImportRequest(queryParams)).rejects.toEqual(
        new Error('Importing Azure snapshots is not supported.')
      );

      // Arrange
      asMockedFn(isFeaturePreviewEnabled).mockImplementation((id) => id === ENABLE_AZURE_TDR_IMPORT);

      // Act/Assert
      await expect(getImportRequest(queryParams)).resolves.toEqual(expect.anything());
    });

    it('rejects snapshot by reference imports for Azure snapshots', async () => {
      // Act
      const queryParams = {
        format: 'snapshot',
        snapshotId: azureSnapshotFixture.id,
      };
      const importRequest = getImportRequest(queryParams);

      // Assert
      await expect(importRequest).rejects.toEqual(
        new Error('Importing by reference is not supported for Azure snapshots.')
      );
    });
  });
});
