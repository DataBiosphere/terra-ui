import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import React from 'react';
import * as Notifications from 'src/libs/notifications';
import { userStore } from 'src/libs/state';
import {
  updateNotificationPreferences,
  workspaceChangedNotificationInfo,
  workspaceChangedNotificationKey,
  workspaceSubmissionNotificationInfo,
  workspaceSubmissionNotificationKeys,
} from 'src/profile/notification-settings/utils';
import { renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';
import { WorkspaceNotifications } from 'src/workspaces/dashboard/WorkspaceNotifications';

type NotificationUtilsExports = typeof import('src/profile/notification-settings/utils');
jest.mock('src/profile/notification-settings/utils', (): NotificationUtilsExports => {
  const originalModule = jest.requireActual<NotificationUtilsExports>('src/profile/notification-settings/utils');
  return {
    ...originalModule,
    // Mock errors so that we can test that a notification is sent
    updateNotificationPreferences: jest.fn().mockRejectedValue(new Error('test error')),
  };
});

jest.spyOn(console, 'error').mockImplementation(() => {});

describe('WorkspaceNotifications', () => {
  const testWorkspace = {
    ...defaultGoogleWorkspace,
    workspace: {
      ...defaultGoogleWorkspace.workspace,
      name: 'name',
      namespace: 'namespace',
    },
  };

  afterEach(() => {
    userStore.reset();
  });

  it.each([
    {
      profile: {
        'notifications/SuccessfulSubmissionNotification/namespace/name': 'true',
        'notifications/FailedSubmissionNotification/namespace/name': 'true',
        'notifications/AbortedSubmissionNotification/namespace/name': 'true',
      },
      expectedState: true,
    },
    {
      profile: {},
      expectedState: true,
    },
    {
      profile: {
        'notifications/SuccessfulSubmissionNotification/namespace/name': 'false',
        'notifications/FailedSubmissionNotification/namespace/name': 'false',
        'notifications/AbortedSubmissionNotification/namespace/name': 'false',
      },
      expectedState: false,
    },
  ])('renders checkbox with submission notifications status', ({ profile, expectedState }) => {
    // Arrange
    // @ts-ignore: partial update
    act(() => userStore.update((state) => ({ ...state, profile })));

    // Act
    const { getByLabelText } = render(<WorkspaceNotifications workspace={testWorkspace} />);

    // Assert
    const submissionNotificationsCheckbox = getByLabelText('Receive submission notifications');
    expect(submissionNotificationsCheckbox.getAttribute('aria-checked')).toBe(`${expectedState}`);
  });

  it('calls updateNotificationPreferences when submission checkbox is clicked', async () => {
    // Arrange
    const user = userEvent.setup();

    // Act
    const { getByLabelText } = render(<WorkspaceNotifications workspace={testWorkspace} />);
    const submissionNotificationsCheckbox = getByLabelText('Receive submission notifications');
    await user.click(submissionNotificationsCheckbox);

    // Assert
    expect(updateNotificationPreferences).toHaveBeenCalledWith(
      workspaceSubmissionNotificationKeys('namespace', 'name'),
      false, // toggled to false because since there are no stored user preferences, true is the default value
      'WorkspaceSubmission',
      testWorkspace
    );
  });

  it('calls updateNotificationPreferences when workspace changed checkbox is clicked', async () => {
    // Arrange
    const user = userEvent.setup();

    // Act
    await render(<WorkspaceNotifications workspace={testWorkspace} />);
    const workspaceChangedCheckbox = screen.getByLabelText('Receive workspace changed notifications');
    await user.click(workspaceChangedCheckbox);

    // Assert
    expect(updateNotificationPreferences).toHaveBeenCalledWith(
      workspaceChangedNotificationKey('namespace', 'name'),
      false, // toggled to false because since there are no stored user preferences, true is the default value
      'WorkspaceChanged',
      testWorkspace
    );
  });

  it('displays info tooltips about preferences', async () => {
    // Arrange
    const user = userEvent.setup();

    // Act
    await render(<WorkspaceNotifications workspace={testWorkspace} />);
    const infoIcons = screen.getAllByLabelText('More info');
    await user.click(infoIcons[0]);

    // Assert
    screen.getByText(workspaceSubmissionNotificationInfo);

    // Act
    await user.click(infoIcons[1]);

    // Assert
    screen.getByText(workspaceChangedNotificationInfo);
  });

  it('handles an error from setting the preference value', async () => {
    // Arrange
    const user = userEvent.setup();
    jest.spyOn(Notifications, 'notify');

    // Act
    await render(<WorkspaceNotifications workspace={testWorkspace} />);
    const submissionNotificationsCheckbox = screen.getByLabelText('Receive submission notifications');
    await user.click(submissionNotificationsCheckbox);

    // Assert
    expect(Notifications.notify).toHaveBeenCalled();
  });

  it('has no accessibility errors', async () => {
    // Act
    const { container } = render(<WorkspaceNotifications workspace={testWorkspace} />);

    // Assert
    expect(await axe(container)).toHaveNoViolations();
  });
});
