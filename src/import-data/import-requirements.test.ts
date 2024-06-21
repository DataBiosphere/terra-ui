import { makeGoogleWorkspace } from 'src/testing/workspace-fixtures';
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
import {
  getRequiredCloudPlatform,
  importWillUpdateAccessControl,
  requiresSecurityMonitoring,
  sourceHasAccessControl,
} from './import-requirements';
import { ImportRequest, TDRSnapshotExportImportRequest } from './import-types';

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

describe('access control requirements', () => {
  describe('sourceHasAccessControl', () => {
    it('returns true for TDR snapshots with access controls', () => {
      // Act
      const hasAccessControl = sourceHasAccessControl({
        ...gcpTdrSnapshotImportRequest,
        snapshotAccessControls: ['example-group'],
      });

      // Assert
      expect(hasAccessControl).toBe(true);
    });

    it('returns undefined for AnVIL PFBs', () => {
      // Act
      const hasAccessControl = sourceHasAccessControl(anvilPfbImportRequests[0]);

      // Assert
      expect(hasAccessControl).toBe(undefined);
    });

    it.each([genericPfbImportRequest, gcpTdrSnapshotImportRequest, gcpTdrSnapshotReferenceImportRequest])(
      'returns false for data without access controls',
      (importRequest: ImportRequest) => {
        // Act
        const hasAccessControl = sourceHasAccessControl(importRequest);

        // Assert
        expect(hasAccessControl).toBe(false);
      }
    );
  });

  describe('importWillUpdateAccessControl', () => {
    describe('for TDR snapshots', () => {
      it('returns true if snapshot access control does not match workspace access control', () => {
        // Arrange
        const importRequest: TDRSnapshotExportImportRequest = {
          ...gcpTdrSnapshotImportRequest,
          snapshotAccessControls: ['example-group'],
        };

        const workspace = makeGoogleWorkspace();

        // Act
        const willUpdateAccessControl = importWillUpdateAccessControl(importRequest, workspace);

        // Assert
        expect(willUpdateAccessControl).toBe(true);
      });

      it('returns false if snapshot access control does match workspace access control', () => {
        // Arrange
        const importRequest: TDRSnapshotExportImportRequest = {
          ...gcpTdrSnapshotImportRequest,
          snapshotAccessControls: ['example-group'],
        };

        const workspace = makeGoogleWorkspace({
          workspace: {
            authorizationDomain: [{ membersGroupName: 'example-group' }],
          },
        });

        // Act
        const willUpdateAccessControl = importWillUpdateAccessControl(importRequest, workspace);

        // Assert
        expect(willUpdateAccessControl).toBe(false);
      });
    });

    it('returns undefined for AnVIL PFBs', () => {
      // Act
      const willUpdateAccessControl = importWillUpdateAccessControl(anvilPfbImportRequests[0], makeGoogleWorkspace());

      // Assert
      expect(willUpdateAccessControl).toBe(undefined);
    });

    it.each([genericPfbImportRequest, gcpTdrSnapshotImportRequest, gcpTdrSnapshotReferenceImportRequest])(
      'returns false for data without access controls',
      (importRequest: ImportRequest) => {
        // Act
        const willUpdateAccessControl = importWillUpdateAccessControl(importRequest, makeGoogleWorkspace());

        // Assert
        expect(willUpdateAccessControl).toBe(false);
      }
    );
  });
});
