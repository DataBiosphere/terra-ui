import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/analysis/_testData/testData';

import { isValidWsExportTarget, WorkspaceWrapper } from './workspace-utils';

describe('isValidWsExportTarget', () => {
  it('Returns true because source and dest workspaces are the same', () => {
    // Arrange
    const sourceWs: WorkspaceWrapper = {
      ...defaultGoogleWorkspace,
      workspace: {
        ...defaultGoogleWorkspace.workspace,
        authorizationDomain: [],
      },
    };

    const destWs: WorkspaceWrapper = {
      ...defaultGoogleWorkspace,
      workspace: {
        ...defaultGoogleWorkspace.workspace,
        workspaceId: 'test-different-workspace-id',
        authorizationDomain: [],
      },
    };

    // Act
    const result = isValidWsExportTarget(sourceWs, destWs);

    // Assert
    expect(result).toBe(true);
  });

  it('Returns false match because source and dest workspaces are the same', () => {
    // Arrange
    const sourceWs = defaultGoogleWorkspace;
    const destWs = defaultGoogleWorkspace;

    // Act
    const result = isValidWsExportTarget(sourceWs, destWs);

    // Assert
    expect(result).toBe(false);
  });

  it('Returns false because AccessLevel does not contain Writer', () => {
    // Arrange
    const sourceWs = defaultGoogleWorkspace;
    const destWs: WorkspaceWrapper = {
      ...defaultGoogleWorkspace,
      accessLevel: 'READER',
      workspace: {
        ...defaultGoogleWorkspace.workspace,
        workspaceId: 'test-different-workspace-id',
      },
    };

    // Act
    const result = isValidWsExportTarget(sourceWs, destWs);

    // Assert
    expect(result).toBe(false);
  });

  it('Returns false because source and destination cloud platforms are not the same.', () => {
    // Arrange
    const sourceWs: WorkspaceWrapper = {
      ...defaultGoogleWorkspace,
      workspace: {
        ...defaultGoogleWorkspace.workspace,
        authorizationDomain: [],
      },
    };

    const destWs: WorkspaceWrapper = {
      ...defaultAzureWorkspace,
      workspace: {
        ...defaultAzureWorkspace.workspace,
        authorizationDomain: [],
      },
    };

    // Act
    const result = isValidWsExportTarget(sourceWs, destWs);

    // Assert
    expect(result).toBe(false);
  });

  it('Returns false because source and destination authorization domains are not the same.', () => {
    // Arrange
    const sourceWs: WorkspaceWrapper = {
      ...defaultGoogleWorkspace,
      workspace: {
        ...defaultGoogleWorkspace.workspace,
        authorizationDomain: [{ membersGroupName: 'auth-domain' }],
      },
    };

    const destWs: WorkspaceWrapper = {
      ...defaultGoogleWorkspace,
      workspace: {
        ...defaultGoogleWorkspace.workspace,
        authorizationDomain: [{ membersGroupName: 'wooo' }],
        workspaceId: 'test-different-workspace-id',
      },
    };

    // Act
    const result = isValidWsExportTarget(sourceWs, destWs);

    // Assert
    expect(result).toBe(false);
  });
});
