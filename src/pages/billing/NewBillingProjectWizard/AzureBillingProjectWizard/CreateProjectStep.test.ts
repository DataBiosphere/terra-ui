import { Ajax } from 'src/libs/ajax'
import * as Preferences from 'src/libs/prefs'
import { asMockedFn } from 'src/testing/test-utils'


type AjaxContract = ReturnType<typeof Ajax>


jest.mock('src/libs/ajax')
jest.spyOn(Preferences, 'getLocalPref')

const createAzureProject = asMockedFn(() => Promise.resolve([]))
const captureEvent = asMockedFn(() => Promise.resolve([]))


describe('AddUserStep', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    asMockedFn(Ajax).mockImplementation(() => ({
      Billing: { createAzureProject } as Partial<AjaxContract['Billing']>,
      Metrics: { captureEvent } as Partial<AjaxContract['Metrics']>
    } as Partial<AjaxContract> as AjaxContract))
  })

  it('is just a placeholder', () => {
    // There isn't much to test for in the add
  })
  /*
  todo: events to test for:
    billingAzureCreationSubscriptionEntered: 'billing:creation:step1:AzureSubscriptionEntered',
    billingAzureCreationProjectNameEntered: 'billing:creation:step2:AzureSubscriptionEntered',
    billingAzureCreationMRGSelected: 'billing:creation:step2:AzureMRGSelected',
    billingAzureCreationProjectCreateSubmit: 'billing:creation:step2:AzureProjectSubmit',
    billingAzureCreationProjectCreateSuccess: 'billing:creation:step2:AzureProjectSuccess',
    billingAzureCreationProjectCreateFail: 'billing:creation:step2:AzureProjectFail',
    billingAzureCreationUserAdded: 'billing:creation:step3:AzureUserAdded',
    billingAzureCreationFinished: 'billing:creation:step3:AzureFinished',

   */
})
