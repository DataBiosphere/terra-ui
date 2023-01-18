
export type CloudPlatformType = 'AZURE' | 'GCP'
export const cloudPlatformTypes: Record<CloudPlatformType, CloudPlatformType> = {
  AZURE: 'AZURE',
  GCP: 'GCP'
}

export const cloudPlatformLabels: Record<CloudPlatformType, string> = {
  AZURE: 'Microsoft Azure',
  GCP: 'Google Cloud Platform',
}

export const isCloudPlatform = (x: unknown): x is CloudPlatformType => {
  return x as string in cloudPlatformTypes
}

export interface BaseWorkspaceInfo {
  namespace: string
  name: string
  workspaceId: string
  cloudPlatform: string
}

export interface AzureWorkspaceInfo extends BaseWorkspaceInfo {
}

export interface GoogleWorkspaceInfo extends BaseWorkspaceInfo {
  googleProject: string
  bucketName: string
}

export type WorkspaceInfo = AzureWorkspaceInfo | GoogleWorkspaceInfo

export const isGoogleWorkspaceInfo = (workspace: WorkspaceInfo): workspace is GoogleWorkspaceInfo => {
  return workspace.cloudPlatform === 'Gcp'
}

export interface BaseWorkspace {
  accessLevel: string
  canShare: boolean
  canCompute: boolean
  workspace: WorkspaceInfo
}

export interface AzureWorkspace extends BaseWorkspace {
  azureContext: any
}

export interface GoogleWorkspace extends BaseWorkspace {
}

export type WorkspaceWrapper = GoogleWorkspace | AzureWorkspace

export const isAzureWorkspace = (workspace: BaseWorkspace): workspace is AzureWorkspace => {
  return workspace.workspace.cloudPlatform === 'Azure'
}

export const isGoogleWorkspace = (workspace: BaseWorkspace): workspace is GoogleWorkspace => {
  return isGoogleWorkspaceInfo(workspace.workspace)
}

export const getCloudPlatformFromWorkspace = (workspace: BaseWorkspace): CloudPlatformType => isAzureWorkspace(workspace) ? cloudPlatformTypes.AZURE : cloudPlatformTypes.GCP
