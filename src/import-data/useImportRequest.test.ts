import { fetchDataCatalog } from 'src/data-catalog/data-browser-utils';
import { DataRepo, DataRepoContract, Snapshot } from 'src/libs/ajax/DataRepo';
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
jest.mock('src/libs/auth');

type DataRepoExports = typeof import('src/libs/ajax/DataRepo');
jest.mock('src/libs/ajax/DataRepo', (): DataRepoExports => {
  return {
    ...jest.requireActual<DataRepoExports>('src/libs/ajax/DataRepo'),
    DataRepo: jest.fn(),
  };
});

type DataBrowserUtilsExports = typeof import('src/data-catalog/data-browser-utils');
jest.mock('src/pages/library/data-browser-utils', (): DataBrowserUtilsExports => {
  return {
    ...jest.requireActual<DataBrowserUtilsExports>('src/pages/library/data-browser-utils'),
    fetchDataCatalog: jest.fn(),
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

  beforeAll(() => {
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
