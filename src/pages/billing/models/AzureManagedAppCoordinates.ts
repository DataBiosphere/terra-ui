export interface AzureManagedAppCoordinates {
  tenantId: string; // UUID as string
  subscriptionId: string; // UUID as string
  managedResourceGroupId: string;
  region?: string;
  applicationDeploymentName?: string;
}
