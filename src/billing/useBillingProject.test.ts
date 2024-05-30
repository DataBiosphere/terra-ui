import { Billing } from 'src/libs/ajax/Billing';
import { azureBillingProject } from 'src/testing/billing-project-fixtures';
import { asMockedFn, mockNotifications, renderHookInActWithAppContexts } from 'src/testing/test-utils';

import { useBillingProject } from './useBillingProject';

jest.mock('src/libs/ajax/Billing', () => ({ Billing: jest.fn() }));
type BillingContract = ReturnType<typeof Billing>;

describe('useBillingProject', () => {
  it('returns billing project', async () => {
    // Arrange
    const getProject = jest.fn(() => Promise.resolve(azureBillingProject));
    asMockedFn(Billing).mockImplementation(() => ({ getProject } as Partial<BillingContract> as BillingContract));

    // Act
    const { result: hookReturnRef } = await renderHookInActWithAppContexts(() =>
      useBillingProject(azureBillingProject.projectName)
    );
    const result = hookReturnRef.current;

    // Assert
    expect(getProject).toHaveBeenCalledWith(azureBillingProject.projectName);
    expect(result).toEqual({ status: 'Ready', state: azureBillingProject });
  });

  it('handles errors', async () => {
    // Arrange
    jest.spyOn(console, 'error').mockImplementation(() => {});

    asMockedFn(Billing).mockReturnValue({
      getProject: (_name) => Promise.reject(new Error('Something went wrong')),
    } as BillingContract);

    // Act
    const { result: hookReturnRef } = await renderHookInActWithAppContexts(() => useBillingProject('test-project'));
    const result = hookReturnRef.current;

    // Assert
    expect(mockNotifications.notify).toHaveBeenCalled();
    expect(result).toEqual({ status: 'Error', state: null, error: new Error('Something went wrong') });
  });
});
