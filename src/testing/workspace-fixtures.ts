import { defaultLocation } from 'src/analysis/utils/runtime-utils';
import { locationTypes } from 'src/components/region-common';
import { AzureWorkspace, GoogleWorkspace } from 'src/libs/workspace-utils';

export const defaultAzureWorkspace: AzureWorkspace = {
  workspace: {
    authorizationDomain: [],
    cloudPlatform: 'Azure',
    name: 'test-azure-ws-name',
    namespace: 'test-azure-ws-namespace',
    workspaceId: 'fafbb550-62eb-4135-8b82-3ce4d53446af',
    createdDate: '2023-02-15T19:17:15.711Z',
    createdBy: 'justin@gmail.com',
  },
  azureContext: {
    managedResourceGroupId: 'test-mrg',
    subscriptionId: 'test-sub-id',
    tenantId: 'test-tenant-id',
  },
  accessLevel: 'OWNER',
  canShare: true,
  canCompute: true,
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
    bucketName: 'test-bucket',
    googleProject: 'test-gcp-ws-project',
    name: 'test-gcp-ws-name',
    namespace: 'test-gcp-ws-namespace',
    workspaceId: 'testGoogleWorkspaceId',
    createdDate: '2023-02-15T19:17:15.711Z',
    createdBy: 'groot@gmail.com',
  },
  accessLevel: 'OWNER',
  canShare: true,
  canCompute: true,
};

// These defaults are intended to track the default behavior implemented in useWorkspace.ts
export const defaultGoogleBucketOptions = {
  googleBucketLocation: defaultLocation,
  googleBucketType: locationTypes.default,
  fetchedGoogleBucketLocation: undefined,
};
