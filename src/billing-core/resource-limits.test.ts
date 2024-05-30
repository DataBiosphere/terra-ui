import { BillingProject } from './models';
import { BillingProjectResourceLimits, getResourceLimits } from './resource-limits';

describe('getResourceLimits', () => {
  const baseGoogleBillingProject: BillingProject = {
    billingAccount: 'billingAccounts/FOO-BAR-BAZ',
    cloudPlatform: 'GCP',
    invalidBillingAccount: false,
    projectName: 'Google Billing Project',
    roles: ['Owner'],
    status: 'Ready',
  };

  const baseAzureBillingProject: BillingProject = {
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

  it.each([
    {
      billingProject: baseGoogleBillingProject,
      expectedResourceLimits: undefined,
    },
    {
      billingProject: baseAzureBillingProject,
      expectedResourceLimits: undefined,
    },
    {
      billingProject: {
        ...baseAzureBillingProject,
        organization: { limits: {} },
      },
      expectedResourceLimits: undefined,
    },
    {
      billingProject: {
        ...baseAzureBillingProject,
        organization: {
          limits: { machinetypes: 'Standard_DS2_v2,Standard_DS3_v2', autopause: '30', persistentdisk: '32' },
        },
      },
      expectedResourceLimits: {
        availableMachineTypes: ['Standard_DS2_v2', 'Standard_DS3_v2'],
        maxAutopause: 30,
        maxPersistentDiskSize: 32,
      },
    },
    {
      billingProject: {
        ...baseAzureBillingProject,
        organization: {
          limits: {
            machinetypes: '',
            autopause: 30,
            persistentdisk: '',
          },
        },
      },
      expectedResourceLimits: {
        availableMachineTypes: undefined,
        maxAutopause: 30,
        maxPersistentDiskSize: undefined,
      },
    },
  ] as { billingProject: BillingProject; expectedResourceLimits: BillingProjectResourceLimits | undefined }[])(
    'should return the expected resource limits',
    ({ billingProject, expectedResourceLimits }) => {
      // Act
      const resourceLimits = getResourceLimits(billingProject);

      // Assert
      expect(resourceLimits).toEqual(expectedResourceLimits);
    }
  );
});
