import { cond, safeCurry } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import { azureRegions } from 'src/libs/azure-regions';

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

// TODO: Clean up all the optional types when we fix return types of all the places we retrieve workspaces
interface BaseWorkspaceInfo {
  namespace: string;
  name: string;
  workspaceId: string;
  authorizationDomain: AuthorizationDomain[];
  createdDate: string;
  createdBy: string;
  lastModified: string;
  attributes?: Record<string, unknown>;
  isLocked?: boolean;
  state?: WorkpaceState;
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

export const isGoogleWorkspaceInfo = (workspace: WorkspaceInfo | undefined): workspace is GoogleWorkspaceInfo => {
  return workspace ? workspace.cloudPlatform === 'Gcp' : false;
};

export const workspaceAccessLevels = ['NO ACCESS', 'READER', 'WRITER', 'OWNER', 'PROJECT_OWNER'] as const;

export type WorkspaceAccessLevels = typeof workspaceAccessLevels;

export type WorkspaceAccessLevel = WorkspaceAccessLevels[number];

export const hasAccessLevel = (required: WorkspaceAccessLevel, current: WorkspaceAccessLevel): boolean => {
  return workspaceAccessLevels.indexOf(current) >= workspaceAccessLevels.indexOf(required);
};

export const canWrite = (accessLevel: WorkspaceAccessLevel): boolean => hasAccessLevel('WRITER', accessLevel);
export const canRead = (accessLevel: WorkspaceAccessLevel): boolean => hasAccessLevel('READER', accessLevel);
export const isOwner = (accessLevel: WorkspaceAccessLevel): boolean => hasAccessLevel('OWNER', accessLevel);

export interface WorkspaceSubmissionStats {
  lastSuccessDate?: string;
  lastFailureDate?: string;
  runningSubmissionsCount: number;
}

export type WorkpaceState =
  | 'Creating'
  | 'CreateFailed'
  | 'Ready'
  | 'Updating'
  | 'UpdateFailed'
  | 'Deleting'
  | 'DeleteFailed';

export interface BaseWorkspace {
  accessLevel: WorkspaceAccessLevel;
  canShare: boolean;
  canCompute: boolean;
  workspace: WorkspaceInfo;
  // Currently will always be empty for GCP workspaces, but this will change in the future.
  // For the purposes of test data, not requiring the specification of the field.
  policies?: WorkspacePolicy[];
  public?: boolean;
  workspaceSubmissionStats?: WorkspaceSubmissionStats;
}

export interface AzureContext {
  managedResourceGroupId: string;
  subscriptionId: string;
  tenantId: string;
}

export interface WorkspacePolicy {
  name: string;
  namespace: string;
  additionalData: { [key: string]: string }[];
}

export interface AzureWorkspace extends BaseWorkspace {
  azureContext: AzureContext;
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

export const hasProtectedData = (workspace: BaseWorkspace): boolean => containsProtectedDataPolicy(workspace.policies);

export const containsProtectedDataPolicy = (policies: WorkspacePolicy[] | undefined): boolean =>
  _.any((policy) => policy.namespace === 'terra' && policy.name === 'protected-data', policies);

export const protectedDataMessage =
  'Enhanced logging and monitoring are enabled to support the use of protected or sensitive data in this workspace.';

export const hasRegionConstraint = (workspace: BaseWorkspace): boolean =>
  getRegionConstraintLabels(workspace.policies).length > 0;

export const getRegionConstraintLabels = (policies: WorkspacePolicy[] | undefined): string[] => {
  const regionPolicies = _.filter(
    (policy) => policy.namespace === 'terra' && policy.name === 'region-constraint',
    policies
  );
  const regionLabels: string[] = [];
  _.forEach((policy) => {
    _.forEach((data) => {
      if ('region-name' in data) {
        const region = data['region-name'];
        const regionName = region.startsWith('azure.') ? region.split('azure.')[1] : region;
        regionLabels.push(_.has(regionName, azureRegions) ? azureRegions[regionName].label : regionName);
      }
    }, policy.additionalData);
  }, regionPolicies);
  return regionLabels;
};

export const regionConstraintMessage = (workspace: BaseWorkspace): string | undefined => {
  const regions = getRegionConstraintLabels(workspace.policies);
  return regions.length === 0
    ? undefined
    : `Workspace storage and compute resources must remain in the following region(s): ${regions.join(', ')}.`;
};

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

export interface WorkspaceAccessInfo {
  accessLevel: WorkspaceAccessLevel;
  workspace: { isLocked: boolean };
}

export const canEditWorkspace = ({
  accessLevel,
  workspace: { isLocked },
}: WorkspaceAccessInfo): { value: boolean; message?: string } =>
  cond<{ value: boolean; message?: string }>(
    [!canWrite(accessLevel), () => ({ value: false, message: 'You do not have permission to modify this workspace.' })],
    [isLocked, () => ({ value: false, message: 'This workspace is locked.' })],
    () => ({ value: true })
  );

export const getWorkspaceEditControlProps = ({
  accessLevel,
  workspace: { isLocked },
}: WorkspaceAccessInfo): { disabled?: boolean; tooltip?: string } => {
  const { value, message } = canEditWorkspace({ accessLevel, workspace: { isLocked } });
  return value ? {} : { disabled: true, tooltip: message };
};
