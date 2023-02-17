import { fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { h } from 'react-hyperscript-helpers'
import { Ajax } from 'src/libs/ajax'
import Events from 'src/libs/events'
import {
  addUserAndOwner, getAddUsersRadio,
  getNoUsersRadio
} from 'src/pages/billing/NewBillingProjectWizard/AzureBillingProjectWizard/AddUsersStep.test'
import {
  AzureBillingProjectWizard, userInfoListToProjectAccessObjects
} from 'src/pages/billing/NewBillingProjectWizard/AzureBillingProjectWizard/AzureBillingProjectWizard'
import {
  selectManagedApp
} from 'src/pages/billing/NewBillingProjectWizard/AzureBillingProjectWizard/AzureSubscriptionStep.test'
import {
  clickCreateBillingProject,
  nameBillingProject, verifyCreateBillingProjectDisabled
} from 'src/pages/billing/NewBillingProjectWizard/AzureBillingProjectWizard/CreateNamedProjectStep.test'
import { asMockedFn } from 'src/testing/test-utils'

// Note that mocking is done by selectManagedApp (as well as default mocking in setUp).
type AjaxContract = ReturnType<typeof Ajax>
jest.mock('src/libs/ajax')

describe('transforming user info to the request object', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('splits lists of emails and maps them to roles', () => {
    const emailList = 'a@b.com, b@c.com'
    const result = userInfoListToProjectAccessObjects(emailList, 'User')

    expect(result).toHaveLength(2)
    expect(result[0].role).toEqual('User')
    expect(result[0].email).toEqual('a@b.com')
    expect(result[1].role).toEqual('User')
    expect(result[1].email).toEqual('b@c.com')

    // Empty emails returns an empty array
    expect(userInfoListToProjectAccessObjects('', 'User')).toHaveLength(0)
  })
})

const testStepActive = stepNumber => {
  screen.queryAllByRole('listitem').forEach((step, index) => {
    if (index === stepNumber - 1) {
      expect(step.getAttribute('aria-current')).toBe('step')
    } else {
      expect(step.getAttribute('aria-current')).toBe('false')
    }
  })
}

describe('AzureBillingProjectWizard', () => {
  let renderResult
  const onSuccess = jest.fn()
  const captureEvent = jest.fn()

  beforeEach(() => {
    asMockedFn(Ajax).mockImplementation(() => ({
      Metrics: { captureEvent } as Partial<AjaxContract['Metrics']>
    } as Partial<AjaxContract> as AjaxContract))

    renderResult = render(h(AzureBillingProjectWizard, {
      onSuccess
    }))
  })

  it('should not fail any accessibility tests in initial state', async () => {
    expect(await axe(renderResult.container)).toHaveNoViolations()
  })

  it('should support happy path of submitting with no users/owners', async () => {
    // Integration test of steps (act/arrange/assert not really possible)
    const createAzureProject = jest.fn().mockResolvedValue({})
    const billingProjectName = 'LotsOfCash'

    testStepActive(1)
    const managedApp = await selectManagedApp(captureEvent, createAzureProject)

    testStepActive(2)
    fireEvent.click(getNoUsersRadio())

    testStepActive(3)
    verifyCreateBillingProjectDisabled()
    await nameBillingProject(billingProjectName)
    expect(captureEvent).toBeCalledWith(Events.billingAzureCreationProjectNameEntered)
    expect(await axe(renderResult.container)).toHaveNoViolations()

    await clickCreateBillingProject()
    expect(createAzureProject).toBeCalledWith(
      billingProjectName, managedApp.tenantId, managedApp.subscriptionId, managedApp.managedResourceGroupId,
      []
    )
    expect(onSuccess).toBeCalledWith(billingProjectName)
  })

  it('should support happy path of submitting with owners and users', async () => {
    // Integration test of steps (act/arrange/assert not really possible)
    const createAzureProject = jest.fn().mockResolvedValue({ ok: true })
    const billingProjectName = 'LotsOfCashForAll'

    testStepActive(1)
    const managedApp = await selectManagedApp(captureEvent, createAzureProject)

    testStepActive(2)
    fireEvent.click(getAddUsersRadio())
    addUserAndOwner('onlyuser@example.com', 'owner@example.com')
    testStepActive(2) // Have to click in billing project input to become the active step

    verifyCreateBillingProjectDisabled()
    await nameBillingProject(billingProjectName)
    testStepActive(3)

    expect(await axe(renderResult.container)).toHaveNoViolations()
    await clickCreateBillingProject()
    expect(createAzureProject).toBeCalledWith(
      billingProjectName, managedApp.tenantId, managedApp.subscriptionId, managedApp.managedResourceGroupId,
      [{ email: 'onlyuser@example.com', role: 'User' }, { email: 'owner@example.com', role: 'Owner' }]
    )
    expect(onSuccess).toBeCalledWith(billingProjectName)
  })

  it('shows error if billing project already exists with the name', async () => {
    // Integration test of steps (act/arrange/assert not really possible)
    const createAzureProject = jest.fn().mockRejectedValue({ status: 409 })
    const billingProjectName = 'ProjectNameInUse'

    const managedApp = await selectManagedApp(captureEvent, createAzureProject)
    fireEvent.click(getNoUsersRadio())
    verifyCreateBillingProjectDisabled()
    await nameBillingProject(billingProjectName)
    expect(await axe(renderResult.container)).toHaveNoViolations()
    await clickCreateBillingProject()
    expect(createAzureProject).toBeCalledWith(
      billingProjectName, managedApp.tenantId, managedApp.subscriptionId, managedApp.managedResourceGroupId,
      []
    )
    verifyCreateBillingProjectDisabled()
    expect(onSuccess).not.toBeCalled()
    await screen.findByText('Billing project name already exists')
    expect(captureEvent).toHaveBeenCalledWith(Events.billingAzureCreationProjectDuplicateName)
    expect(await axe(renderResult.container)).toHaveNoViolations()
  })

  it('shows error if there is no billing project name or name is badly formatted', async () => {
    const nameRequiredText = 'A name is required to create a billing project.'
    const tooShortText = 'Billing project name is too short (minimum is 6 characters)'

    // Blank name allowed initially
    expect(screen.queryByText(nameRequiredText)).toBeNull()
    expect(screen.queryByText(tooShortText)).toBeNull()

    await nameBillingProject('b a d')
    await screen.findByText(tooShortText)
    await screen.findByText('Billing project name can only contain letters, numbers, underscores and hyphens.')

    await nameBillingProject('')
    await screen.findByText(nameRequiredText)
    expect(screen.queryByText(tooShortText)).toBeNull()
  })
})
