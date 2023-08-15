import { safeCurry } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import { canWrite } from 'src/libs/utils';

export type CloudProvider = 'AZURE' | 'GCP';
export const cloudProviderTypes: Record<CloudProvider, CloudProvider> = {
  AZURE: 'AZURE',
  GCP: 'GCP',
};

export const cloudProviderLabels: Record<CloudProvider, string> = {
  AZURE: 'Microsoft Azure',
  GCP: 'Google Cloud Platform',
};

export const isKnownCloudProvider = (x: unknown): x is CloudProvider => {
  return (x as string) in cloudProviderTypes;
};

export type AuthorizationDomain = {
  membersGroupName: string;
};

interface BaseWorkspaceInfo {
  namespace: string;
  name: string;
  workspaceId: string;
  authorizationDomain: AuthorizationDomain[];
  createdDate: string;
  createdBy: string;
}

export interface AzureWorkspaceInfo extends BaseWorkspaceInfo {
  cloudPlatform: 'Azure';
}

export interface GoogleWorkspaceInfo extends BaseWorkspaceInfo {
  cloudPlatform: 'Gcp';
  googleProject: string;
  bucketName: string;
}

export type WorkspaceInfo = AzureWorkspaceInfo | GoogleWorkspaceInfo;

export const isGoogleWorkspaceInfo = (workspace: WorkspaceInfo): workspace is GoogleWorkspaceInfo => {
  return workspace.cloudPlatform === 'Gcp';
};

export const workspaceAccessLevels = ['NO ACCESS', 'READER', 'WRITER', 'OWNER', 'PROJECT_OWNER'] as const;

export type WorkspaceAccessLevels = typeof workspaceAccessLevels;

export type WorkspaceAccessLevel = WorkspaceAccessLevels[number];

export const hasAccessLevel = (required: WorkspaceAccessLevel, current: WorkspaceAccessLevel): boolean => {
  return workspaceAccessLevels.indexOf(current) >= workspaceAccessLevels.indexOf(required);
};

export interface BaseWorkspace {
  accessLevel: WorkspaceAccessLevel;
  canShare: boolean;
  canCompute: boolean;
  workspace: WorkspaceInfo;
}

export interface AzureContext {
  managedResourceGroupId: string;
  subscriptionId: string;
  tenantId: string;
}

interface WorkspacePolicy {
  name: string;
  namespace: string;
  additionalData: { [key: string]: string };
}

export interface AzureWorkspace extends BaseWorkspace {
  azureContext: AzureContext;
  policies?: WorkspacePolicy[];
}

export interface GoogleWorkspace extends BaseWorkspace {
  workspace: GoogleWorkspaceInfo;
}

export type WorkspaceWrapper = GoogleWorkspace | AzureWorkspace;

export const isAzureWorkspace = (workspace: BaseWorkspace): workspace is AzureWorkspace => {
  return workspace.workspace.cloudPlatform === 'Azure';
};

export const isGoogleWorkspace = (workspace: BaseWorkspace): workspace is GoogleWorkspace => {
  return isGoogleWorkspaceInfo(workspace.workspace);
};

export const getCloudProviderFromWorkspace = (workspace: BaseWorkspace): CloudProvider =>
  isAzureWorkspace(workspace) ? cloudProviderTypes.AZURE : cloudProviderTypes.GCP;

export const hasProtectedData = (workspace: AzureWorkspace): boolean => containsProtectedDataPolicy(workspace.policies);

export const containsProtectedDataPolicy = (policies: WorkspacePolicy[] | undefined): boolean =>
  _.any((policy) => policy.namespace === 'terra' && policy.name === 'protected-data', policies);

export const isValidWsExportTarget = safeCurry((sourceWs: WorkspaceWrapper, destWs: WorkspaceWrapper) => {
  const {
    workspace: { workspaceId: sourceId, authorizationDomain: sourceAD },
  } = sourceWs;
  const {
    accessLevel,
    workspace: { workspaceId: destId, authorizationDomain: destAD },
  } = destWs;
  const sourceWsCloudPlatform = getCloudProviderFromWorkspace(sourceWs);
  const destWsCloudPlatform = getCloudProviderFromWorkspace(destWs);

  return (
    sourceId !== destId &&
    canWrite(accessLevel) &&
    _.intersectionWith(_.isEqual, sourceAD, destAD).length === sourceAD.length &&
    sourceWsCloudPlatform === destWsCloudPlatform
  );
});
