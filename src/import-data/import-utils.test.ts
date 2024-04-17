import { makeAzureWorkspace, makeGoogleWorkspace } from 'src/testing/workspace-fixtures';
import { CloudProvider, WorkspaceWrapper } from 'src/workspaces/utils';

import { ImportRequest } from './import-types';
import { canImportIntoWorkspace, getCloudPlatformRequiredForImport } from './import-utils';

describe('getRequiredCloudPlatformForImport', () => {
  it.each([
    {
      importRequest: { type: 'pfb', url: new URL('https://example.com/path/to/file.pfb') },
      expectedCloudPlatform: 'GCP',
    },
    {
      importRequest: {
        type: 'tdr-snapshot-export',
        manifestUrl: new URL('https://example.com/path/to/manifest.json'),
        snapshot: {
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
        },
        syncPermissions: false,
      },
      expectedCloudPlatform: 'GCP',
    },
  ] as {
    importRequest: ImportRequest;
    expectedCloudPlatform: CloudProvider | undefined;
  }[])('returns cloud platform required for import', async ({ importRequest, expectedCloudPlatform }) => {
    // Act
    const cloudPlatform = getCloudPlatformRequiredForImport(importRequest);

    // Assert
    expect(cloudPlatform).toEqual(expectedCloudPlatform);
  });
});

describe('canImportIntoWorkspace', () => {
  it('requires permission to write to the workspace', () => {
    // Arrange
    const ownedWorkspace = makeAzureWorkspace({ accessLevel: 'OWNER' });
    const writableWorkspace = makeAzureWorkspace({ accessLevel: 'WRITER' });
    const readOnlyWorkspace = makeAzureWorkspace({ accessLevel: 'READER' });

    const canImportUnprotectedDataIntoWorkspace = (workspace: WorkspaceWrapper) =>
      canImportIntoWorkspace({ isProtectedData: false }, workspace);

    // Act
    const canImportIntoOwnedWorkspace = canImportUnprotectedDataIntoWorkspace(ownedWorkspace);
    const canImportIntoWritableWorkspace = canImportUnprotectedDataIntoWorkspace(writableWorkspace);
    const canImportIntoReadOnlyWorkspace = canImportUnprotectedDataIntoWorkspace(readOnlyWorkspace);

    // Assert
    expect(canImportIntoOwnedWorkspace).toBe(true);
    expect(canImportIntoWritableWorkspace).toBe(true);
    expect(canImportIntoReadOnlyWorkspace).toBe(false);
  });

  it('requires a protected workspace for protected data', () => {
    // Arrange
    const unprotectedAzureWorkspace = makeAzureWorkspace();

    const protectedGoogleWorkspace = makeGoogleWorkspace({
      workspace: { bucketName: 'fc-secure-00001111-2222-3333-aaaa-bbbbccccdddd' },
    });

    const unprotectedGoogleWorkspace = makeGoogleWorkspace();

    const canImportProtectedDataIntoWorkspace = (workspace: WorkspaceWrapper) =>
      canImportIntoWorkspace({ isProtectedData: true }, workspace);

    // Act
    const canImportProtectedDataIntoUnprotectedAzureWorkspace =
      canImportProtectedDataIntoWorkspace(unprotectedAzureWorkspace);

    const canImportProtectedDataIntoProtectedGoogleWorkspace =
      canImportProtectedDataIntoWorkspace(protectedGoogleWorkspace);

    const canImportProtectedDataIntoUnprotectedGoogleWorkspace =
      canImportProtectedDataIntoWorkspace(unprotectedGoogleWorkspace);

    // Assert
    expect(canImportProtectedDataIntoUnprotectedAzureWorkspace).toBe(false);
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
    const canImportProtectedDataIntoProtectedPublicWorkspace = canImportIntoWorkspace(
      { isProtectedData: true },
      protectedPublicGoogleWorkspace
    );

    // Assert
    expect(canImportProtectedDataIntoProtectedPublicWorkspace).toBe(false);
  });

  it('can require an authorization domain', () => {
    // Arrange
    const requiredAuthDomain = 'test-ad';

    const workspaceWithRequiredAuthDomain = makeAzureWorkspace({
      workspace: { authorizationDomain: [{ membersGroupName: requiredAuthDomain }] },
    });

    const workspaceWithoutRequiredAuthDomain = makeAzureWorkspace();

    const canImportDataWithRequiredAuthDomainIntoWorkspace = (workspace: WorkspaceWrapper) =>
      canImportIntoWorkspace(
        {
          isProtectedData: false,
          requiredAuthorizationDomain: requiredAuthDomain,
        },
        workspace
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
    const workspaces = [
      makeAzureWorkspace({ workspace: { name: 'azure-workspace' } }),
      makeGoogleWorkspace({ workspace: { name: 'google-workspace' } }),
    ];

    // Act
    const workspacesForAzureImports = workspaces
      .filter((workspace) => canImportIntoWorkspace({ cloudPlatform: 'AZURE', isProtectedData: false }, workspace))
      .map((workspace) => workspace.workspace.name);

    const workspacesForGoogleImports = workspaces
      .filter((workspace) => canImportIntoWorkspace({ cloudPlatform: 'GCP', isProtectedData: false }, workspace))
      .map((workspace) => workspace.workspace.name);

    const workspacesForUndefinedPlatformImports = workspaces
      .filter((workspace) => canImportIntoWorkspace({ isProtectedData: false }, workspace))
      .map((workspace) => workspace.workspace.name);

    // Assert
    expect(workspacesForAzureImports).toEqual(['azure-workspace']);
    expect(workspacesForGoogleImports).toEqual(['google-workspace']);
    expect(workspacesForUndefinedPlatformImports).toEqual(['azure-workspace', 'google-workspace']);
  });
});
