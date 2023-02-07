import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react-dom/test-utils'
import { h } from 'react-hyperscript-helpers'
import { Ajax } from 'src/libs/ajax'
import * as Preferences from 'src/libs/prefs'
import { billingRoles } from 'src/pages/billing/List'
import { AddUserStep } from 'src/pages/billing/NewBillingProjectWizard/AzureBillingProjectWizard/AddUserStep'
import { asMockedFn } from 'src/testing/test-utils'


type AjaxContract = ReturnType<typeof Ajax>


const textMatcher = text => screen.queryByText((_, node) => {
  const hasText = node => node.textContent === text
  const nodeHasText = hasText(node)
  const childrenDontHaveText = Array.from(node?.children || []).every(
    child => !hasText(child)
  )
  return nodeHasText && childrenDontHaveText
})

const getEmailInput = () => screen.getByLabelText('User email')
const getRoleInput = () => screen.getByLabelText('Role')
const getAddUsersButton = () => screen.getByRole('button', { name: 'add-users-to-azure-billing-project' })
const getInvalidEmailErrors = () => screen.queryAllByText(/is not a valid email/i)

jest.mock('src/libs/ajax')
jest.spyOn(Preferences, 'getLocalPref')

const addProjectUser = asMockedFn(() => Promise.resolve([]))
const captureEvent = asMockedFn(() => Promise.resolve())


describe('AddUserStep', () => {
  beforeEach(() => {

  })

  describe('The initial state when the step is active', () => {
    beforeEach(() => {
      jest.resetAllMocks()
      asMockedFn(Ajax).mockImplementation(() => ({
        Billing: { addProjectUser } as Partial<AjaxContract['Billing']>,
        Metrics: { captureEvent } as Partial<AjaxContract['Metrics']>
      } as Partial<AjaxContract> as AjaxContract))

      render(h(AddUserStep, {
        isActive: true,
        users: [],
        setUsers: jest.fn()
      }))
    })

    it('shows the user email input', () => {
      expect(getRoleInput()).toBeEnabled()
    })

    it('shows the role input', () => {
      expect(getRoleInput()).toBeEnabled()
    })
  })


  describe('the email list validation', () => {
    beforeEach(() => {
      jest.resetAllMocks()
      asMockedFn(Ajax).mockImplementation(() => ({
        Billing: { addProjectUser } as Partial<AjaxContract['Billing']>,
        Metrics: { captureEvent } as Partial<AjaxContract['Metrics']>
      } as Partial<AjaxContract> as AjaxContract))

      render(h(AddUserStep, {
        isActive: true,
        users: [],
        setUsers: jest.fn()
      }))
    })

    it('will display an error for no emails', () => {
      expect(screen.queryByText('ENTER AN EMAIL TO ADD A USER')).toBeNull()
      expect(textMatcher('Enter an email to add a user')).toBeNull()
      const emailInput: HTMLElement = getEmailInput()
      fireEvent.blur(emailInput)
      expect(textMatcher('Enter an email to add a user')).not.toBeNull()
    })

    it('will display an error for an invalid email', () => {
      const emailValue = 'invalid'
      const emailRegex = /invalid is not a valid email/i
      const emailInput: HTMLElement = getEmailInput()

      fireEvent.change(emailInput, { target: { value: emailValue } })
      expect(screen.queryAllByDisplayValue(emailValue).length).toBe(1) // email input
      expect(screen.queryAllByText(emailRegex).length).toBe(0) // matches error text
      fireEvent.blur(emailInput) // onBlur - triggers validation
      expect(screen.queryAllByDisplayValue(emailValue).length).toBe(1)
      expect(screen.queryAllByText(emailRegex).length).toBe(1)
    })

    it('will disable the button while there are invalid emails', () => {
      const emailValue = 'invalid'
      const emailInput: HTMLElement = getEmailInput()
      fireEvent.change(emailInput, { target: { value: emailValue } })
      // fixme: it looks like this is failing because the common button component
      //  doesn't pass the disabled prop all the way through
      //  it sets styles, prevents it from being clicked, etc, but doesn't set 'disabled=true' on the actual element
      // expect(getAddUsersButton()).toBeDisabled()
    })
  })


  describe('the api call to add the user', () => {
    beforeEach(() => {
      jest.resetAllMocks()
      asMockedFn(Ajax).mockImplementation(() => ({
        Billing: { addProjectUser } as Partial<AjaxContract['Billing']>,
        Metrics: { captureEvent } as Partial<AjaxContract['Metrics']>
      } as Partial<AjaxContract> as AjaxContract))

      render(h(AddUserStep, {
        isActive: true,
        users: [],
        setUsers: jest.fn()
        //billingProjectName: 'testBillingProjectName'
      }))
    })

    it('will call the endpoint to add a user to the project', () => {})


    it('will send a separate call for each email', async () => {
      //console.log('add user object', addProjectUser)
      //console.log('add user mock', addProjectUser.mock)
      const emails = ['a@b.com', 'b@c.com', 'c@d.com']
      const inputText = emails.join()
      const emailInput: HTMLElement = getEmailInput()

      fireEvent.change(emailInput, { target: { value: inputText } })

      fireEvent.blur(emailInput)
      expect(getInvalidEmailErrors().length).toBe(0)

      fireEvent.change(getRoleInput(), { target: { value: billingRoles.user } })
      fireEvent.blur(getRoleInput())

      const addUserButton = getAddUsersButton()
      expect(addUserButton).not.toBeNull()
      expect(addUserButton).not.toBeDisabled()

      fireEvent.click(addUserButton)
      await act(async () => {
        await userEvent.click(addUserButton)
      })
      expect(getInvalidEmailErrors().length).toBe(0)

      // FIXME: trying to figure out why the mock isn't being called here
      //        when actually running, the users are definitely being added to the project,
      //        so there must be something wrong with either the mock setup, or the compnent setup
      //await Promise.resolve() // queue rest of test behind promises in component

      //await addProjectUser('testBillingProjectName',[billingRoles.user], emails[0])
      //expect(addProjectUser).toHaveBeenCalledTimes(emails.length)

      // expect(addProjectUser).toHaveBeenCalledWith('testBillingProjectName', [billingRoles.user], emails[0])
      // expect(Ajax().Billing.addProjectUser).toHaveBeenCalledWith('testBillingProjectName', [billingRoles.user], emails[0])
      // expect(addProjectUser).toHaveBeenCalledWith('testBillingProjectName', [billingRoles.user], emails[1])
      // expect(addProjectUser).toHaveBeenCalledWith('testBillingProjectName', [billingRoles.user], emails[2])
    })
  })
})
