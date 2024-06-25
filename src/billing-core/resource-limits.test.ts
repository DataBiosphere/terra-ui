import { azureBillingProfile } from 'src/testing/billing-profile-fixtures';

import { BillingProfile } from './models';
import { getResourceLimits } from './resource-limits';

describe('getResourceLimits', () => {
  it.each([
    {
      billingProfile: azureBillingProfile,
      expectedResourceLimits: undefined,
    },
    {
      billingProfile: {
        ...azureBillingProfile,
        organization: { ...azureBillingProfile.organization, limits: {} },
      },
      expectedResourceLimits: undefined,
    },
    {
      billingProfile: {
        ...azureBillingProfile,
        organization: {
          ...azureBillingProfile.organization,
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
        ...azureBillingProfile,
        organization: {
          ...azureBillingProfile.organization,
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
