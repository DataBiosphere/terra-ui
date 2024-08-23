import { DeepPartial } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import { defaultLocation } from 'src/analysis/utils/runtime-utils';
import { locationTypes } from 'src/components/region-common';
import { RequesterPaysErrorInfo } from 'src/libs/ajax/goggle-storage-models';
import { InitializedWorkspaceWrapper } from 'src/workspaces/common/state/useWorkspace';
import { AzureWorkspace, GoogleWorkspace, phiTrackingPolicy, WorkspacePolicy } from 'src/workspaces/utils';

export const defaultAzureWorkspace: AzureWorkspace = {
  workspace: {
    authorizationDomain: [],
    cloudPlatform: 'Azure',
    name: 'test-azure-ws-name',
    namespace: 'test-azure-ws-namespace',
    workspaceId: 'fafbb550-62eb-4135-8b82-3ce4d53446af',
    createdDate: '2023-02-15T19:17:15.711Z',
    createdBy: 'justin@gmail.com',
    lastModified: '2023-03-15T19:17:15.711Z',
  },
  azureContext: {
    managedResourceGroupId: 'test-mrg',
    subscriptionId: 'test-sub-id',
    tenantId: 'test-tenant-id',
  },
  accessLevel: 'OWNER',
  canShare: true,
  canCompute: true,
  policies: [],
};

export const makeAzureWorkspace = (workspace?: DeepPartial<AzureWorkspace>): AzureWorkspace => {
  return _.merge(_.cloneDeep(defaultAzureWorkspace), workspace);
};

export const protectedDataPolicy: WorkspacePolicy = {
  additionalData: [],
  name: 'protected-data',
  namespace: 'terra',
};

export const protectedAzureWorkspace: AzureWorkspace = {
  ...defaultAzureWorkspace,
  policies: [protectedDataPolicy],
};

export const protectedPhiTrackingAzureWorkspace: AzureWorkspace = {
  ...defaultAzureWorkspace,
  policies: [protectedDataPolicy, phiTrackingPolicy],
};

export const groupConstraintPolicy: WorkspacePolicy = {
  namespace: 'terra',
  name: 'group-constraint',
  additionalData: [{ group: 'test-group' }],
};

export const regionConstraintPolicy: WorkspacePolicy = {
  additionalData: [
    {
      'region-name': 'azure.eastus',
    },
    {
      'region-name': 'azure.westus2',
    },
    {
      'region-name': 'unknownRegion',
    },
  ],
  name: 'region-constraint',
  namespace: 'terra',
};

export const regionRestrictedAzureWorkspace: AzureWorkspace = {
  ...defaultAzureWorkspace,
  policies: [regionConstraintPolicy],
};

// These values are not populated by default, and for the majority of existing
// Google workspaces will remain undefined.  This definition should only be
// changed to include test values if the default behavior also changes to always
// set these fields.
export const defaultAzureStorageOptions = {
  azureContainerRegion: undefined,
  azureContainerUrl: undefined,
  azureContainerSasUrl: undefined,
};

export const defaultGoogleWorkspace: GoogleWorkspace = {
  workspace: {
    authorizationDomain: [],
    cloudPlatform: 'Gcp',
    billingAccount: 'billingAccounts/123456-ABCDEF-ABCDEF',
    bucketName: 'test-bucket',
    googleProject: 'test-gcp-ws-project',
    name: 'test-gcp-ws-name',
    namespace: 'test-gcp-ws-namespace',
    workspaceId: 'testGoogleWorkspaceId',
    createdDate: '2023-02-15T19:17:15.711Z',
    createdBy: 'groot@gmail.com',
    lastModified: '2023-03-15T19:17:15.711Z',
  },
  accessLevel: 'OWNER',
  canShare: true,
  canCompute: true,
  policies: [],
};

export const defaultInitializedGoogleWorkspace: InitializedWorkspaceWrapper = {
  ...defaultGoogleWorkspace,
  workspaceInitialized: true,
};

export const makeGoogleWorkspace = (workspace?: DeepPartial<GoogleWorkspace>): GoogleWorkspace => {
  return _.merge(_.cloneDeep(defaultGoogleWorkspace), workspace);
};

export const makeGoogleProtectedWorkspace = (workspace?: DeepPartial<GoogleWorkspace>): GoogleWorkspace => {
  return _.merge(_.cloneDeep(protectedGoogleWorkspace), workspace);
};

export const protectedGoogleWorkspace = makeGoogleWorkspace({
  workspace: { bucketName: 'fc-secure-00001111-2222-3333-aaaa-bbbbccccdddd' },
});

// These defaults are intended to track the default behavior implemented in useWorkspace.ts
export const defaultGoogleBucketOptions = {
  googleBucketLocation: defaultLocation,
  googleBucketType: locationTypes.default,
  fetchedGoogleBucketLocation: undefined,
};

export const mockBucketRequesterPaysError: RequesterPaysErrorInfo = { requesterPaysError: true };
