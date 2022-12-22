import { extractBillingDetails, extractCrossWorkspaceDetails, extractWorkspaceDetails } from 'src/libs/events'


const gcpWorkspace = {
  workspace: {
    cloudPlatform: 'Gcp',
    name: 'wsName',
    namespace: 'wsNamespace',
    workspaceId: 'testGoogleWorkspaceId'
  },
  accessLevel: 'OWNER',
  canShare: true,
  canCompute: true
}

const azureWorkspace = {
  workspace: {
    cloudPlatform: 'Azure',
    name: 'azName',
    namespace: 'azNamespace',
    workspaceId: 'azWorkspaceId'
  },
  accessLevel: 'OWNER',
  canShare: true,
  canCompute: true
}

describe('extractWorkspaceDetails', () => {
  it('Handles properties at top level, converts cloudPlatform to upper case', () => {
    expect(extractWorkspaceDetails({ name: 'wsName', namespace: 'wsNamespace', cloudPlatform: 'wsCloudPlatform' })).toEqual(
      { workspaceName: 'wsName', workspaceNamespace: 'wsNamespace', workspaceCloudPlatform: 'WSCLOUDPLATFORM' }
    )
  })

  it('Does not include cloud platform if undefined', () => {
    expect(extractWorkspaceDetails({ name: 'wsName', namespace: 'wsNamespace' })).toEqual(
      { workspaceName: 'wsName', workspaceNamespace: 'wsNamespace' }
    )
  })

  it('Handles nested workspace details (like from workspace object)', () => {
    expect(extractWorkspaceDetails(gcpWorkspace)).toEqual(
      { workspaceName: 'wsName', workspaceNamespace: 'wsNamespace', workspaceCloudPlatform: 'GCP' }
    )
  })
})

describe('extractCrossWorkspaceDetails', () => {
  it('Extracts name, namespace, and upper-cased cloudPlatform', () => {
    expect(extractCrossWorkspaceDetails(gcpWorkspace, azureWorkspace)).toEqual({
      fromWorkspaceNamespace: 'wsNamespace',
      fromWorkspaceName: 'wsName',
      fromWorkspaceCloudPlatform: 'GCP',
      toWorkspaceNamespace: 'azNamespace',
      toWorkspaceName: 'azName',
      toWorkspaceCloudPlatform: 'AZURE'
    })
  })
})

describe('extractBillingDetails', () => {
  it('Extracts billing project name and cloudPlatform (as upper case)', () => {
    expect(extractBillingDetails({ projectName: 'projectName', cloudPlatform: 'cloudPlatform' })).toEqual(
      { billingProjectName: 'projectName', cloudPlatform: 'CLOUDPLATFORM' }
    )
  })
})
