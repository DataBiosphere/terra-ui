import { Ajax } from 'src/libs/ajax';
import { FullyQualifiedResourceId } from 'src/libs/ajax/SamResources';

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
}

// Define the supported resources, add your own here
export const supportResources: SupportResourceType[] = [
  {
    displayName: 'Group',
    resourceType: 'managed-group',
    loadSupportSummaryFn: (id: FullyQualifiedResourceId) => Ajax().Groups.group(id.resourceId).getSupportSummary(),
  },
  {
    displayName: 'Workspace',
    resourceType: 'workspace',
    loadSupportSummaryFn: (id: FullyQualifiedResourceId) => Ajax().Workspaces.adminGetById(id.resourceId),
  },
  {
    displayName: 'Billing Project',
    resourceType: 'billing-project',
    loadSupportSummaryFn: (id: FullyQualifiedResourceId) => Ajax().Billing.adminGetProject(id.resourceId),
  },
  { displayName: 'Dataset', resourceType: 'dataset', loadSupportSummaryFn: undefined },
  { displayName: 'Snapshot', resourceType: 'datasnapshot', loadSupportSummaryFn: undefined },
].sort((a, b) => a.displayName.localeCompare(b.displayName));
