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
        url: 'https://example.com/path/to/file.pfb',
      } satisfies PFBImportRequest,
    },
    // BagIt
    {
      queryParams: {
        url: 'https://example.com/path/to/file.bagit',
      },
      expectedResult: {
        type: 'bagit',
        url: 'https://example.com/path/to/file.bagit',
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
        url: 'https://example.com/path/to/file.json',
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
        manifestUrl: 'https://example.com/path/to/manifest.json',
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
        snapshotIds: ['00001111-2222-3333-aaaa-bbbbccccdddd', 'aaaabbbb-cccc-1111-2222-333333333333'],
      },
      expectedResult: {
        type: 'catalog-snapshots',
        snapshotIds: ['00001111-2222-3333-aaaa-bbbbccccdddd', 'aaaabbbb-cccc-1111-2222-333333333333'],
      } satisfies CatalogSnapshotsImportRequest,
    },
  ];

  it.each(testCases)(
    'parses $expectedResult.type import request from query parameters',
    ({ queryParams, expectedResult }) => {
      // Act
      const importRequest = getImportRequest(queryParams);

      // Assert
      expect(importRequest).toEqual(expectedResult);
    }
  );
});
