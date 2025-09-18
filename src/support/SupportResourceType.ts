import { Billing } from 'src/libs/ajax/billing/Billing';
import { DataRepo } from 'src/libs/ajax/DataRepo';
import { Groups } from 'src/libs/ajax/Groups';
import { FullyQualifiedResourceId } from 'src/libs/ajax/SamResources';
import { User } from 'src/libs/ajax/User';
import { Workspaces } from 'src/libs/ajax/workspaces/Workspaces';

export type SupportSummary = object;

export interface ResourceTypeSummaryProps {
  displayName: string;
  fqResourceId: FullyQualifiedResourceId;
  loadSupportSummaryFn: ((id: FullyQualifiedResourceId) => Promise<SupportSummary>) | undefined;
}

export interface SupportResourceType {
  displayName: string;
  resourceType: string;
  loadSupportSummaryFn: ((id: FullyQualifiedResourceId) => Promise<SupportSummary>) | undefined;
  skipPolicies?: boolean;
  lookupResourceIdFn?: (value: string) => Promise<FullyQualifiedResourceId>;
  lookupResourceIdBoxPlaceholder?: string;
  lookupByGoogleProjectPlaceHolder?: string;
  loadSupportSummaryByGoogleProjectId?: (id: string) => Promise<SupportSummary>;
}

// Define the supported resources, add your own here
export const supportResources: SupportResourceType[] = [
  {
    displayName: 'Group',
    resourceType: 'managed-group',
    loadSupportSummaryFn: (id: FullyQualifiedResourceId) => Groups().group(id.resourceId).getSupportSummary(),
  },
  {
    displayName: 'Workspace',
    resourceType: 'workspace',
    loadSupportSummaryFn: (id: FullyQualifiedResourceId) => Workspaces().adminGetById(id.resourceId),
    lookupResourceIdFn: async (namespaceSlashName: string) => {
      const nameParts = namespaceSlashName.split('/');
      if (nameParts.length !== 2) {
        return Promise.reject('enter namespace and name separated by a /');
      }
      const id = await Workspaces().adminGetId(nameParts[0], nameParts[1]);
      const fqResourceId: FullyQualifiedResourceId = { resourceId: id, resourceTypeName: 'workspace' };
      return fqResourceId;
    },
    lookupResourceIdBoxPlaceholder: 'Namespace/Name',
    lookupByGoogleProjectPlaceHolder: 'Google Project Id',
    loadSupportSummaryByGoogleProjectId: (id: string) => Workspaces().adminGetByGoogleProjectId(id),
  },
  {
    displayName: 'Billing Project',
    resourceType: 'billing-project',
    loadSupportSummaryFn: (id: FullyQualifiedResourceId) => Billing().adminGetProject(id.resourceId),
  },
  {
    displayName: 'Dataset',
    resourceType: 'dataset',
    loadSupportSummaryFn: (id: FullyQualifiedResourceId) => DataRepo().admin().adminRetrieveDataset(id.resourceId),
  },
  {
    displayName: 'Snapshot',
    resourceType: 'datasnapshot',
    loadSupportSummaryFn: (id: FullyQualifiedResourceId) => DataRepo().admin().adminRetrieveSnapshot(id.resourceId),
  },
  {
    displayName: 'User',
    resourceType: 'user',
    skipPolicies: true,
    loadSupportSummaryFn: (id: FullyQualifiedResourceId) => User().getSupportSummary(id.resourceId),
  },
].sort((a, b) => a.displayName.localeCompare(b.displayName));
