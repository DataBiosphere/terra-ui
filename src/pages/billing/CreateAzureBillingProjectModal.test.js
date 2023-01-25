import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import _ from 'lodash/fp'
import { act } from 'react-dom/test-utils'
import { h } from 'react-hyperscript-helpers'
import { mockModalModule } from 'src/components/Modal.mock'
import { Ajax } from 'src/libs/ajax'
import CreateAzureBillingProjectModal from 'src/pages/billing/CreateAzureBillingProjectModal'
import { billingProjectNameValidator } from 'src/pages/billing/List'
import { v4 as uuid } from 'uuid'


jest.mock('src/components/Modal', () => {
  return mockModalModule()
})

jest.mock('src/libs/ajax')

describe('CreateAzureBillingProjectModal', () => {
  let modalComponent

  beforeEach(() => {
    // Arrange
    Ajax.mockImplementation(() => {})
    modalComponent = render(
      h(CreateAzureBillingProjectModal, { onSuccess: jest.fn(), onDismiss: jest.fn(), billingProjectNameValidator })
    )
  })

  const tooShortError = 'Billing project name is too short (minimum is 6 characters)'
  const tooLongError = 'Billing project name is too long (maximum is 30 characters)'
  const badCharsError = 'Billing project name can only contain letters, numbers, underscores and hyphens.'
  const duplicateProjectError = 'Billing project name already exists'
  const getBillingProjectInput = () => screen.getByLabelText('Terra billing project *')
  const getBillingProjectHint = () => screen.queryByText('Name must be unique and cannot be changed.')

  const invalidUuidError = 'Subscription id must be a UUID'
  const noManagedApps = 'Go to the Azure Marketplace' // Can only test for complete text in an element, in this case the link.
  const managedAppCallFailed = 'Unable to retrieve Managed Applications for that subscription'
  const getSubscriptionInput = () => screen.getByLabelText('Azure subscription *')
  const getManagedAppInput = () => screen.getByLabelText('Unassigned managed application *')
  const getCreateButton = () => screen.getByText('Create')

  const verifyDisabled = item => expect(item).toHaveAttribute('disabled')
  const verifyEnabled = item => expect(item).not.toHaveAttribute('disabled')

  it('has the correct initial state', () => {
    // Assert
    expect(getBillingProjectHint()).not.toBeNull()
    verifyDisabled(getManagedAppInput())
    verifyDisabled(getCreateButton())
  })

  it('should not fail any accessibility tests in initial state', async () => {
    expect(await axe(modalComponent.container)).toHaveNoViolations()
  })

  it.each([
    { text: 'short', errors: [tooShortError] },
    { text: '', errors: [tooShortError, badCharsError] },
    { text: '**********', errors: [badCharsError] },
    { text: 'aowejfawioefjaowiejfaoiwejfoaijw efoiawjefiajwefijaweoifjaweoijf', errors: [badCharsError, tooLongError] },
    { text: 'ThisIs-a_suitableName', errors: [] }
  ])('validates billing project name "$text"', ({ text, errors }) => {
    const allErrors = [tooShortError, tooLongError, badCharsError, duplicateProjectError]

    // Act - Insert billing project name
    if (text === '') {
      // Must first insert something and then replace with empty string.
      fireEvent.change(getBillingProjectInput(), { target: { value: 'temp' } })
    }
    fireEvent.change(getBillingProjectInput(), { target: { value: text } })

    // Assert - Verify expected error message(s) and presence of hint (hint will not show if there is an error).
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
    // Arrange - Mock managed app Ajax call, should not be called
    const listAzureManagedApplications = jest.fn(() => Promise.resolve())
    Ajax.mockImplementation(() => { return { Billing: { listAzureManagedApplications } } })

    // Assert - UUID error message should not initially be visible, even though subscription ID field is empty.
    expect(screen.queryByText(invalidUuidError)).toBeNull()

    // Act - Supply invalid UUID
    fireEvent.change(getSubscriptionInput(), { target: { value: 'invalid UUID' } })

    // Assert
    expect(listAzureManagedApplications).not.toHaveBeenCalled()
    expect(screen.queryByText(invalidUuidError)).not.toBeNull()
    verifyDisabled(getCreateButton())
    verifyDisabled(getManagedAppInput())
  })

  it('shows an error if there are no managed apps (valid subscription ID)', async () => {
    // Arrange - Mock managed app Ajax call to return an empty list.
    const subscriptionId = uuid()
    const listAzureManagedApplications = jest.fn(() => Promise.resolve({ managedApps: [] }))
    Ajax.mockImplementation(() => { return { Billing: { listAzureManagedApplications } } })

    // Act - Supply valid UUID
    await act(async () => {
      await userEvent.type(getSubscriptionInput(), subscriptionId)
    })

    // Assert
    expect(listAzureManagedApplications).toHaveBeenCalledWith(subscriptionId, false)
    await screen.findByText(noManagedApps)
    expect(screen.queryByText(invalidUuidError)).toBeNull()
    verifyDisabled(getManagedAppInput())
    verifyDisabled(getCreateButton())
  })

  it('shows an error if the listAzureManagedApplications Ajax call errors', async () => {
    // Arrange - Mock managed app Ajax call to return a server error.
    Ajax.mockImplementation(() => {
      return {
        Billing: { listAzureManagedApplications: () => Promise.reject('expected test failure-- ignore console.error message') }
      }
    })
    // Act - Supply valid UUID
    await act(async () => {
      await userEvent.type(getSubscriptionInput(), uuid())
    })
    // Assert
    await screen.findByText(managedAppCallFailed)
    expect(screen.queryByText(invalidUuidError)).toBeNull()
    verifyDisabled(getManagedAppInput())
    verifyDisabled(getCreateButton())
  })

  it('renders available managed applications with their regions and can create a project', async () => {
    // Arrange - Mock managed app and create project Ajax calls to succeed.
    const projectName = 'Billing_Project_Name'
    const appName = 'appName'
    const appRegion = 'appRegion'
    const tenant = 'tenant'
    const subscription = 'subscription'
    const mrg = 'mrg'
    const createAzureProject = jest.fn(() => Promise.resolve())
    Ajax.mockImplementation(() => {
      return {
        Billing: {
          listAzureManagedApplications: () => Promise.resolve(
            {
              managedApps: [
                { applicationDeploymentName: 'testApp1', tenantId: 'fakeTenant1', subscriptionId: 'fakeSub1', managedResourceGroupId: 'fakeMrg1', assigned: false },
                { applicationDeploymentName: appName, tenantId: tenant, subscriptionId: subscription, managedResourceGroupId: mrg, assigned: false, region: appRegion }
              ]
            }
          ),
          createAzureProject
        }
      }
    })

    // Act - Insert valid billing project name.
    await act(async () => {
      await userEvent.type(getBillingProjectInput(), projectName)
    })
    // Assert
    verifyDisabled(getCreateButton())

    // Act - Supply valid subscription UUID and wait for Ajax response
    await act(async () => {
      await userEvent.type(getSubscriptionInput(), uuid())
    })
    await waitFor(() => verifyEnabled(getManagedAppInput()))
    // Assert
    verifyDisabled(getCreateButton())

    // Act - Select one of the managed apps
    await userEvent.click(getManagedAppInput())
    const selectOption = await screen.findByText(`${appName} (${appRegion})`)
    await userEvent.click(selectOption)
    // Assert
    verifyEnabled(getCreateButton())
    // Verify accessibility with all fields enabled
    expect(await axe(modalComponent.container)).toHaveNoViolations()

    // Act - Click Create
    await act(async () => {
      await userEvent.click(getCreateButton())
    })
    // Assert
    expect(createAzureProject).toHaveBeenCalledWith(projectName, tenant, subscription, mrg)
  })

  it('shows an error if billing project name is not unique', async () => {
    // Arrange - Mock managed app Ajax call to succeed, but create billing project call to return duplicate error.
    const projectName = 'Dupe_Billing_Project_Name'
    const appName = 'appName'
    Ajax.mockImplementation(() => {
      return {
        Billing: {
          listAzureManagedApplications: () => Promise.resolve(
            {
              managedApps: [
                { applicationDeploymentName: appName, tenantId: 'fakeTenant', subscriptionId: 'fakeSub', managedResourceGroupId: 'fakeMrg', assigned: false }
              ]
            }
          ),
          createAzureProject: () => Promise.reject(new Response('Mock duplicate error', { status: 409 }))
        }
      }
    })

    // Act - Insert valid billing project name and subscription UUID, select the managed app.
    await act(async () => {
      await userEvent.type(getBillingProjectInput(), projectName)
      await userEvent.type(getSubscriptionInput(), uuid())
    })
    await waitFor(() => verifyEnabled(getManagedAppInput()))
    // Select one of the managed apps
    await userEvent.click(getManagedAppInput())
    // Note no region in the Ajax response, so just renders the name
    const selectOption = await screen.findByText(appName)
    await userEvent.click(selectOption)

    // Assert
    verifyEnabled(getCreateButton())

    // Act - Click Create
    await act(async () => {
      await userEvent.click(getCreateButton())
    })

    // Assert - Verify expected error message and Create button disabled.
    expect(screen.queryByText(duplicateProjectError)).not.toBeNull()
    verifyDisabled(getCreateButton())
    // Verify accessibility with error message displayed
    expect(await axe(modalComponent.container)).toHaveNoViolations()
  })
})
