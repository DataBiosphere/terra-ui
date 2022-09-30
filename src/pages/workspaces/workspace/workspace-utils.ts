export type CloudProviderType = 'AZURE' | 'GCP'
export const cloudProviderTypes: Record<CloudProviderType, CloudProviderType> = {
  AZURE: 'AZURE',
  GCP: 'GCP'
}
export const isCloudProvider = (x: unknown): x is CloudProviderType => {
  return x as string in cloudProviderTypes
}

export interface BaseWorkspaceInfo {
  namespace: string
  name: string
  workspaceId: string
  cloudPlatform: string
}

export interface AzureWorkspaceInfo extends BaseWorkspaceInfo {}

export interface GoogleWorkspaceInfo extends BaseWorkspaceInfo {
  googleProject: string
  bucketName: string
}

export type WorkspaceInfo = AzureWorkspaceInfo | GoogleWorkspaceInfo

export const isGoogleWorkspaceInfo = (workspace: WorkspaceInfo): workspace is GoogleWorkspaceInfo => {
  return !!((workspace as GoogleWorkspaceInfo).googleProject)
}

export interface BaseWorkspaceWrapper {
  accessLevel: string,
  canShare: boolean,
  canCompute: boolean,
  workspace: WorkspaceInfo
}

export interface AzureWorkspaceWrapper extends BaseWorkspaceWrapper {
  azureContext: any
}

export interface GoogleWorkspaceWrapper extends BaseWorkspaceWrapper {}

export type WorkspaceWrapper = GoogleWorkspaceWrapper | AzureWorkspaceWrapper
