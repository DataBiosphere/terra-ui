import { FullyQualifiedResourceId } from 'src/libs/ajax/SamResources';
import { ManagedGroupSummary } from 'src/support/ManagedGroupSummary';

export interface ResourceTypeSummaryProps {
  displayName: string;
  fqResourceId: FullyQualifiedResourceId;
}

export interface SupportResourceType {
  displayName: string;
  resourceType: string;
  detailComponent: (props: ResourceTypeSummaryProps) => React.ReactElement<any, any>;
}

// Define the supported resources, add your own here
export const supportResources: SupportResourceType[] = [
  { displayName: 'Group', resourceType: 'managed-group', detailComponent: ManagedGroupSummary },
];
