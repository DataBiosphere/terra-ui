import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Ajax } from 'src/libs/ajax';
import { asMockedFn } from 'src/testing/test-utils';
import { v4 as uuid } from 'uuid';
import { vi } from 'vitest';

type AjaxContract = ReturnType<typeof Ajax>;

export const getSubscriptionInput = () => screen.getByLabelText('Enter your Azure subscription ID *');
export const getManagedAppInput = () => screen.getByLabelText('Unassigned managed application *');

const verifyEnabled = (item) => expect(item).not.toHaveAttribute('disabled');

export const selectManagedApp = async (captureEvent = vi.fn(), createAzureProject = vi.fn()) => {
  const appName = 'appName';
  const appRegion = 'appRegion';
  const tenant = 'tenant';
  const subscription = uuid();
  const mrg = 'mrg';
  const selectedManagedApp = {
    applicationDeploymentName: appName,
    tenantId: tenant,
    subscriptionId: subscription,
    managedResourceGroupId: mrg,
    assigned: false,
    region: appRegion,
  };
  const listAzureManagedApplications = vi.fn().mockResolvedValue({
    managedApps: [
      {
        applicationDeploymentName: 'testApp1',
        tenantId: 'fakeTenant1',
        subscriptionId: 'fakeSub1',
        managedResourceGroupId: 'fakeMrg1',
        assigned: false,
      },
      selectedManagedApp,
    ],
  });
  asMockedFn(Ajax).mockImplementation(
    () =>
      ({
        Billing: { listAzureManagedApplications, createAzureProject } as Partial<AjaxContract['Billing']>,
        Metrics: { captureEvent } as Partial<AjaxContract['Metrics']>,
      } as Partial<AjaxContract> as AjaxContract)
  );

  // Act - Supply valid subscription UUID and wait for Ajax response
  // await userEvent.click(getSubscriptionInput())
  // await userEvent.paste(subscription)
  fireEvent.change(getSubscriptionInput(), { target: { value: subscription } });
  await waitFor(() => verifyEnabled(getManagedAppInput()));

  // Act - Select one of the managed apps
  await userEvent.click(getManagedAppInput());
  const selectOption = await screen.findByText(`${appName} (${appRegion})`);
  await userEvent.click(selectOption);
  return selectedManagedApp;
};
