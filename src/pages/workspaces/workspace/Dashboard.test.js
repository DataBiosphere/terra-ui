import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { act } from 'react-dom/test-utils'
import { h } from 'react-hyperscript-helpers'
import { Ajax } from 'src/libs/ajax'
import { authStore } from 'src/libs/state'
import { WorkspaceNotifications } from 'src/pages/workspaces/workspace/Dashboard'


jest.mock('src/libs/ajax')

describe('WorkspaceNotifications', () => {
  const testWorkspace = { workspace: { namespace: 'test', name: 'test' } }

  afterEach(() => {
    authStore.reset()
  })

  it.each([
    {
      profile: {
        'notifications/SuccessfulSubmissionNotification/test/test': 'true',
        'notifications/FailedSubmissionNotification/test/test': 'true',
        'notifications/AbortedSubmissionNotification/test/test': 'true'
      },
      expectedState: true
    },
    {
      profile: {},
      expectedState: true
    },
    {
      profile: {
        'notifications/SuccessfulSubmissionNotification/test/test': 'false',
        'notifications/FailedSubmissionNotification/test/test': 'false',
        'notifications/AbortedSubmissionNotification/test/test': 'false'
      },
      expectedState: false
    }
  ])('renders checkbox with submission notifications status', ({ profile, expectedState }) => {
    authStore.set({ profile })

    const { getByLabelText } = render(h(WorkspaceNotifications, { workspace: testWorkspace }))
    const submissionNotificationsCheckbox = getByLabelText('Receive submission notifications')
    expect(submissionNotificationsCheckbox.getAttribute('aria-checked')).toBe(`${expectedState}`)
  })

  it('updates preferences when checkbox is clicked', async () => {
    const user = userEvent.setup()

    const setPreferences = jest.fn().mockReturnValue(Promise.resolve())
    Ajax.mockImplementation(() => ({
      Metrics: {
        captureEvent: jest.fn()
      },
      User: {
        profile: {
          get: jest.fn().mockReturnValue(Promise.resolve({ keyValuePairs: [] })),
          setPreferences
        }
      }
    }))

    authStore.set({
      profile: {
        'notifications/SuccessfulSubmissionNotification/test/test': 'false',
        'notifications/FailedSubmissionNotification/test/test': 'false',
        'notifications/AbortedSubmissionNotification/test/test': 'false'
      }
    })

    const { getByLabelText } = render(h(WorkspaceNotifications, { workspace: testWorkspace }))
    const submissionNotificationsCheckbox = getByLabelText('Receive submission notifications')

    await act(() => user.click(submissionNotificationsCheckbox))
    expect(setPreferences).toHaveBeenCalledWith({
      'notifications/SuccessfulSubmissionNotification/test/test': 'true',
      'notifications/FailedSubmissionNotification/test/test': 'true',
      'notifications/AbortedSubmissionNotification/test/test': 'true'
    })
  })

  it('has no accessibility errors', async () => {
    authStore.set({
      profile: {
        'notifications/SuccessfulSubmissionNotification/test/test': 'false',
        'notifications/FailedSubmissionNotification/test/test': 'false',
        'notifications/AbortedSubmissionNotification/test/test': 'false'
      }
    })

    const { container } = render(h(WorkspaceNotifications, { workspace: testWorkspace }))
    expect(await axe(container)).toHaveNoViolations()
  })
})
