import { BillingProfile } from './models';
import { getResourceLimits } from './resource-limits';

describe('getResourceLimits', () => {
  const billingProfile: BillingProfile = {
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
    policies: {
      inputs: [
        {
          namespace: 'terra',
          name: 'protected-data',
          additionalData: [],
        },
      ],
    },
    organization: {
      enterprise: false,
    },
  };

  it.each([
    {
      billingProfile,
      expectedResourceLimits: undefined,
    },
    {
      billingProfile: {
        ...billingProfile,
        organization: { ...billingProfile.organization, limits: {} },
      },
      expectedResourceLimits: undefined,
    },
    {
      billingProfile: {
        ...billingProfile,
        organization: {
          ...billingProfile.organization,
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
      billingProfile: {
        ...billingProfile,
        organization: {
          ...billingProfile.organization,
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
  ] as { billingProfile: BillingProfile; expectedResourceLimits: BillingProfile | undefined }[])(
    'should return the expected resource limits',
    ({ billingProfile, expectedResourceLimits }) => {
      // Act
      const resourceLimits = getResourceLimits(billingProfile);

      // Assert
      expect(resourceLimits).toEqual(expectedResourceLimits);
    }
  );
});
