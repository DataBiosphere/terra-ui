import { BillingProfile } from 'src/billing-core/models';

export const azureBillingProfile: BillingProfile = {
  id: '04cb122b-89a7-4b92-ad69-35f9877406ef',
  biller: 'direct',
  displayName: 'TestBillingProfile',
  description: 'This is only a test.',
  cloudPlatform: 'AZURE',
  tenantId: 'dcdfd729-0a05-45e0-bfc9-a2458f8ee29b',
  subscriptionId: 'aff128c1-8e0c-442a-b5d7-ff435e621fc9',
  managedResourceGroupId: 'TestMRG',
  createdDate: '2024-05-28T18:29:26.333295Z',
  lastModified: '2024-05-28T18:29:26.333295Z',
  createdBy: 'user@example.com',
  policies: { inputs: [] },
  organization: {
    enterprise: false,
  },
};
