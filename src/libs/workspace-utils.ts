import { cond, safeCurry } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import pluralize from 'pluralize';
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
  state?: WorkspaceState;
  errorMessage?: string;
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

export type WorkspaceState =
  | 'Creating'
  | 'CreateFailed'
  | 'Ready'
  | 'Updating'
  | 'UpdateFailed'
  | 'Deleting'
  | 'DeleteFailed'
  | 'Deleted'; // For UI only - not a state in rawls

export interface BaseWorkspace {
  owners?: string[];
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

export interface PolicyDescription {
  shortDescription: string;
  longDescription: string;
}

// Returns descriptions of known policies only (protected data, group constraint, region constraint).
export const getPolicyDescriptions = (workspace: WorkspaceWrapper): PolicyDescription[] => {
  const policyDescriptions: PolicyDescription[] = [];
  if (isProtectedWorkspace(workspace)) {
    policyDescriptions.push({
      shortDescription: 'Additional security monitoring',
      longDescription: protectedDataMessage,
    });
  }
  if (hasGroupConstraintPolicy(workspace)) {
    policyDescriptions.push({ shortDescription: 'Data access controls', longDescription: groupConstraintMessage });
  }
  if (hasRegionConstraintPolicy(workspace)) {
    policyDescriptions.push({
      shortDescription: 'Region constraint',
      longDescription: regionConstraintMessage(workspace)!,
    });
  }
  return policyDescriptions;
};

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

/**
 * Determine whether a workspace is considered protected.
 *
 * For Azure workspaces, this checks for the "protected-data" policy.
 * For Google workspaces, this checks for has enhanced logging - either directly or from an auth domain.
 *
 * @param workspace - The workspace.
 */
export const isProtectedWorkspace = (workspace: WorkspaceWrapper): boolean => {
  switch (workspace.workspace.cloudPlatform) {
    case 'Azure':
      return containsProtectedDataPolicy(workspace.policies);
    case 'Gcp':
      return workspace.workspace.bucketName.startsWith('fc-secure');
    default:
      // Check that all possible cases are handled.
      const exhaustiveGuard: never = workspace.workspace;
      return exhaustiveGuard;
  }
};

export const containsProtectedDataPolicy = (policies: WorkspacePolicy[] | undefined): boolean =>
  _.any((policy: WorkspacePolicy) => policy.namespace === 'terra' && policy.name === 'protected-data', policies);

export const protectedDataMessage =
  'Enhanced logging and monitoring are enabled to support the use of controlled-access data in this workspace.';

export const groupConstraintMessage =
  'Data Access Controls add additional permission restrictions to a workspace. These were added when you imported data from a controlled access source. All workspace collaborators must also be current users on an approved Data Access Request (DAR).';

export const hasRegionConstraintPolicy = (workspace: BaseWorkspace): boolean =>
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
    : `Workspace storage and compute resources must remain in the following ${pluralize(
        'region',
        regions.length
      )}: ${regions.join(', ')}.`;
};

const isGroupConstraintPolicy = (policy: WorkspacePolicy): boolean => {
  return policy.namespace === 'terra' && policy.name === 'group-constraint';
};

/**
 * Returns true if the workspace has any group constraint policies (data access controls).
 */
export const hasGroupConstraintPolicy = (workspace: WorkspaceWrapper): boolean => {
  return (workspace.policies || []).some(isGroupConstraintPolicy);
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

/**
 * The slice of WorkspaceWrapper necessary to determine if a user can run analyses in a workspace.
 */
export interface WorkspaceAnalysisAccessInfo {
  canCompute: boolean;
  workspace: { isLocked: boolean };
}

/**
 * Returns whether or not a user can run analyses in a workspace and a reason if they can't.
 * @param workspace The workspace.
 */
export const canRunAnalysisInWorkspace = (
  workspace: WorkspaceAnalysisAccessInfo
): { value: true; message: undefined } | { value: false; message: string } => {
  const {
    canCompute,
    workspace: { isLocked },
  } = workspace;
  return cond<{ value: true; message: undefined } | { value: false; message: string }>(
    [!canCompute, () => ({ value: false, message: 'You do not have access to run analyses on this workspace.' })],
    [isLocked, () => ({ value: false, message: 'This workspace is locked.' })],
    () => ({ value: true, message: undefined })
  );
};

/**
 * Returns props to disable and add a tooltip to a control if the user cannot run analyses in the workspace.
 * @param workspace - The workspace.
 */
export const getWorkspaceAnalysisControlProps = (
  workspace: WorkspaceAnalysisAccessInfo
): { disabled: true; tooltip: string } | {} => {
  const { value, message } = canRunAnalysisInWorkspace(workspace);
  return value ? {} : { disabled: true, tooltip: message };
};

export const azureControlledAccessRequestMessage =
  'We recommend asking the person who invited you to the workspace if it includes any controlled-access data. ' +
  'If it does, they may be able to help you gain access by assisting with a valid Data Access Request (DAR), for example.';
