import '@testing-library/jest-dom'

import { render } from '@testing-library/react'
import { addDays } from 'date-fns/fp'
import { updateFenceLinkExpirationNotification } from 'src/libs/auth'
import * as Nav from 'src/libs/nav'
import * as Notifications from 'src/libs/notifications'
import * as Preferences from 'src/libs/prefs'


jest.mock('react-notifications-component', () => {
  return {
    store: {
      addNotification: jest.fn(),
      removeNotification: jest.fn()
    }
  }
})

describe('updateFenceLinkExpirationNotification', () => {
  beforeAll(() => {
    jest.useFakeTimers()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    jest.spyOn(Nav, 'getLink').mockReturnValue('fence-callback')
    jest.spyOn(Notifications, 'notify')
    jest.spyOn(Notifications, 'clearMatchingNotifications')
    jest.spyOn(Preferences, 'getLocalPref')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const testProvider = {
    key: 'anvil',
    name: 'NHGRI AnVIL Data Commons Framework Services',
    expiresAfter: 30,
    short: 'NHGRI'
  }

  it('clears any existing notifications', () => {
    updateFenceLinkExpirationNotification(testProvider, {
      username: 'user@example.com',
      issued_at: (new Date()).toISOString()
    })

    expect(Notifications.clearMatchingNotifications).toHaveBeenCalledWith('fence-link-expiration/anvil/')
  })

  it('shows notification if link has expired', () => {
    const issueDate = addDays(-90, new Date())
    const expirationDate = addDays(testProvider.expiresAfter, issueDate)

    updateFenceLinkExpirationNotification(testProvider, {
      username: 'user@example.com',
      issued_at: issueDate.toISOString()
    })

    expect(Notifications.notify).toHaveBeenCalledWith(
      'info',
      expect.anything(),
      expect.objectContaining({
        id: `fence-link-expiration/anvil/${expirationDate.getTime()}/expired`
      })
    )

    const notificationContent = Notifications.notify.mock.calls[0][1]
    const { container } = render(notificationContent)
    expect(container).toHaveTextContent('Your access to NHGRI AnVIL Data Commons Framework Services has expired. Log in to restore your access or unlink your account.')
  })

  it('shows notification if link will expire within the next 5 days', () => {
    const issueDate = addDays(-27, new Date())
    const expirationDate = addDays(testProvider.expiresAfter, issueDate)

    updateFenceLinkExpirationNotification(testProvider, {
      username: 'user@example.com',
      issued_at: issueDate.toISOString()
    })

    expect(Notifications.notify).toHaveBeenCalledWith(
      'info',
      expect.anything(),
      expect.objectContaining({
        id: `fence-link-expiration/anvil/${expirationDate.getTime()}/expiring`
      })
    )

    const notificationContent = Notifications.notify.mock.calls[0][1]
    const { container } = render(notificationContent)
    expect(container).toHaveTextContent('Your access to NHGRI AnVIL Data Commons Framework Services will expire in 3 day(s). Log in to renew your access or unlink your account.')
  })

  it('does not show notification if link will not expire within the next 5 days', () => {
    updateFenceLinkExpirationNotification(testProvider, {
      username: 'user@example.com',
      issued_at: (new Date()).toISOString()
    })

    expect(Notifications.notify).not.toHaveBeenCalled()
  })
})
