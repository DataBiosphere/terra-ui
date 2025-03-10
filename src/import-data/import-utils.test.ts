import { makeGoogleProtectedWorkspace, makeGoogleWorkspace } from 'src/testing/workspace-fixtures';

import {
  anvilPfbImportRequests,
  gcpTdrSnapshotImportRequest,
  protectedGcpTdrSnapshotImportRequest,
} from './__fixtures__/import-request-fixtures';
import { ImportRequest } from './import-types';
import { buildDestinationWorkspaceFilter } from './import-utils';

describe('canImportIntoWorkspace', () => {
  it('requires a protected workspace for protected data', () => {
    // Arrange
    const protectedGoogleWorkspace = makeGoogleWorkspace({
      workspace: { bucketName: 'fc-secure-00001111-2222-3333-aaaa-bbbbccccdddd' },
    });

    const unprotectedGoogleWorkspace = makeGoogleWorkspace();

    const canImportProtectedDataIntoWorkspace = buildDestinationWorkspaceFilter(protectedGcpTdrSnapshotImportRequest);

    // Act
    const canImportProtectedDataIntoProtectedGoogleWorkspace =
      canImportProtectedDataIntoWorkspace(protectedGoogleWorkspace);

    const canImportProtectedDataIntoUnprotectedGoogleWorkspace =
      canImportProtectedDataIntoWorkspace(unprotectedGoogleWorkspace);

    // Assert
    expect(canImportProtectedDataIntoProtectedGoogleWorkspace).toBe(true);
    expect(canImportProtectedDataIntoUnprotectedGoogleWorkspace).toBe(false);
  });

  it('requires a non-public workspace for protected data', () => {
    // Arrange
    const protectedPublicGoogleWorkspace = makeGoogleWorkspace({
      workspace: { bucketName: 'fc-secure-00001111-2222-3333-aaaa-bbbbccccdddd' },
      public: true,
    });

    // Act
    const canImportProtectedDataIntoProtectedPublicWorkspace = buildDestinationWorkspaceFilter(
      protectedGcpTdrSnapshotImportRequest
    )(protectedPublicGoogleWorkspace);

    // Assert
    expect(canImportProtectedDataIntoProtectedPublicWorkspace).toBe(false);
  });

  it('can require an authorization domain', () => {
    // Arrange
    const requiredAuthorizationDomain = 'test-ad';

    const workspaceWithRequiredAuthDomain = makeGoogleWorkspace({
      workspace: { authorizationDomain: [{ membersGroupName: requiredAuthorizationDomain }] },
    });

    const workspaceWithoutRequiredAuthDomain = makeGoogleWorkspace();

    const canImportDataWithRequiredAuthDomainIntoWorkspace = buildDestinationWorkspaceFilter(
      gcpTdrSnapshotImportRequest,
      {
        requiredAuthorizationDomain,
      }
    );

    // Act
    const canImportDataWithRequiredAuthDomainIntoWorkspaceWithRequiredAuthDomain =
      canImportDataWithRequiredAuthDomainIntoWorkspace(workspaceWithRequiredAuthDomain);

    const canImportDataWithRequiredAuthDomainIntoWorkspaceWithoutRequiredAuthDomain =
      canImportDataWithRequiredAuthDomainIntoWorkspace(workspaceWithoutRequiredAuthDomain);

    // Assert
    expect(canImportDataWithRequiredAuthDomainIntoWorkspaceWithRequiredAuthDomain).toBe(true);
    expect(canImportDataWithRequiredAuthDomainIntoWorkspaceWithoutRequiredAuthDomain).toBe(false);
  });

  it('can require a cloud platform', () => {
    // Arrange
    const workspaces = [makeGoogleWorkspace({ workspace: { name: 'google-workspace' } })];

    // Act
    const workspacesForGoogleImports = workspaces
      .filter(buildDestinationWorkspaceFilter(gcpTdrSnapshotImportRequest))
      .map((workspace) => workspace.workspace.name);

    // Assert
    expect(workspacesForGoogleImports).toEqual(['google-workspace']);
  });

  it.each([{ importRequest: anvilPfbImportRequests[0] }] as { importRequest: ImportRequest }[])(
    'requires owner permission for imports that could update access controls',
    ({ importRequest }) => {
      // Arrange
      const ownedWorkspace = makeGoogleProtectedWorkspace({ accessLevel: 'OWNER' });
      const writableWorkspace = makeGoogleProtectedWorkspace({ accessLevel: 'WRITER' });
      const readOnlyWorkspace = makeGoogleProtectedWorkspace({ accessLevel: 'READER' });

      const canImportAnvilDataIntoWorkspace = buildDestinationWorkspaceFilter(importRequest);

      // Act/Assert
      expect(canImportAnvilDataIntoWorkspace(ownedWorkspace)).toBe(true);
      expect(canImportAnvilDataIntoWorkspace(writableWorkspace)).toBe(false);
      expect(canImportAnvilDataIntoWorkspace(readOnlyWorkspace)).toBe(false);
    }
  );
});
