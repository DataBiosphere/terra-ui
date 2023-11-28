import { asMockedFn } from '@terra-ui-packages/test-utils';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { authStore } from 'src/libs/state';
import { WorkspaceNotifications } from 'src/pages/workspaces/workspace/Dashboard/WorkspaceNotifications';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';

type AjaxContract = ReturnType<typeof Ajax>;

jest.mock('src/libs/ajax');

jest.mock('src/libs/notifications');

describe('WorkspaceNotifications', () => {
  const testWorkspace = {
    ...defaultGoogleWorkspace,
    workspace: {
      ...defaultGoogleWorkspace.workspace,
      name: 'test',
      namespace: 'test',
    },
  };

  beforeEach(() => {
    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          TermsOfService: {
            getUserTermsOfServiceDetails: jest.fn().mockResolvedValue({}),
          } as Partial<AjaxContract['TermsOfService']>,
        } as Partial<AjaxContract> as AjaxContract)
    );
  });

  afterEach(() => {
    act(() => authStore.reset());
    jest.resetAllMocks();
  });

  it.each([
    {
      profile: {
        'notifications/SuccessfulSubmissionNotification/test/test': 'true',
        'notifications/FailedSubmissionNotification/test/test': 'true',
        'notifications/AbortedSubmissionNotification/test/test': 'true',
      },
      expectedState: true,
    },
    {
      profile: {},
      expectedState: true,
    },
    {
      profile: {
        'notifications/SuccessfulSubmissionNotification/test/test': 'false',
        'notifications/FailedSubmissionNotification/test/test': 'false',
        'notifications/AbortedSubmissionNotification/test/test': 'false',
      },
      expectedState: false,
    },
  ])('renders checkbox with submission notifications status', ({ profile, expectedState }) => {
    // @ts-expect-error
    act(() => authStore.update((state) => ({ ...state, profile })));

    const { getByLabelText } = render(h(WorkspaceNotifications, { workspace: testWorkspace }));
    const submissionNotificationsCheckbox = getByLabelText('Receive submission notifications');
    expect(submissionNotificationsCheckbox.getAttribute('aria-checked')).toBe(`${expectedState}`);
  });

  it('updates preferences when checkbox is clicked', async () => {
    const user = userEvent.setup();

    const setPreferences = jest.fn().mockReturnValue(Promise.resolve());
    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          Metrics: {
            captureEvent: jest.fn(),
          } as Partial<AjaxContract['Metrics']>,
          User: {
            getUserAttributes: jest.fn().mockResolvedValue({ marketingConsent: true }),
            getUserAllowances: jest.fn().mockResolvedValue({
              allowed: true,
              details: { enabled: true, termsOfService: true },
            }),
            profile: {
              get: jest.fn().mockReturnValue(Promise.resolve({ keyValuePairs: [] })),
              setPreferences,
            } as Partial<AjaxContract['User']['profile']>,
          } as Partial<AjaxContract['User']>,
          TermsOfService: {
            getUserTermsOfServiceDetails: jest.fn().mockResolvedValue({}),
          } as Partial<AjaxContract['TermsOfService']>,
        } as Partial<AjaxContract> as AjaxContract)
    );

    authStore.update((state) => ({
      ...state,
      profile: {
        // @ts-expect-error
        'notifications/SuccessfulSubmissionNotification/test/test': 'false',
        'notifications/FailedSubmissionNotification/test/test': 'false',
        'notifications/AbortedSubmissionNotification/test/test': 'false',
      },
    }));

    const { getByLabelText } = render(h(WorkspaceNotifications, { workspace: testWorkspace }));
    const submissionNotificationsCheckbox = getByLabelText('Receive submission notifications');

    await user.click(submissionNotificationsCheckbox);
    expect(setPreferences).toHaveBeenCalledWith({
      'notifications/SuccessfulSubmissionNotification/test/test': 'true',
      'notifications/FailedSubmissionNotification/test/test': 'true',
      'notifications/AbortedSubmissionNotification/test/test': 'true',
    });
  });

  it('has no accessibility errors', async () => {
    // Arrange
    authStore.update((state) => ({
      ...state,
      profile: {
        // @ts-expect-error
        'notifications/SuccessfulSubmissionNotification/test/test': 'false',
        'notifications/FailedSubmissionNotification/test/test': 'false',
        'notifications/AbortedSubmissionNotification/test/test': 'false',
      },
    }));

    // Act
    const { container } = render(h(WorkspaceNotifications, { workspace: testWorkspace }));

    // Assert
    expect(await axe(container)).toHaveNoViolations();
  });
});
