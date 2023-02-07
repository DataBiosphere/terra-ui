import { render } from '@testing-library/react'
import { h } from 'react-hyperscript-helpers'
import { Ajax } from 'src/libs/ajax'
import * as Preferences from 'src/libs/prefs'
import { CreateProjectStep } from 'src/pages/billing/NewBillingProjectWizard/AzureBillingProjectWizard/CreateProjectStep'
import { asMockedFn } from 'src/testing/test-utils'


type AjaxContract = ReturnType<typeof Ajax>


jest.mock('src/libs/ajax')
jest.spyOn(Preferences, 'getLocalPref')

const addProjectUser = asMockedFn(() => Promise.resolve([]))
const submitFn = asMockedFn(() => Promise.resolve())


describe('AddUserStep', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    asMockedFn(Ajax).mockImplementation(() => ({
      Billing: { addProjectUser } as Partial<AjaxContract['Billing']>,
      Metrics: { captureEvent } as Partial<AjaxContract['Metrics']>
    } as Partial<AjaxContract> as AjaxContract))

    render(h(CreateProjectStep, {
      isActive: true,
      managedApps: [],
      submit: submitFn,
      subscriptionId: ''
    }))
  })
})
