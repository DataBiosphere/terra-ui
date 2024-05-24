import { CloudProvider } from 'src/workspaces/utils';

import {
  anvilPfbImportRequests,
  azureTdrSnapshotImportRequest,
  biodataCatalystPfbImportRequests,
  gcpTdrSnapshotImportRequest,
  gcpTdrSnapshotReferenceImportRequest,
  genericPfbImportRequest,
  protectedGcpTdrSnapshotImportRequest,
  protectedGcpTdrSnapshotReferenceImportRequest,
} from './__fixtures__/import-request-fixtures';
import { getRequiredCloudPlatform, isProtectedSource } from './import-requirements';
import { ImportRequest } from './import-types';

describe('cloud provider requirements', () => {
  describe('getRequiredCloudPlatform', () => {
    it.each([
      {
        importRequest: genericPfbImportRequest,
        expectedCloudPlatform: 'GCP',
      },
      {
        importRequest: azureTdrSnapshotImportRequest,
        expectedCloudPlatform: 'AZURE',
      },
      {
        importRequest: gcpTdrSnapshotImportRequest,
        expectedCloudPlatform: 'GCP',
      },
    ] as {
      importRequest: ImportRequest;
      expectedCloudPlatform: CloudProvider | undefined;
    }[])('returns cloud provider required for import', async ({ importRequest, expectedCloudPlatform }) => {
      // Act
      const requiredCloudPlatform = getRequiredCloudPlatform(importRequest);

      // Assert
      expect(requiredCloudPlatform).toBe(expectedCloudPlatform);
    });
  });
});

describe('protected data requirements', () => {
  const protectedImports: ImportRequest[] = [
    // AnVIL
    ...anvilPfbImportRequests,
    // BioData Catalyst
    ...biodataCatalystPfbImportRequests,
    // Protected TDR snapshots
    protectedGcpTdrSnapshotImportRequest,
    protectedGcpTdrSnapshotReferenceImportRequest,
  ];

  const unprotectedImports: ImportRequest[] = [
    genericPfbImportRequest,
    { type: 'entities', url: new URL('https://example.com/file.json') },
    gcpTdrSnapshotImportRequest,
    gcpTdrSnapshotReferenceImportRequest,
  ];

  describe('isProtectedSource', () => {
    it.each(protectedImports)('$url should be protected', (importRequest) => {
      expect(isProtectedSource(importRequest)).toBe(true);
    });

    it.each(unprotectedImports)('$url should not be protected', (importRequest) => {
      expect(isProtectedSource(importRequest)).toBe(false);
    });
  });
});
