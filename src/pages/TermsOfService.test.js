import { render, screen } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { h } from 'react-hyperscript-helpers'
import { Ajax } from 'src/libs/ajax'
import { authStore } from 'src/libs/state'
import TermsOfServicePage from 'src/pages/TermsOfService'


jest.mock('src/libs/ajax')
jest.mock('src/libs/notifications')

const setupMockAjax = termsOfService => {
  const getTos = jest.fn().mockReturnValue(Promise.resolve('some text'))
  const getTermsOfServiceAdherenceStatus = jest.fn().mockReturnValue(termsOfService)
  const getStatus = jest.fn().mockReturnValue({})
  Ajax.mockImplementation(() => ({
    Metrics: {
      captureEvent: jest.fn()
    },
    User: {
      profile: {
        get: jest.fn().mockReturnValue(Promise.resolve({ keyValuePairs: [] })),
      },
      getTos,
      getTermsOfServiceAdherenceStatus,
      getStatus
    }
  }))
}

describe('TermsOfService', () => {
  afterEach(() => {
    authStore.reset()
  })

  it('shows "Continue under grace period" when the user has not accepted the latest ToS but is still allowed to use Terra', async () => {
    const termsOfService = {
      userHasAcceptedLatestTos: false,
      acceptedTosAllowsUsage: true,
    }
    const isSignedIn = true

    setupMockAjax(termsOfService)

    render(h(TermsOfServicePage))
    authStore.update(state => ({ ...state, termsOfService, isSignedIn }))
    const continueUnderGracePeriodButton = await screen.findByText('Continue under grace period')
    expect(continueUnderGracePeriodButton).not.toBeFalsy()
  })

  it('does not show "Continue under grace period" when the user has not accepted the latest ToS and is not allowed to use Terra', async () => {
    const termsOfService = {
      userHasAcceptedLatestTos: false,
      acceptedTosAllowsUsage: false,
    }
    const isSignedIn = true
    setupMockAjax(termsOfService)

    // Need to wrap in 'act' or else get a warning about updating react state
    await act(() => Promise.resolve(render(h(TermsOfServicePage))))
    authStore.update(state => ({ ...state, termsOfService, isSignedIn }))
    const continueUnderGracePeriodButton = await screen.queryByText('Continue under grace period')
    expect(continueUnderGracePeriodButton).not.toBeInTheDocument()
  })
})
