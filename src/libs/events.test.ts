import { DeepPartial } from '@terra-ui-packages/core-utils';
import { WorkspaceWrapper } from 'src/libs/workspace-utils';

import { extractBillingDetails, extractCrossWorkspaceDetails, extractWorkspaceDetails } from './events';

const gcpWorkspace = {
  workspace: {
    cloudPlatform: 'Gcp',
    name: 'wsName',
    namespace: 'wsNamespace',
    workspaceId: 'testGoogleWorkspaceId',
  },
  accessLevel: 'OWNER',
  canShare: true,
  canCompute: true,
} as const satisfies DeepPartial<WorkspaceWrapper>;

const azureWorkspace = {
  workspace: {
    cloudPlatform: 'Azure',
    name: 'azName',
    namespace: 'azNamespace',
    workspaceId: 'azWorkspaceId',
  },
  accessLevel: 'OWNER',
  canShare: true,
  canCompute: true,
} as const satisfies DeepPartial<WorkspaceWrapper>;

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
    const workspaceDetails = extractWorkspaceDetails(gcpWorkspace);

    // Assert
    expect(workspaceDetails).toEqual({
      workspaceName: 'wsName',
      workspaceNamespace: 'wsNamespace',
      cloudPlatform: 'GCP',
      hasProtectedData: undefined,
    });
  });
});

describe('extractCrossWorkspaceDetails', () => {
  it('Extracts name, namespace, and upper-cased cloudPlatform', () => {
    // Act
    const crossWorkspaceDetails = extractCrossWorkspaceDetails(gcpWorkspace, azureWorkspace);

    // Assert
    expect(crossWorkspaceDetails).toEqual({
      fromWorkspaceNamespace: 'wsNamespace',
      fromWorkspaceName: 'wsName',
      fromWorkspaceCloudPlatform: 'GCP',
      toWorkspaceNamespace: 'azNamespace',
      toWorkspaceName: 'azName',
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
