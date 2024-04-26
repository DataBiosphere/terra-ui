import { azureRegions } from 'src/libs/azure-regions';
import { azureProtectedDataBillingProject } from 'src/testing/billing-project-fixtures';
import {
  defaultAzureWorkspace,
  defaultGoogleWorkspace,
  groupConstraintPolicy,
  protectedAzureWorkspace,
  protectedDataPolicy,
  regionRestrictedAzureWorkspace,
} from 'src/testing/workspace-fixtures';

import {
  AzureWorkspace,
  canEditWorkspace,
  canRunAnalysisInWorkspace,
  getPolicyDescriptions,
  getRegionConstraintLabels,
  getWorkspaceAnalysisControlProps,
  getWorkspaceEditControlProps,
  groupConstraintLabel,
  groupConstraintMessage,
  hasGroupConstraintPolicy,
  hasPhiTrackingPolicy,
  hasRegionConstraintPolicy,
  isProtectedWorkspace,
  isValidWsExportTarget,
  phiTrackingLabel,
  phiTrackingMessage,
  phiTrackingPolicy,
  protectedDataLabel,
  protectedDataMessage,
  regionConstraintLabel,
  regionConstraintMessage,
  WorkspaceAccessLevel,
  WorkspacePolicy,
  WorkspaceWrapper,
} from './utils';

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

describe('getPolicyDescriptions', () => {
  it('Returns policy information for a protected and group-constrained workspace with phi tracking enabled', () => {
    const workspace: WorkspaceWrapper = {
      ...defaultAzureWorkspace,
      policies: [protectedDataPolicy, groupConstraintPolicy, phiTrackingPolicy],
    };
    expect(getPolicyDescriptions(workspace)).toEqual([
      { shortDescription: protectedDataLabel, longDescription: protectedDataMessage },
      { shortDescription: groupConstraintLabel, longDescription: groupConstraintMessage },
      { shortDescription: phiTrackingLabel, longDescription: phiTrackingMessage },
    ]);
  });

  it('Returns policy information for a region-constrained workspace', () => {
    expect(getPolicyDescriptions(regionRestrictedAzureWorkspace)).toEqual([
      {
        shortDescription: regionConstraintLabel,
        longDescription: regionConstraintMessage(regionRestrictedAzureWorkspace),
      },
    ]);
  });

  it('ignores other policies', () => {
    const workspaceWithOtherPolicy: AzureWorkspace = {
      ...defaultAzureWorkspace,
      policies: [
        {
          additionalData: [],
          namespace: 'terra',
          name: 'some-other-policy',
        },
      ],
    };
    expect(getPolicyDescriptions(workspaceWithOtherPolicy)).toEqual([]);
  });

  it('Returns policy information from a protected billing project', () => {
    expect(getPolicyDescriptions(undefined, azureProtectedDataBillingProject)).toEqual([
      { shortDescription: protectedDataLabel, longDescription: protectedDataMessage },
    ]);
  });

  it('Returns an empty array for undefined inputs', () => {
    expect(getPolicyDescriptions(undefined, undefined)).toEqual([]);
  });

  it('Combines policy information from a billing project and a workspace', () => {
    const workspace: WorkspaceWrapper = {
      ...defaultAzureWorkspace,
      policies: [protectedDataPolicy, groupConstraintPolicy],
    };
    expect(getPolicyDescriptions(workspace, azureProtectedDataBillingProject)).toEqual([
      { shortDescription: protectedDataLabel, longDescription: protectedDataMessage },
      { shortDescription: groupConstraintLabel, longDescription: groupConstraintMessage },
    ]);
  });
});

describe('isProtectedWorkspace', () => {
  const unprotectedWorkspaces = [defaultAzureWorkspace, defaultGoogleWorkspace];

  it.each(unprotectedWorkspaces)('%o should not be protected', (workspace) => {
    expect(isProtectedWorkspace(workspace)).toBe(false);
  });

  it('should recognize a protected Azure workspace', () => {
    expect(isProtectedWorkspace(protectedAzureWorkspace)).toBe(true);
  });

  it('should require a "protected-data" policy for Azure workspaces', () => {
    const nonProtectedAzureWorkspace: AzureWorkspace = {
      ...defaultAzureWorkspace,
      policies: [
        {
          additionalData: [],
          namespace: 'terra',
          name: 'some-other-policy',
        },
      ],
    };

    expect(isProtectedWorkspace(nonProtectedAzureWorkspace)).toBe(false);
  });

  it('should recognize a protected Google workspace', () => {
    const protectedWorkspace = { ...defaultGoogleWorkspace };
    protectedWorkspace.workspace.bucketName = `fc-secure-${defaultGoogleWorkspace.workspace.bucketName}`;

    expect(isProtectedWorkspace(protectedWorkspace)).toBe(true);
  });
});

describe('hasRegionConstraint', () => {
  it('Returns true if region-constraint policy exists, and the regions can be obtained', () => {
    expect(hasRegionConstraintPolicy(regionRestrictedAzureWorkspace)).toBe(true);
    expect(getRegionConstraintLabels(regionRestrictedAzureWorkspace.policies).length).toBe(3);
    expect(getRegionConstraintLabels(regionRestrictedAzureWorkspace.policies)).toContain(azureRegions.eastus.label);
    expect(getRegionConstraintLabels(regionRestrictedAzureWorkspace.policies)).toContain(azureRegions.westus2.label);
    expect(getRegionConstraintLabels(regionRestrictedAzureWorkspace.policies)).toContain('unknownRegion');
  });

  it('Returns false if region-constraint policy does not exist', () => {
    expect(hasRegionConstraintPolicy(defaultAzureWorkspace)).toBe(false);
    expect(getRegionConstraintLabels(defaultAzureWorkspace.policies).length).toBe(0);

    expect(hasRegionConstraintPolicy(protectedAzureWorkspace)).toBe(false);
    expect(getRegionConstraintLabels(protectedAzureWorkspace.policies).length).toBe(0);
  });
});

describe('hasPhiTrackingPolicy', () => {
  it('Returns true if PHI tracking policy exists', () => {
    const workspace: WorkspaceWrapper = {
      ...defaultAzureWorkspace,
      policies: [phiTrackingPolicy],
    };
    expect(hasPhiTrackingPolicy(workspace)).toBe(true);
  });

  it('Returns false if PHI tracking policy does not exist', () => {
    expect(hasPhiTrackingPolicy(defaultAzureWorkspace)).toBe(false);

    const workspaceMissingAdditionalData: WorkspaceWrapper = {
      ...defaultAzureWorkspace,
      policies: [
        {
          namespace: phiTrackingPolicy.namespace,
          name: phiTrackingPolicy.name,
          additionalData: [], // missing phi dataType
        },
      ],
    };
    expect(hasPhiTrackingPolicy(workspaceMissingAdditionalData)).toBe(false);

    const workspaceWithWrongDataType: WorkspaceWrapper = {
      ...defaultAzureWorkspace,
      policies: [
        {
          namespace: phiTrackingPolicy.namespace,
          name: phiTrackingPolicy.name,
          additionalData: [{ dataType: 'NOT_PHI' }],
        },
      ],
    };
    expect(hasPhiTrackingPolicy(workspaceWithWrongDataType)).toBe(false);
  });
});

describe('hasDataAccessControls', () => {
  it.each([
    { policies: [], expectedResult: false },
    {
      polices: [protectedDataPolicy],
      expectedResult: false,
    },
    {
      policies: [groupConstraintPolicy],
      expectedResult: true,
    },
  ] as { policies: WorkspacePolicy[]; expectedResult: boolean }[])(
    'returns true if workspace has at least one group constraint policy',
    ({ policies, expectedResult }) => {
      // Arrange
      const workspace: WorkspaceWrapper = { ...defaultAzureWorkspace, policies };

      // Act
      const result = hasGroupConstraintPolicy(workspace);

      // Assert
      expect(result).toBe(expectedResult);
    }
  );
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

describe('canRunAnalysisInWorkspace', () => {
  it('returns false if the user cannot compute in the workspace', () => {
    // Act
    const result = canRunAnalysisInWorkspace({
      canCompute: false,
      workspace: { isLocked: false },
    });

    // Assert
    expect(result).toEqual({ value: false, message: 'You do not have access to run analyses on this workspace.' });
  });

  it('returns false if the workspace is locked', () => {
    // Act
    const result = canRunAnalysisInWorkspace({
      canCompute: true,
      workspace: { isLocked: true },
    });

    // Assert
    expect(result).toEqual({ value: false, message: 'This workspace is locked.' });
  });

  it('returns true otherwise', () => {
    // Act
    const result = canRunAnalysisInWorkspace({
      canCompute: true,
      workspace: { isLocked: false },
    });

    // Assert
    expect(result).toEqual({ value: true, message: undefined });
  });
});

describe('getWorkspaceAnalysisControlProps', () => {
  it('adds no props when analysis is enabled', () => {
    // Act
    const props = {
      tooltip: 'This is a control',
      ...getWorkspaceAnalysisControlProps({ canCompute: true, workspace: { isLocked: false } }),
    };

    // Assert
    expect(props).toEqual({ tooltip: 'This is a control' });
  });

  it('disables the control and adds a tooltip when the user cannot run analyses in the workspace', () => {
    // Act
    const props = {
      tooltip: 'This is a control',
      ...getWorkspaceAnalysisControlProps({ canCompute: false, workspace: { isLocked: false } }),
    };

    // Assert
    expect(props).toEqual({ disabled: true, tooltip: 'You do not have access to run analyses on this workspace.' });
  });
});
