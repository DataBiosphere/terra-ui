import { AzureBillingProject, GCPBillingProject } from 'src/billing-core/models';
import { supportsPhiTracking } from 'src/billing-core/utils';

describe('supportsPhiTracking', () => {
  it.each([
    { cloudPlatform: 'AZURE', protectedData: true, enterprise: true, expected: true },
    { cloudPlatform: 'AZURE', protectedData: false, enterprise: true, expected: false },
    { cloudPlatform: 'AZURE', protectedData: true, enterprise: false, expected: false },
    { cloudPlatform: 'AZURE', protectedData: true, enterprise: undefined, expected: false },
    { cloudPlatform: 'GCP', protectedData: true, enterprise: true, expected: false },
  ])(
    'Returns $expected for (cloudPlatform=$cloudPlatform, protectedData=$protectedData, enterprise=$enterprise)',
    ({ cloudPlatform, protectedData, enterprise, expected }) => {
      if (cloudPlatform === 'AZURE') {
        const azureBillingProject: AzureBillingProject = {
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
          protectedData,
          ...(enterprise !== undefined && { organization: { enterprise } }),
        };
        expect(supportsPhiTracking(azureBillingProject)).toBe(expected);
      } else {
        const gcpBillingProject: GCPBillingProject = {
          billingAccount: 'billingAccounts/FOO-BAR-BAZ',
          cloudPlatform: 'GCP',
          invalidBillingAccount: false,
          projectName: 'Google Billing Project',
          roles: ['Owner'],
          status: 'Ready',
        };

        expect(cloudPlatform).toBe(gcpBillingProject.cloudPlatform);
        expect(supportsPhiTracking(gcpBillingProject)).toBe(expected);
      }
    }
  );
});
