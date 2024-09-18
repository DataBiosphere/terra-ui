import { BillingProfile } from 'src/billing-core/models';
import { Billing, BillingContract } from 'src/libs/ajax/billing/Billing';
import { WorkspaceManagerResources, WorkspaceManagerResourcesContract } from 'src/libs/ajax/WorkspaceManagerResources';
import { azureBillingProfile } from 'src/testing/billing-profile-fixtures';
import { asMockedFn, mockNotifications, renderHookInActWithAppContexts } from 'src/testing/test-utils';

import { useWorkspaceBillingProfile } from './useWorkspaceBillingProfile';

jest.mock('src/libs/ajax/billing/Billing', () => ({ Billing: jest.fn() }));
jest.mock('src/libs/ajax/WorkspaceManagerResources', () => ({ WorkspaceManagerResources: jest.fn() }));

describe('useWorkspaceBillingProfile', () => {
  it('returns billing profile', async () => {
    // Arrange
    const billingProfile: BillingProfile = {
      ...azureBillingProfile,
      organization: {
        ...azureBillingProfile.organization,
        limits: {
          autopause: '30',
          persistentdisk: '32',
          machinetypes: 'Standard_DS2_v2,Standard_DS3_v2',
        },
      },
    };

    const getWorkspace = jest.fn(() => Promise.resolve({ spendProfile: billingProfile.id }));
    asMockedFn(WorkspaceManagerResources).mockImplementation(
      () => ({ getWorkspace } as Partial<WorkspaceManagerResourcesContract> as WorkspaceManagerResourcesContract)
    );

    const getBillingProfile = jest.fn(() => Promise.resolve(billingProfile));
    asMockedFn(Billing).mockImplementation(
      () => ({ getBillingProfile } as Partial<BillingContract> as BillingContract)
    );

    const workspaceId = 'cb8e5e9b-c432-4872-bec4-e774b0ed24f3';

    // Act
    const { result: hookReturnRef } = await renderHookInActWithAppContexts(() =>
      useWorkspaceBillingProfile(workspaceId)
    );
    const result = hookReturnRef.current;

    // Assert
    expect(getWorkspace).toHaveBeenCalledWith(workspaceId);
    expect(getBillingProfile).toHaveBeenCalledWith(billingProfile.id);
    expect(result).toEqual({ status: 'Ready', state: billingProfile });
  });

  it('handles errors', async () => {
    // Arrange
    jest.spyOn(console, 'error').mockImplementation(() => {});

    asMockedFn(Billing).mockReturnValue({
      getBillingProfile: (_name) => Promise.reject(new Error('Something went wrong')),
    } as BillingContract);

    // Act
    const { result: hookReturnRef } = await renderHookInActWithAppContexts(() =>
      useWorkspaceBillingProfile('cb8e5e9b-c432-4872-bec4-e774b0ed24f3')
    );
    const result = hookReturnRef.current;

    // Assert
    expect(mockNotifications.notify).toHaveBeenCalled();
    expect(result).toEqual({ status: 'Error', state: null, error: new Error('Something went wrong') });
  });
});
