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
import { getRequiredCloudPlatform, requiresSecurityMonitoring } from './import-requirements';
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

describe('security monitoring requirements', () => {
  const importsExpectedToRequireSecurityMonitoring: ImportRequest[] = [
    // AnVIL
    ...anvilPfbImportRequests,
    // BioData Catalyst
    ...biodataCatalystPfbImportRequests,
    // Protected TDR snapshots
    protectedGcpTdrSnapshotImportRequest,
    protectedGcpTdrSnapshotReferenceImportRequest,
  ];

  const importsExpectedToNotRequireSecurityMonitoring: ImportRequest[] = [
    genericPfbImportRequest,
    { type: 'entities', url: new URL('https://example.com/file.json') },
    gcpTdrSnapshotImportRequest,
    gcpTdrSnapshotReferenceImportRequest,
  ];

  describe('isProtectedSource', () => {
    it.each(importsExpectedToRequireSecurityMonitoring)('$url should require security monitoring', (importRequest) => {
      // Act
      const importRequiresSecurityMonitoring = requiresSecurityMonitoring(importRequest);

      // Assert
      expect(importRequiresSecurityMonitoring).toBe(true);
    });

    it.each(importsExpectedToNotRequireSecurityMonitoring)(
      '$url should not require security monitoring',
      (importRequest) => {
        // Act
        const importRequiresSecurityMonitoring = requiresSecurityMonitoring(importRequest);

        // Assert
        expect(importRequiresSecurityMonitoring).toBe(false);
      }
    );
  });
});
