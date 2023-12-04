import { defaultAzureWorkspace, defaultGoogleWorkspace, protectedAzureWorkspace } from 'src/testing/workspace-fixtures';

import { extractBillingDetails, extractCrossWorkspaceDetails, extractWorkspaceDetails } from './events';

describe('extractWorkspaceDetails', () => {
  it('Handles properties at top level, converts cloudPlatform to upper case', () => {
    // Act
    const workspaceDetails = extractWorkspaceDetails({
      name: 'wsName',
      namespace: 'wsNamespace',
      cloudPlatform: 'Gcp',
    });

    // Assert
    expect(workspaceDetails).toEqual({
      workspaceName: 'wsName',
      workspaceNamespace: 'wsNamespace',
      cloudPlatform: 'GCP',
      hasProtectedData: undefined,
    });
  });

  it('Does not include cloud platform if undefined', () => {
    // Act
    const workspaceDetails = extractWorkspaceDetails({ name: 'wsName', namespace: 'wsNamespace' });

    // Assert
    expect(workspaceDetails.cloudPlatform).toBeUndefined();
  });

  it('Handles nested workspace details (like from workspace object)', () => {
    // Act
    const workspaceDetails = extractWorkspaceDetails(defaultGoogleWorkspace);

    // Assert
    expect(workspaceDetails).toEqual({
      workspaceName: defaultGoogleWorkspace.workspace.name,
      workspaceNamespace: defaultGoogleWorkspace.workspace.namespace,
      cloudPlatform: 'GCP',
      hasProtectedData: false,
      workspaceAccessLevel: 'OWNER',
    });
  });

  it('Determine hasProtectedData based on workspace.policies', () => {
    // Act
    const workspaceDetails = extractWorkspaceDetails(protectedAzureWorkspace);

    // Assert
    expect(workspaceDetails).toEqual({
      workspaceName: protectedAzureWorkspace.workspace.name,
      workspaceNamespace: protectedAzureWorkspace.workspace.namespace,
      cloudPlatform: 'AZURE',
      hasProtectedData: true,
      workspaceAccessLevel: 'OWNER',
    });
  });
});

describe('extractCrossWorkspaceDetails', () => {
  it('Extracts name, namespace, and upper-cased cloudPlatform', () => {
    // Act
    const crossWorkspaceDetails = extractCrossWorkspaceDetails(defaultGoogleWorkspace, defaultAzureWorkspace);

    // Assert
    expect(crossWorkspaceDetails).toEqual({
      fromWorkspaceNamespace: defaultGoogleWorkspace.workspace.namespace,
      fromWorkspaceName: defaultGoogleWorkspace.workspace.name,
      fromWorkspaceCloudPlatform: 'GCP',
      toWorkspaceNamespace: defaultAzureWorkspace.workspace.namespace,
      toWorkspaceName: defaultAzureWorkspace.workspace.name,
      toWorkspaceCloudPlatform: 'AZURE',
    });
  });
});

describe('extractBillingDetails', () => {
  it('Extracts billing project name and cloudPlatform (as upper case)', () => {
    // Act
    const billingDetails = extractBillingDetails({ projectName: 'projectName', cloudPlatform: 'cloudPlatform' });

    // Assert
    expect(billingDetails).toEqual({
      billingProjectName: 'projectName',
      cloudPlatform: 'CLOUDPLATFORM',
    });
  });
});
