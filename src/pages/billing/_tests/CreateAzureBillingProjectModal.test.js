import '@testing-library/jest-dom'

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import _ from 'lodash/fp'
import { act } from 'react-dom/test-utils'
import { h } from 'react-hyperscript-helpers'
import { Ajax } from 'src/libs/ajax'
import CreateAzureBillingProjectModal from 'src/pages/billing/CreateAzureBillingProjectModal'
import { billingProjectNameValidator } from 'src/pages/billing/List'
import { v4 as uuid } from 'uuid'


jest.mock('src/components/Modal', () => {
  const { div, h } = jest.requireActual('react-hyperscript-helpers')
  const originalModule = jest.requireActual('src/components/Modal')
  return {
    ...originalModule,
    __esModule: true,
    default: props => div({ id: 'modal-root' }, [
      h(originalModule.default, { onAfterOpen: jest.fn(), ...props })
    ])
  }
})
jest.mock('src/libs/ajax')

describe('CreateAzureBillingProjectModal', () => {
  beforeEach(() => {
    Ajax.mockImplementation(() => {})
    render(h(CreateAzureBillingProjectModal, { onSuccess: jest.fn(), onDismiss: jest.fn(), billingProjectNameValidator }))
  })

  const tooShortError = 'Billing project name is too short (minimum is 6 characters)'
  const tooLongError = 'Billing project name is too long (maximum is 30 characters)'
  const badCharsError = 'Billing project name can only contain letters, numbers, underscores and hyphens.'
  const duplicateProjectError = 'Billing project name already exists'
  const getBillingProjectInput = () => screen.getByLabelText('Terra billing project *')
  const getBillingProjectHint = () => screen.queryByText('Name must be unique and cannot be changed.')

  const invalidUuidError = 'Subscription id must be a UUID'
  const noManagedApps = 'No Terra Managed Applications exist for that subscription'
  const managedAppCallFailed = 'Unable to retrieve Managed Applications for that subscription'
  const getSubscriptionInput = () => screen.getByLabelText('Azure subscription *')
  const getManagedAppInput = () => screen.getByLabelText('Managed application *')
  const getCreateButton = () => screen.getByText('Create')

  const verifyDisabled = item => expect(item).toHaveAttribute('disabled')
  const verifyEnabled = item => expect(item).not.toHaveAttribute('disabled')

  it('has the correct initial state', () => {
    expect(getBillingProjectHint()).not.toBeNull()
    verifyDisabled(getManagedAppInput())
    verifyDisabled(getCreateButton())
  })

  it.each([
    { text: 'short', errors: [tooShortError] },
    { text: '', errors: [tooShortError, badCharsError] },
    { text: '**********', errors: [badCharsError] },
    { text: 'aowejfawioefjaowiejfaoiwejfoaijw efoiawjefiajwefijaweoifjaweoijf', errors: [badCharsError, tooLongError] },
    { text: 'ThisIs-a_suitableName', errors: [] }
  ])('validates billing project name "$text"', ({ text, errors }) => {
    const allErrors = [tooShortError, tooLongError, badCharsError, duplicateProjectError]
    // Insert billing project name
    if (text === '') {
      // Must first insert something and then replace with empty string.
      fireEvent.change(getBillingProjectInput(), { target: { value: 'temp' } })
    }
    fireEvent.change(getBillingProjectInput(), { target: { value: text } })
    // Verify expected error message and presence of hint (hint will not show if there is an error).
    if (_.isEmpty(errors)) {
      expect(getBillingProjectHint()).not.toBeNull()
      _.forEach(unexpectedError => expect(screen.queryByText(unexpectedError)).toBeNull(), allErrors)
    } else {
      expect(getBillingProjectHint()).toBeNull()
      _.forEach(error => expect(screen.queryByText(error)).not.toBeNull(), errors)
      _.forEach(unexpectedError => expect(screen.queryByText(unexpectedError)).toBeNull(), _.difference(allErrors, errors))
    }
    // Create always disabled because all fields must have valid inputs.
    verifyDisabled(getCreateButton())
  })

  it('validates the subscription ID', () => {
    // UUID error message should not initially be visible, even though subscription ID field is empty.
    expect(screen.queryByText(invalidUuidError)).toBeNull()
    // Supply invalid UUID
    fireEvent.change(getSubscriptionInput(), { target: { value: 'invalid UUID' } })
    // Verify error message and expected disabled states.
    expect(screen.queryByText(invalidUuidError)).not.toBeNull()
    verifyDisabled(getCreateButton())
    verifyDisabled(getManagedAppInput())
  })

  it('shows an error if there are no managed apps (valid subscription ID)', async () => {
    // Mock managed app Ajax call to return an empty list.
    Ajax.mockImplementation(() => {
      return {
        Billing: { listAzureManagedApplications: () => Promise.resolve({ managedApps: [] }) }
      }
    })
    // Supply valid UUID
    await act(async () => {
      await userEvent.type(getSubscriptionInput(), uuid())
    })
    // Verify error message and expected disabled states.
    await screen.findByText(noManagedApps)
    expect(screen.queryByText(invalidUuidError)).toBeNull()
    verifyDisabled(getManagedAppInput())
    verifyDisabled(getCreateButton())
  })

  it('shows an error if the listAzureManagedApplications Ajax call errors', async () => {
    // Mock managed app Ajax call to return a server error.
    Ajax.mockImplementation(() => {
      return {
        Billing: { listAzureManagedApplications: () => Promise.reject('expected test failure-- ignore console.error message') }
      }
    })
    // Supply valid UUID
    await act(async () => {
      await userEvent.type(getSubscriptionInput(), uuid())
    })
    // Verify error message and expected disabled states.
    await screen.findByText(managedAppCallFailed)
    expect(screen.queryByText(invalidUuidError)).toBeNull()
    verifyDisabled(getManagedAppInput())
    verifyDisabled(getCreateButton())
  })

  it('renders available managed applications and can create a project', async () => {
    // Mock managed app and create project Ajax calls to succeed.
    const createResult = {}
    const projectName = 'Billing_Project_Name'
    const appName = 'appName'
    const tenant = 'tenant'
    const subscription = 'subscription'
    const mrg = 'mrg'
    Ajax.mockImplementation(() => {
      return {
        Billing: {
          listAzureManagedApplications: () => Promise.resolve(
            {
              managedApps: [
                { applicationDeploymentName: 'testApp1', tenantId: 'fakeTenant1', subscriptionId: 'fakeSub1', managedResourceGroupId: 'fakeMrg1' },
                { applicationDeploymentName: appName, tenantId: tenant, subscriptionId: subscription, managedResourceGroupId: mrg }
              ]
            }
          ),
          createAzureProject: (billingProjectName, tenantId, subscriptionId, managedResourceGroupId) => {
            createResult.billingProjectName = billingProjectName
            createResult.tenantId = tenantId
            createResult.subscriptionId = subscriptionId
            createResult.managedResourceGroupId = managedResourceGroupId
            Promise.resolve(createResult)
          }
        }
      }
    })
    // Insert valid billing project name.
    await act(async () => {
      await userEvent.type(getBillingProjectInput(), projectName)
    })
    verifyDisabled(getCreateButton())

    // Supply valid subscription UUID
    await act(async () => {
      await userEvent.type(getSubscriptionInput(), uuid())
    })
    // Wait for managed app Ajax response
    await waitFor(() => verifyEnabled(getManagedAppInput()))
    verifyDisabled(getCreateButton())
    // Select one of the managed apps
    await userEvent.click(getManagedAppInput())
    const selectOption = await screen.findByText(appName)
    await userEvent.click(selectOption)
    // Click the Create button
    verifyEnabled(getCreateButton())
    await act(async () => {
      await userEvent.click(getCreateButton())
    })

    // Verify Ajax billing project creation function was called.
    expect(createResult.billingProjectName).toBe(projectName)
    expect(createResult.tenantId).toBe(tenant)
    expect(createResult.subscriptionId).toBe(subscription)
    expect(createResult.managedResourceGroupId).toBe(mrg)
  })

  it('shows an error if billing project name is not unique', async () => {
    // Mock managed app Ajax call to succeed, but create billing project call to return duplicate error.
    const projectName = 'Dupe_Billing_Project_Name'
    const appName = 'appName'
    Ajax.mockImplementation(() => {
      return {
        Billing: {
          listAzureManagedApplications: () => Promise.resolve(
            {
              managedApps: [
                { applicationDeploymentName: appName, tenantId: 'fakeTenant', subscriptionId: 'fakeSub', managedResourceGroupId: 'fakeMrg' }
              ]
            }
          ),
          createAzureProject: () => Promise.reject(new Response('Mock duplicate error', { status: 409 }))
        }
      }
    })
    // Insert valid billing project name.
    await act(async () => {
      await userEvent.type(getBillingProjectInput(), projectName)
    })
    verifyDisabled(getCreateButton())

    // Supply a valid subscription UUID
    await act(async () => {
      await userEvent.type(getSubscriptionInput(), uuid())
    })
    // Wait for managed app Ajax response
    await waitFor(() => verifyEnabled(getManagedAppInput()))
    // Select one of the managed apps
    await userEvent.click(getManagedAppInput())
    const selectOption = await screen.findByText(appName)
    await userEvent.click(selectOption)
    // Click the Create button
    verifyEnabled(getCreateButton())
    await act(async () => {
      await userEvent.click(getCreateButton())
    })

    // Verify expected error message and Create button disabled.
    expect(screen.queryByText(duplicateProjectError)).not.toBeNull()
    verifyDisabled(getCreateButton())
  })
})
