/**
 * Type for Rawls's MethodRepoMethod schema.
 *
 * Note: Some properties that are optional here are marked as required in the
 * schema, but the Rawls API does not always include them in its responses.
 */
export interface MethodRepoMethod {
  methodNamespace?: string;
  methodName?: string;
  methodVersion: number;
  methodPath?: string;
  sourceRepo?: string;
  methodUri?: string;
}

/**
 * Type for Rawls's MethodConfiguration schema.
 *
 * Note: Some properties that are optional here are marked as required in the
 * schema, but the Rawls API does not always include them in its responses.
 */
export interface MethodConfiguration {
  namespace: string;
  name: string;
  rootEntityType?: string;
  inputs?: any;
  outputs?: any;
  methodRepoMethod: MethodRepoMethod;
  methodConfigVersion?: number;
  deleted?: boolean;
  dataReferenceName?: string;
}

// TYPES RELATED TO WORKSPACE SETTINGS
export type WorkspaceSetting = BucketLifecycleSetting | SoftDeleteSetting;

export interface BucketLifecycleSetting {
  settingType: 'GcpBucketLifecycle';
  config: { rules: BucketLifecycleRule[] };
}

export interface SoftDeleteSetting {
  settingType: 'GcpBucketSoftDelete';
  config: { retentionDurationInSeconds: number };
}

export interface BucketLifecycleRule {
  action: {
    actionType: string;
  };
  conditions?: any;
}

export interface DeleteBucketLifecycleRule extends BucketLifecycleRule {
  action: {
    actionType: 'Delete';
  };
  conditions: {
    age: number;
    matchesPrefix: string[];
  };
}

// TYPES RELATED TO WORKSPACE INFO
export interface WorkspacePolicy {
  name: string;
  namespace: string;
  additionalData: { [key: string]: string }[];
}

export type AuthorizationDomain = {
  membersGroupName: string;
};

export type WorkspaceState =
  | 'Creating'
  | 'CreateFailed'
  | 'Cloning'
  | 'CloningContainer'
  | 'CloningFailed'
  | 'Ready'
  | 'Updating'
  | 'UpdateFailed'
  | 'Deleting'
  | 'DeleteFailed'
  | 'Deleted'; // For UI only - not a state in rawls

// TODO: Clean up all the optional types when we fix return types of all the places we retrieve workspaces
export interface BaseWorkspaceInfo {
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
  completedCloneWorkspaceFileTransfer?: string;
  workspaceType?: 'mc' | 'rawls';
  workspaceVersion?: string;
}

export interface AzureWorkspaceInfo extends BaseWorkspaceInfo {
  cloudPlatform: 'Azure';
  bucketName?: '';
  googleProject?: '';
}

export interface GoogleWorkspaceInfo extends BaseWorkspaceInfo {
  cloudPlatform: 'Gcp';
  googleProject: string;
  billingAccount: string;
  bucketName: string;
}

export type WorkspaceInfo = AzureWorkspaceInfo | GoogleWorkspaceInfo;

// BODY FOR WORKSPACE CREATE AND CLONE REQUEST
export interface CreationRequestBody {
  namespace: string;
  name: string;
  authorizationDomain: AuthorizationDomain[];
  attributes?: Record<string, unknown>;
  copyFilesWithPrefix?: string;
  bucketLocation?: string;
  enhancedBucketLogging?: boolean;
  policies?: WorkspacePolicy[];
}
