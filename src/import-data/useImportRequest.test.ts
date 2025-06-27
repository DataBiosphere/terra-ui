import { partial } from '@terra-ui-packages/test-utils';
import { DataRepo, DataRepoContract, Snapshot } from 'src/libs/ajax/DataRepo';
import { SamResources, SamResourcesContract } from 'src/libs/ajax/SamResources';
import { asMockedFn } from 'src/testing/test-utils';

import {
  BagItImportRequest,
  EntitiesImportRequest,
  ImportRequest,
  PFBImportRequest,
  TDRSnapshotExportImportRequest,
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

type FeaturePreviewsExports = typeof import('src/libs/feature-previews');
jest.mock('src/libs/feature-previews', (): FeaturePreviewsExports => {
  return {
    ...jest.requireActual<FeaturePreviewsExports>('src/libs/feature-previews'),
    isFeaturePreviewEnabled: jest.fn(),
  };
});

describe('getImportRequest', () => {
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
  ];

  const mockSnapshotDetails = (snapshotId: string) =>
    jest.fn().mockImplementation(() => {
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
  });
});
