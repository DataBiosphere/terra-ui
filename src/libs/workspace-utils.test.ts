import { azureRegions } from 'src/libs/azure-regions';
import {
  defaultAzureWorkspace,
  defaultGoogleWorkspace,
  protectedAzureWorkspace,
  regionRestrictedAzureWorkspace,
} from 'src/testing/workspace-fixtures';

import {
  canEditWorkspace,
  getRegionConstraintLabels,
  getWorkspaceEditControlProps,
  hasProtectedData,
  hasRegionConstraint,
  isValidWsExportTarget,
  WorkspaceAccessLevel,
  WorkspaceWrapper,
} from './workspace-utils';

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

describe('hasProtectedData', () => {
  it('Returns true if protected-data policy exists', () => {
    expect(hasProtectedData(protectedAzureWorkspace)).toBe(true);
  });

  it('Returns false if protected-data policy does not exist', () => {
    expect(hasProtectedData(defaultAzureWorkspace)).toBe(false);
    expect(hasProtectedData(defaultGoogleWorkspace)).toBe(false);
  });
});

describe('hasRegionConstraint', () => {
  it('Returns true if region-constraint policy exists, and the regions can be obtained', () => {
    expect(hasRegionConstraint(regionRestrictedAzureWorkspace)).toBe(true);
    expect(getRegionConstraintLabels(regionRestrictedAzureWorkspace.policies).length).toBe(3);
    expect(getRegionConstraintLabels(regionRestrictedAzureWorkspace.policies)).toContain(azureRegions.eastus.label);
    expect(getRegionConstraintLabels(regionRestrictedAzureWorkspace.policies)).toContain(azureRegions.westus2.label);
    expect(getRegionConstraintLabels(regionRestrictedAzureWorkspace.policies)).toContain('unknownRegion');
  });

  it('Returns false if region-constraint policy does not exist', () => {
    expect(hasRegionConstraint(defaultAzureWorkspace)).toBe(false);
    expect(getRegionConstraintLabels(defaultAzureWorkspace.policies).length).toBe(0);

    expect(hasRegionConstraint(protectedAzureWorkspace)).toBe(false);
    expect(getRegionConstraintLabels(protectedAzureWorkspace.policies).length).toBe(0);
  });
});

describe('canEditWorkspace', () => {
  it.each(['WRITER', 'OWNER'] as WorkspaceAccessLevel[])(
    'Returns true if passed parameters permit editing.',
    (accessLevel) => {
      // Act
      const result = canEditWorkspace({ accessLevel, workspace: { isLocked: false } });

      // Assert
      expect(result).toStrictEqual({ value: true });
    }
  );
  it.each(['WRITER', 'OWNER'] as WorkspaceAccessLevel[])(
    'Returns false with a locked message if passed parameters include locked.',
    (accessLevel) => {
      // Act
      const result = canEditWorkspace({ accessLevel, workspace: { isLocked: true } });

      // Assert
      expect(result).toStrictEqual({
        value: false,
        message: 'This workspace is locked.',
      });
    }
  );
  it('Returns false with a permissions message if passed parameters do not have the right access level.', () => {
    // Act
    const result = canEditWorkspace({ accessLevel: 'READER', workspace: { isLocked: false } });

    // Assert
    expect(result).toStrictEqual({
      value: false,
      message: 'You do not have permission to modify this workspace.',
    });
  });
  // Documenting incorrect behavior.
  it('Incorrectly provides one reason if multiple reasons apply.', () => {
    // Act
    const result = canEditWorkspace({ accessLevel: 'READER', workspace: { isLocked: true } });

    // Assert
    expect(result).toStrictEqual({
      value: false,
      message: 'You do not have permission to modify this workspace.',
    });
  });
});

describe('getWorkspaceEditControlProps', () => {
  it("Doesn't touch anything when editing should be enabled.", () => {
    // Act
    const result = {
      tooltip: 'foo',
      ...getWorkspaceEditControlProps({ accessLevel: 'WRITER', workspace: { isLocked: false } }),
    };

    // Assert
    expect(result).toStrictEqual({ tooltip: 'foo' });
  });
  it('Disables the control with a message when appropriate.', () => {
    // Act
    const result = {
      tooltip: 'foo',
      ...getWorkspaceEditControlProps({ accessLevel: 'WRITER', workspace: { isLocked: true } }),
    };

    // Assert
    expect(result).toStrictEqual({ disabled: true, tooltip: 'This workspace is locked.' });
  });
});
