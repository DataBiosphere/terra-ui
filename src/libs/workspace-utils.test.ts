import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/analysis/_testData/testData';

import { isValidWsExportTarget } from './workspace-utils';

describe('isValidWsExportTarget', () => {
  it('Returns true because source and dest workspaces are the same', () => {
    // Arrange
    const sourceWs = {
      ...defaultGoogleWorkspace,
      workspace: {
        ...defaultGoogleWorkspace,
        authorizationDomain: [{}],
      },
    };

    const destWs = {
      ...defaultGoogleWorkspace,
      workspace: {
        ...defaultGoogleWorkspace.workspace,
        workspaceId: 'test-different-workspace-id',
        authorizationDomain: [{}],
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
    const destWs = {
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
    const sourceWs = {
      ...defaultGoogleWorkspace,
      workspace: {
        ...defaultGoogleWorkspace.workspace,
        authorizationDomain: [{}],
      },
    };

    const destWs = {
      ...defaultAzureWorkspace,
      workspace: {
        ...defaultAzureWorkspace.workspace,
        authorizationDomain: [{}],
      },
    };

    // Act
    const result = isValidWsExportTarget(sourceWs, destWs);

    // Assert
    expect(result).toBe(false);
  });

  it('Returns false because source and destination cloud platforms are not the same.', () => {
    // Arrange
    const sourceWs = {
      ...defaultGoogleWorkspace,
      workspace: {
        ...defaultGoogleWorkspace.workspace,
        authorizationDomain: [{}],
      },
    };

    const destWs = {
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
