import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react-dom/test-utils'
import { h } from 'react-hyperscript-helpers'
import {
  CreateNamedProjectStep
} from 'src/pages/billing/NewBillingProjectWizard/AzureBillingProjectWizard/CreateNamedProjectStep'

// Exported for wizard integration test.
export const nameBillingProject = async billingProjectName => {
  await act(async () => {
    await userEvent.click(getBillingProjectInput())
  })
  fireEvent.change(getBillingProjectInput(), { target: { value: billingProjectName } })
}
export const clickCreateBillingProject = async () => {
  const createButton = getCreateButton()
  verifyEnabled(createButton)
  await act(async () => {
    await userEvent.click(createButton)
  })
}
export const verifyCreateBillingProjectDisabled = () => {
  verifyDisabled(getCreateButton())
}

const onBillingProjectNameChanged = jest.fn()
const onBillingProjectInputFocused = jest.fn()
const createBillingProject = jest.fn()
const getBillingProjectInput = () => screen.getByLabelText('Billing project name *')
const getCreateButton = () => screen.getByText('Create Terra Billing Project')
const uniqueBillingProjectNameMsg = 'Name must be unique and cannot be changed'
const verifyDisabled = item => expect(item).toHaveAttribute('disabled')
const verifyEnabled = item => expect(item).not.toHaveAttribute('disabled')

const defaultProps = {
  isActive: true,
  billingProjectName: 'TestProjectName',
  onBillingProjectNameChanged,
  onBillingProjectInputFocused,
  createBillingProject,
  projectNameErrors: undefined,
  createReady: false
}

describe('CreateNamedProjectStep', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('has the correct initial state', () => {
    //Arrange
    render(h(CreateNamedProjectStep, defaultProps))

    // Assert
    verifyEnabled(getBillingProjectInput())
    // @ts-ignore
    expect(getBillingProjectInput().value).toBe(defaultProps.billingProjectName)
    expect(screen.queryByText(uniqueBillingProjectNameMsg)).not.toBeNull()
    expect(screen.queryByText('Learn more and follow changes.')).not.toBeNull()
    expect(screen.queryByText('It may take up to 15 minutes for the billing project to be fully created and ready for use.')).not.toBeNull()
    verifyCreateBillingProjectDisabled()
    expect(createBillingProject).not.toHaveBeenCalled()
  })

  it('shows errors about the billing project name', () => {
    //Arrange
    render(h(CreateNamedProjectStep, {
      ...defaultProps, projectNameErrors: 'Bad project name'
    }))

    // Assert
    verifyEnabled(getBillingProjectInput())
    expect(screen.queryByText(uniqueBillingProjectNameMsg)).toBeNull()
    expect(screen.queryByText('Bad project name')).not.toBeNull()
  })

  it('fires an event when the billing project input is focused', async () => {
    //Arrange
    render(h(CreateNamedProjectStep, defaultProps))

    // Act
    await act(async () => {
      await userEvent.click(getBillingProjectInput())
    })

    // Assert
    expect(onBillingProjectInputFocused).toHaveBeenCalled()
    expect(onBillingProjectNameChanged).not.toHaveBeenCalled()
  })

  it('fires an event when the billing project name changes', async () => {
    //Arrange
    render(h(CreateNamedProjectStep, defaultProps))

    // Act
    await nameBillingProject('NewName')

    // Assert
    expect(onBillingProjectNameChanged).toHaveBeenCalledWith('NewName')
  })

  it('enables the create button and fires when it is clicked', async () => {
    //Arrange
    render(h(CreateNamedProjectStep, {
      ...defaultProps, createReady: true
    }))

    // Act - Click Create
    await clickCreateBillingProject()

    // Assert
    expect(createBillingProject).toHaveBeenCalled()
  })
})
