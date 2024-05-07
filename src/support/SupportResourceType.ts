import { FullyQualifiedResourceId } from 'src/libs/ajax/SamResources';

export interface ResourceTypeSummaryProps {
  displayName: string;
  fqResourceId: FullyQualifiedResourceId;
}

export interface SupportResourceType {
  displayName: string;
  resourceType: string;
  detailComponent: (props: ResourceTypeSummaryProps) => React.ReactElement<any, any>;
}
