import { AzureBillingProject, GCPBillingProject } from 'src/billing-core/models';

export const azureBillingProject: AzureBillingProject = {
  cloudPlatform: 'AZURE',
  landingZoneId: 'aaaabbbb-cccc-dddd-0000-111122223333',
  managedAppCoordinates: {
    tenantId: 'aaaabbbb-cccc-dddd-0000-111122223333',
    subscriptionId: 'aaaabbbb-cccc-dddd-0000-111122223333',
    managedResourceGroupId: 'aaaabbbb-cccc-dddd-0000-111122223333',
  },
  invalidBillingAccount: false,
  projectName: 'Azure Billing Project',
  roles: ['Owner'],
  status: 'Ready',
  protectedData: false,
};

export const azureProtectedDataBillingProject: AzureBillingProject = {
  cloudPlatform: 'AZURE',
  landingZoneId: 'aaaabbbb-cccc-dddd-0000-111122223333',
  managedAppCoordinates: {
    tenantId: 'aaaabbbb-cccc-dddd-0000-111122223333',
    subscriptionId: 'aaaabbbb-cccc-dddd-0000-111122223333',
    managedResourceGroupId: 'aaaabbbb-cccc-dddd-0000-111122223333',
  },
  invalidBillingAccount: false,
  projectName: 'Protected Azure Billing Project',
  roles: ['Owner'],
  status: 'Ready',
  protectedData: true,
};

export const azureProtectedEnterpriseBillingProject: AzureBillingProject = {
  cloudPlatform: 'AZURE',
  landingZoneId: 'aaaabbbb-cccc-dddd-0000-111122223333',
  managedAppCoordinates: {
    tenantId: 'aaaabbbb-cccc-dddd-0000-111122223333',
    subscriptionId: 'aaaabbbb-cccc-dddd-0000-111122223333',
    managedResourceGroupId: 'aaaabbbb-cccc-dddd-0000-111122223333',
  },
  invalidBillingAccount: false,
  projectName: 'Enterprise Azure Billing Project',
  roles: ['Owner'],
  status: 'Ready',
  protectedData: true,
  organization: { enterprise: true },
};

export const gcpBillingProject: GCPBillingProject = {
  billingAccount: 'billingAccounts/FOO-BAR-BAZ',
  cloudPlatform: 'GCP',
  invalidBillingAccount: false,
  projectName: 'Google Billing Project',
  roles: ['Owner'],
  status: 'Ready',
};
