import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { h } from 'react-hyperscript-helpers'
import { Ajax } from 'src/libs/ajax'
import {
  AzureSubscriptionStep
} from 'src/pages/billing/NewBillingProjectWizard/AzureBillingProjectWizard/AzureSubscriptionStep'
import { asMockedFn } from 'src/testing/test-utils'
import { v4 as uuid } from 'uuid'


type AjaxContract = ReturnType<typeof Ajax>
jest.mock('src/libs/ajax')

const getSubscriptionInput = () => screen.getByLabelText('Enter your Azure subscription ID *')
const getManagedAppInput = () => screen.getByLabelText('Unassigned managed application *')

const verifyDisabled = item => expect(item).toHaveAttribute('disabled')
const verifyEnabled = item => expect(item).not.toHaveAttribute('disabled')

// Exported for wizard integration test.
export const selectManagedApp = async (captureEvent = jest.fn(), createAzureProject = jest.fn()) => {
  const appName = 'appName'
  const appRegion = 'appRegion'
  const tenant = 'tenant'
  const subscription = uuid()
  const mrg = 'mrg'
  const selectedManagedApp = { applicationDeploymentName: appName, tenantId: tenant, subscriptionId: subscription, managedResourceGroupId: mrg, assigned: false, region: appRegion }
  const listAzureManagedApplications = jest.fn(() => Promise.resolve(
    {
      managedApps: [
        { applicationDeploymentName: 'testApp1', tenantId: 'fakeTenant1', subscriptionId: 'fakeSub1', managedResourceGroupId: 'fakeMrg1', assigned: false },
        selectedManagedApp
      ]
    }
  ))
  asMockedFn(Ajax).mockImplementation(() => ({
    Billing: { listAzureManagedApplications, createAzureProject } as Partial<AjaxContract['Billing']>,
    Metrics: { captureEvent } as Partial<AjaxContract['Metrics']>
  } as Partial<AjaxContract> as AjaxContract))

  // Act - Supply valid subscription UUID and wait for Ajax response
  fireEvent.change(getSubscriptionInput(), { target: { value: subscription } })
  await waitFor(() => verifyEnabled(getManagedAppInput()))

  // Act - Select one of the managed apps
  await userEvent.click(getManagedAppInput())
  const selectOption = await screen.findByText(`${appName} (${appRegion})`)
  await userEvent.click(selectOption)
  return selectedManagedApp
}

describe('AzureSubscriptionStep', () => {
  let onManagedAppSelectedEvent
  let renderResult

  const renderAzureSubscriptionStep = props => {
    const defaultProps = {
      isActive: true,
      subscriptionId: '',
      onSubscriptionIdChanged: jest.fn(),
      managedApp: undefined,
      onManagedAppSelected: onManagedAppSelectedEvent
    }
    renderResult = render(h(AzureSubscriptionStep, {
      ...defaultProps,
      onSubscriptionIdChanged: newId => {
        renderResult.rerender(h(AzureSubscriptionStep, { ...defaultProps, subscriptionId: newId }))
      },
      ...props
    }))
  }

  beforeEach(() => {
    jest.resetAllMocks()
    // Don't show expected error responses in logs
    jest.spyOn(console, 'error').mockImplementation(() => {})

    // Arrange
    onManagedAppSelectedEvent = jest.fn()
  })

  const captureEvent = jest.fn()
  const invalidUuidError = 'Subscription id must be a UUID'
  const noManagedApps = 'Go to the Azure Marketplace' // Can only test for complete text in an element, in this case the link.

  it('has the correct initial state', () => {
    renderAzureSubscriptionStep({})
    // Assert
    verifyDisabled(getManagedAppInput())
  })

  it('validates the subscription ID', async () => {
    // Arrange
    renderAzureSubscriptionStep({})
    // Mock managed app Ajax call, should not be called
    const listAzureManagedApplications = jest.fn(() => Promise.resolve())
    asMockedFn(Ajax).mockImplementation(() => ({
      Billing: { listAzureManagedApplications } as Partial<AjaxContract['Billing']>,
      Metrics: { captureEvent } as Partial<AjaxContract['Metrics']>
    } as Partial<AjaxContract> as AjaxContract))

    // Assert - UUID error message should not initially be visible, even though subscription ID field is empty.
    expect(screen.queryByText(invalidUuidError)).toBeNull()

    // Act - Supply invalid UUID
    fireEvent.change(getSubscriptionInput(), { target: { value: 'invalid UUID' } })

    // Assert
    await waitFor(() => expect(screen.queryByText(invalidUuidError)).not.toBeNull())
    verifyDisabled(getManagedAppInput())
    expect(listAzureManagedApplications).not.toHaveBeenCalled()
    expect(captureEvent).not.toHaveBeenCalled()
  })

  const noManagedAppsTestCase = async listAzureManagedApplications => {
    const subscriptionId = uuid()
    asMockedFn(Ajax).mockImplementation(() => ({
      Billing: { listAzureManagedApplications } as Partial<AjaxContract['Billing']>,
      Metrics: { captureEvent } as Partial<AjaxContract['Metrics']>
    } as Partial<AjaxContract> as AjaxContract))

    // Act - Supply valid UUID
    fireEvent.change(getSubscriptionInput(), { target: { value: subscriptionId } })

    // Assert
    await waitFor(() => expect(listAzureManagedApplications).toHaveBeenCalledWith(subscriptionId, false))
    await screen.findByText(noManagedApps)
    expect(screen.queryByText(invalidUuidError)).toBeNull()
    verifyDisabled(getManagedAppInput())
    expect(onManagedAppSelectedEvent).not.toHaveBeenCalled()
  }

  it('shows the spinner overlay while the call to list managed apps is in progress', async () => {
    renderAzureSubscriptionStep({})
    const queryLoadingSpinner = () => screen.queryByRole((_, node: Element | null) => node?.getAttribute('data-icon') === 'loadingSpinner')

    expect(queryLoadingSpinner()).toBeNull()
    const listAzureManagedApplications = jest.fn(() => {
      expect(queryLoadingSpinner()).not.toBeNull()
      Promise.resolve({ managedApps: [] })
    })
    await noManagedAppsTestCase(listAzureManagedApplications)
    expect(queryLoadingSpinner()).toBeNull()
  })

  it('shows no managed apps in subscription if there are no managed apps (valid subscription ID)', async () => {
    // Arrange
    renderAzureSubscriptionStep({})
    const listAzureManagedApplications = jest.fn(() => Promise.resolve({ managedApps: [] }))

    // Act and Assert
    await noManagedAppsTestCase(listAzureManagedApplications)
  })

  it('shows no managed apps in subscription if the listAzureManagedApplications Ajax call errors', async () => {
    // Arrange
    renderAzureSubscriptionStep({})
    // Mock managed app Ajax call to return a server error.
    // We intentionally show the same message as when the subscription is valid, but no managed apps exist.
    const listAzureManagedApplications = jest.fn(() => Promise.reject('expected test failure-- ignore console.error message'))

    // Act and Assert
    await noManagedAppsTestCase(listAzureManagedApplications)
  })

  it('renders available managed applications with their regions and can select a managed app', async () => {
    // Arrange
    renderAzureSubscriptionStep({})
    const selectedManagedApp = await selectManagedApp()

    // Assert
    expect(onManagedAppSelectedEvent).toHaveBeenCalledWith(selectedManagedApp)
  })
})
