import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { AzureSubscriptionStep } from 'src/pages/billing/NewBillingProjectWizard/AzureBillingProjectWizard/AzureSubscriptionStep';
import {
  getManagedAppInput,
  getSubscriptionInput,
  selectManagedApp,
} from 'src/pages/billing/NewBillingProjectWizard/AzureBillingProjectWizard/SelectManagedAppTestHelper';
import { asMockedFn } from 'src/testing/test-utils';
import { v4 as uuid } from 'uuid';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type AjaxContract = ReturnType<typeof Ajax>;
vi.mock('src/libs/ajax');
const verifyDisabled = (item) => expect(item).toHaveAttribute('disabled');

describe('AzureSubscriptionStep', () => {
  let onManagedAppSelectedEvent;
  let renderResult;

  const renderAzureSubscriptionStep = (props) => {
    const defaultProps = {
      isActive: true,
      subscriptionId: '',
      onSubscriptionIdChanged: vi.fn(),
      managedApp: undefined,
      onManagedAppSelected: onManagedAppSelectedEvent,
    };
    renderResult = render(
      h(AzureSubscriptionStep, {
        ...defaultProps,
        onSubscriptionIdChanged: (newId) => {
          renderResult.rerender(h(AzureSubscriptionStep, { ...defaultProps, subscriptionId: newId }));
        },
        ...props,
      })
    );
  };

  beforeEach(() => {
    vi.resetAllMocks();
    // Don't show expected error responses in logs
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Arrange
    onManagedAppSelectedEvent = vi.fn();
  });

  const captureEvent = vi.fn();
  const invalidUuidError = 'Subscription id must be a UUID';
  const noManagedApps = 'Go to the Azure Marketplace'; // Can only test for complete text in an element, in this case the link.

  it('has the correct initial state', () => {
    renderAzureSubscriptionStep({});
    // Assert
    verifyDisabled(getManagedAppInput());
  });

  it('validates the subscription ID', async () => {
    // Arrange
    renderAzureSubscriptionStep({});
    // Mock managed app Ajax call, should not be called
    const listAzureManagedApplications = vi.fn(() => Promise.resolve());
    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Billing: { listAzureManagedApplications } as Partial<AjaxContract['Billing']>,
          Metrics: { captureEvent } as Partial<AjaxContract['Metrics']>,
        } as Partial<AjaxContract> as AjaxContract)
    );

    // Assert - UUID error message should not initially be visible, even though subscription ID field is empty.
    expect(screen.queryByText(invalidUuidError)).toBeNull();

    // Act - Supply invalid UUID
    fireEvent.change(getSubscriptionInput(), { target: { value: 'invalid UUID' } });

    // Assert
    await waitFor(() => expect(screen.queryByText(invalidUuidError)).not.toBeNull());
    verifyDisabled(getManagedAppInput());
    expect(listAzureManagedApplications).not.toHaveBeenCalled();
    expect(captureEvent).not.toHaveBeenCalled();
  });

  const noManagedAppsTestCase = async (listAzureManagedApplications) => {
    const subscriptionId = uuid();
    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Billing: { listAzureManagedApplications } as Partial<AjaxContract['Billing']>,
          Metrics: { captureEvent } as Partial<AjaxContract['Metrics']>,
        } as Partial<AjaxContract> as AjaxContract)
    );

    // Act - Supply valid UUID
    fireEvent.change(getSubscriptionInput(), { target: { value: subscriptionId } });

    // Assert
    await waitFor(() => expect(listAzureManagedApplications).toHaveBeenCalledWith(subscriptionId, false));
    await screen.findByText(noManagedApps);
    expect(screen.queryByText(invalidUuidError)).toBeNull();
    verifyDisabled(getManagedAppInput());
    expect(onManagedAppSelectedEvent).not.toHaveBeenCalled();
  };

  it('shows the spinner overlay while the call to list managed apps is in progress', async () => {
    renderAzureSubscriptionStep({});
    const queryLoadingSpinner = () =>
      screen.queryByRole((_, node: Element | null) => node?.getAttribute('data-icon') === 'loadingSpinner');

    expect(queryLoadingSpinner()).toBeNull();
    const listAzureManagedApplications = vi.fn(() => {
      expect(queryLoadingSpinner()).not.toBeNull();
      Promise.resolve({ managedApps: [] });
    });
    await noManagedAppsTestCase(listAzureManagedApplications);
    expect(queryLoadingSpinner()).toBeNull();
  });

  it('shows no managed apps in subscription if there are no managed apps (valid subscription ID)', async () => {
    // Arrange
    renderAzureSubscriptionStep({});
    const listAzureManagedApplications = vi.fn(() => Promise.resolve({ managedApps: [] }));

    // Act and Assert
    await noManagedAppsTestCase(listAzureManagedApplications);
  });

  it('shows no managed apps in subscription if the listAzureManagedApplications Ajax call errors', async () => {
    // Arrange
    renderAzureSubscriptionStep({});
    // Mock managed app Ajax call to return a server error.
    // We intentionally show the same message as when the subscription is valid, but no managed apps exist.
    const listAzureManagedApplications = vi.fn(() =>
      Promise.reject('expected test failure-- ignore console.error message')
    );

    // Act and Assert
    await noManagedAppsTestCase(listAzureManagedApplications);
  });

  it('renders available managed applications with their regions and can select a managed app', async () => {
    // Arrange
    renderAzureSubscriptionStep({});
    const selectedManagedApp = await selectManagedApp();

    // Assert
    expect(onManagedAppSelectedEvent).toHaveBeenCalledWith(selectedManagedApp);
  });
});
