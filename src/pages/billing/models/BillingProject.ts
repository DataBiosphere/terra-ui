import { AzureManagedAppCoordinates } from 'src/pages/billing/models/AzureManagedAppCoordinates';

export type CloudPlatform = 'GCP' | 'AZURE' | 'UNKNOWN';

export type BillingRole = 'Owner' | 'User';

export const allBillingRoles: BillingRole[] = ['Owner', 'User'];

interface BaseBillingProject {
  cloudPlatform: CloudPlatform;
  projectName: string;
  invalidBillingAccount: boolean;
  roles: BillingRole[];
  status: 'Creating' | 'Ready' | 'Error' | 'Deleting' | 'DeletionFailed' | 'AddingToPerimeter' | 'CreatingLandingZone';
  message?: string;
}

export interface AzureBillingProject extends BaseBillingProject {
  cloudPlatform: 'AZURE';
  managedAppCoordinates: AzureManagedAppCoordinates;
  landingZoneId: string;
}

export interface GCPBillingProject extends BaseBillingProject {
  cloudPlatform: 'GCP';
  billingAccount: string;
  servicePerimeter?: string;
}

export interface UnknownBillingProject extends BaseBillingProject {
  cloudPlatform: 'UNKNOWN';
}

export type BillingProject = AzureBillingProject | GCPBillingProject | UnknownBillingProject;

export const isCreating = (project: BillingProject) =>
  project.status === 'Creating' || project.status === 'CreatingLandingZone';
export const isDeleting = (project: BillingProject) => project.status === 'Deleting';
export const isErrored = (project: BillingProject) => project.status === 'Error' || project.status === 'DeletionFailed';
