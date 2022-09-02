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
    // Arrange
    Ajax.mockImplementation(() => {})
    render(h(CreateAzureBillingProjectModal, { onSuccess: jest.fn(), onDismiss: jest.fn(), billingProjectNameValidator }))
  })

  const tooShortError = 'Billing project name is too short (minimum is 6 characters)'
  const tooLongError = 'Billing project name is too long (maximum is 30 characters)'
  const badCharsError = 'Billing project name can only contain letters, numbers, underscores and hyphens.'
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
    // Assert
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
    // Arrange
    const allErrors = [tooShortError, tooLongError, badCharsError]
    // Act
    if (text === '') {
      // Must first insert something and then replace with empty string.
      fireEvent.change(getBillingProjectInput(), { target: { value: 'temp' } })
    }
    fireEvent.change(getBillingProjectInput(), { target: { value: text } })
    // Assert
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
    // Arrange
    expect(screen.queryByText(invalidUuidError)).toBeNull() // Should not initially be visible
    // Act
    fireEvent.change(getSubscriptionInput(), { target: { value: 'invalid UUID' } })
    // Assert
    expect(screen.queryByText(invalidUuidError)).not.toBeNull()
    verifyDisabled(getCreateButton())
    verifyDisabled(getManagedAppInput())
  })

  it('shows an error if there are no managed apps (valid subscription ID)', async () => {
    // Arrange
    Ajax.mockImplementation(() => {
      return {
        Billing: { listAzureManagedApplications: () => Promise.resolve({ managedApps: [] }) }
      }
    })
    // Act
    fireEvent.change(getSubscriptionInput(), { target: { value: uuid() } })
    // Assert
    await screen.findByText(noManagedApps)
    expect(screen.queryByText(invalidUuidError)).toBeNull()
    verifyDisabled(getManagedAppInput())
    verifyDisabled(getCreateButton())
  })

  it('shows an error if the listAzureManagedApplications Ajax call errors', async () => {
    // Arrange
    Ajax.mockImplementation(() => {
      return {
        Billing: { listAzureManagedApplications: () => Promise.reject('expected test failure') }
      }
    })
    // Act
    fireEvent.change(getSubscriptionInput(), { target: { value: uuid() } })
    // Assert
    await screen.findByText(managedAppCallFailed)
    expect(screen.queryByText(invalidUuidError)).toBeNull()
    verifyDisabled(getManagedAppInput())
    verifyDisabled(getCreateButton())
  })

  it('renders available managed applications and can create a project', async () => {
    // Arrange
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
    fireEvent.change(getBillingProjectInput(), { target: { value: projectName } })
    verifyDisabled(getCreateButton())

    // Act
    // Supply a valid subscription ID
    fireEvent.change(getSubscriptionInput(), { target: { value: uuid() } })
    // Wait for Ajax response
    await waitFor(() => verifyEnabled(getManagedAppInput()))
    verifyDisabled(getCreateButton())
    // Select one of the managed apps
    await userEvent.click(getManagedAppInput())
    const selectOption = await screen.findByText(appName)
    await userEvent.click(selectOption)
    // Click the Create button
    verifyEnabled(getCreateButton())
    // Need act due to busy flag update
    await act(async () => {
      await userEvent.click(getCreateButton())
    })

    // Assert
    expect(createResult.billingProjectName).toBe(projectName)
    expect(createResult.tenantId).toBe(tenant)
    expect(createResult.subscriptionId).toBe(subscription)
    expect(createResult.managedResourceGroupId).toBe(mrg)
  })
})
