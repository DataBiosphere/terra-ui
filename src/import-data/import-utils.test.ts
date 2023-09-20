import { WorkspaceWrapper } from 'src/libs/workspace-utils';
import { makeAzureWorkspace, makeGoogleWorkspace } from 'src/testing/workspace-fixtures';

import { canImportIntoWorkspace } from './import-utils';

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
});
