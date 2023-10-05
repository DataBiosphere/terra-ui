import { fetchDataCatalog } from 'src/pages/library/dataBrowser-utils';
import { asMockedFn } from 'src/testing/test-utils';

import {
  BagItImportRequest,
  CatalogDatasetImportRequest,
  CatalogSnapshotsImportRequest,
  EntitiesImportRequest,
  ImportRequest,
  PFBImportRequest,
  TDRSnapshotExportImportRequest,
  TDRSnapshotReferenceImportRequest,
} from './import-types';
import { getImportRequest } from './useImportRequest';

type DataBrowserUtilsExports = typeof import('src/pages/library/dataBrowser-utils');
jest.mock('src/pages/library/dataBrowser-utils', (): DataBrowserUtilsExports => {
  return {
    ...jest.requireActual<DataBrowserUtilsExports>('src/pages/library/dataBrowser-utils'),
    fetchDataCatalog: jest.fn(),
  };
});

describe('getImportRequest', () => {
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
        snapshotId: '00001111-2222-3333-aaaa-bbbbccccdddd',
        snapshotName: 'test-snapshot',
        tdrmanifest: 'https://example.com/path/to/manifest.json',
        tdrSyncPermissions: 'true',
        url: 'https://data.terra.bio',
      },
      expectedResult: {
        type: 'tdr-snapshot-export',
        manifestUrl: new URL('https://example.com/path/to/manifest.json'),
        snapshotId: '00001111-2222-3333-aaaa-bbbbccccdddd',
        snapshotName: 'test-snapshot',
        syncPermissions: true,
      } satisfies TDRSnapshotExportImportRequest,
    },
    // TDR snapshot by reference
    {
      queryParams: {
        format: 'snapshot',
        snapshotId: '00001111-2222-3333-aaaa-bbbbccccdddd',
        snapshotName: 'test-snapshot',
      },
      expectedResult: {
        type: 'tdr-snapshot-reference',
        snapshotId: '00001111-2222-3333-aaaa-bbbbccccdddd',
        snapshotName: 'test-snapshot',
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
    // Catalog snapshots
    {
      queryParams: {
        format: 'snapshot',
        snapshotIds: ['aaaabbbb-cccc-1111-2222-333333333333', '00001111-2222-3333-aaaa-bbbbccccdddd'],
      },
      expectedResult: {
        type: 'catalog-snapshots',
        snapshots: [
          {
            id: '00001111-2222-3333-aaaa-bbbbccccdddd',
            title: 'test-snapshot-1',
            description: 'A test snapshot',
          },
          {
            id: 'aaaabbbb-cccc-1111-2222-333333333333',
            title: 'test-snapshot-2',
            description: 'Another test snapshot',
          },
        ],
      } satisfies CatalogSnapshotsImportRequest,
    },
  ];

  beforeAll(() => {
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

  describe('catalog snapshot imports', () => {
    it('throws an error if unable to load the catalog', async () => {
      // Arrange
      asMockedFn(fetchDataCatalog).mockRejectedValue(new Response('Something went wrong', { status: 500 }));

      // Act
      const queryParams = {
        format: 'snapshot',
        snapshotIds: ['aaaabbbb-cccc-1111-2222-333333333333', '00001111-2222-3333-aaaa-bbbbccccdddd'],
      };
      const importRequestPromise = getImportRequest(queryParams);

      // Assert
      await expect(importRequestPromise).rejects.toEqual(new Error('Failed to load data catalog.'));
    });

    it('throws an error if any requested snapshots are not found in catalog', async () => {
      // Arrange
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
      ]);

      // Act
      const queryParams = {
        format: 'snapshot',
        snapshotIds: ['00001111-2222-3333-aaaa-bbbbccccdddd', 'ddddeeee-ffff-4444-5555-666666666666'],
      };
      const importRequestPromise = getImportRequest(queryParams);

      // Assert
      await expect(importRequestPromise).rejects.toEqual(
        new Error('Unable to find snapshot ddddeeee-ffff-4444-5555-666666666666 in catalog.')
      );
    });
  });
});
