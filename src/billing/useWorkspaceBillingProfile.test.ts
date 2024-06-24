import { Billing, BillingContract } from 'src/libs/ajax/Billing';
import { WorkspaceManagerResources, WorkspaceManagerResourcesContract } from 'src/libs/ajax/WorkspaceManagerResources';
import { asMockedFn, mockNotifications, renderHookInActWithAppContexts } from 'src/testing/test-utils';

import { useWorkspaceBillingProfile } from './useWorkspaceBillingProfile';

jest.mock('src/libs/ajax/Billing', () => ({ Billing: jest.fn() }));
jest.mock('src/libs/ajax/WorkspaceManagerResources', () => ({ WorkspaceManagerResources: jest.fn() }));

describe('useWorkspaceBillingProfile', () => {
  it('returns billing profile', async () => {
    // Arrange
    const billingProfile = {
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
