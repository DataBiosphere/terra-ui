import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { EventWorkspaceAttributes } from 'src/libs/events';
import * as Notifications from 'src/libs/notifications';
import {
  NotificationCheckbox,
  NotificationCheckboxProps,
  UserAttributesCheckbox,
  UserAttributesCheckboxProps,
} from 'src/profile/notification-settings/PreferenceCheckbox';
import { updateNotificationPreferences, updateUserAttributes } from 'src/profile/notification-settings/utils';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

jest.mock('src/libs/notifications');

type NotificationUtilsExports = typeof import('./utils');
jest.mock('./utils', (): NotificationUtilsExports => {
  const originalModule = jest.requireActual<NotificationUtilsExports>('./utils');
  return {
    ...originalModule,
    // Mock errors so that we can test that a notification is sent
    updateNotificationPreferences: jest.fn().mockRejectedValue(new Error('test error')),
    updateUserAttributes: jest.fn().mockRejectedValue(new Error('test error')),
  };
});

describe('NotificationCheckbox', () => {
  const workspace = { namespace: 'ns', name: 'name' } as EventWorkspaceAttributes;
  const labelText = 'test label';
  const setSaving = jest.fn();
  const notificationOffProps: NotificationCheckboxProps = {
    notificationKeys: ['key1', 'key2'],
    notificationType: 'WorkspaceChanged',
    label: labelText,
    setSaving,
    prefsData: { key1: 'false', key2: 'false' },
    workspace,
  };

  beforeEach(() => {
    // Don't show expected error responses in logs
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('selects the checkbox if the user has not disabled the preferences', async () => {
    // Arrange
    const props: NotificationCheckboxProps = {
      notificationKeys: ['key1', 'key2'],
      notificationType: 'WorkspaceChanged',
      label: labelText,
      setSaving: jest.fn(),
      prefsData: {}, // No stored values, preference will display as enabled
      workspace: undefined,
    };

    // Act
    await render(<NotificationCheckbox {...props} />);

    // Assert
    const checkbox = screen.getByLabelText(labelText);
    expect(checkbox).toBeChecked();
  });

  it('deselects the checkbox if the user preferences have it disabled', async () => {
    // Act
    await render(<NotificationCheckbox {...notificationOffProps} />);

    // Assert
    const checkbox = screen.getByLabelText(labelText);
    expect(checkbox).not.toBeChecked();
  });

  it('calls setSaving and updateNotificationPreferences when toggled', async () => {
    // Arrange
    const user = userEvent.setup();

    // Act
    await render(<NotificationCheckbox {...notificationOffProps} />);
    const checkbox = screen.getByLabelText(labelText);
    await user.click(checkbox);

    // Assert
    expect(updateNotificationPreferences).toHaveBeenCalledWith(
      notificationOffProps.notificationKeys,
      true,
      notificationOffProps.notificationType,
      workspace
    );
    expect(setSaving).toHaveBeenCalledWith(true);
  });

  it('notifies the user if there is an error saving the preference', async () => {
    // Arrange
    const user = userEvent.setup();
    jest.spyOn(Notifications, 'notify');

    // Act
    await render(<NotificationCheckbox {...notificationOffProps} />);
    const checkbox = screen.getByLabelText(labelText);
    await user.click(checkbox);

    // Assert
    expect(Notifications.notify).toHaveBeenCalled();
  });
});

describe('UserAttributesCheckbox', () => {
  const verifyDisabled = (item) => expect(item).toHaveAttribute('disabled');
  const verifyEnabled = (item) => expect(item).not.toHaveAttribute('disabled');

  const labelText = 'test label';
  const setSaving = jest.fn();
  const notificationOffProps: UserAttributesCheckboxProps = {
    notificationKeys: ['key'],
    notificationType: 'Marketing',
    label: labelText,
    setSaving,
    value: false,
    disabled: false,
  };

  beforeEach(() => {
    // Don't show expected error responses in logs
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('selects the checkbox if value is true', async () => {
    // Arrange
    const props: UserAttributesCheckboxProps = {
      notificationKeys: ['key'],
      notificationType: 'Marketing',
      label: labelText,
      setSaving: jest.fn(),
      value: true,
      disabled: false,
    };

    // Act
    await render(<UserAttributesCheckbox {...props} />);

    // Assert
    const checkbox = screen.getByLabelText(labelText);
    verifyEnabled(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('deselects the checkbox if value is false', async () => {
    // Act
    await render(<UserAttributesCheckbox {...notificationOffProps} />);

    // Assert
    const checkbox = screen.getByLabelText(labelText);
    verifyEnabled(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('disables the checkbox if if disabled is true', async () => {
    // Arrange
    const props: UserAttributesCheckboxProps = {
      notificationKeys: ['key'],
      notificationType: 'Marketing',
      label: labelText,
      setSaving: jest.fn(),
      value: true,
      disabled: true,
    };

    // Act
    await render(<UserAttributesCheckbox {...props} />);

    // Assert
    const checkbox = screen.getByLabelText(labelText);
    verifyDisabled(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('calls setSaving and updateUserAttributes when toggled', async () => {
    // Arrange
    const user = userEvent.setup();

    // Act
    await render(<UserAttributesCheckbox {...notificationOffProps} />);
    const checkbox = screen.getByLabelText(labelText);
    await user.click(checkbox);

    // Assert
    expect(updateUserAttributes).toHaveBeenCalledWith(
      notificationOffProps.notificationKeys,
      true,
      notificationOffProps.notificationType
    );
    expect(setSaving).toHaveBeenCalledWith(true);
  });

  it('notifies the user if there is an error saving the preference', async () => {
    // Arrange
    const user = userEvent.setup();
    jest.spyOn(Notifications, 'notify');

    // Act
    await render(<UserAttributesCheckbox {...notificationOffProps} />);
    const checkbox = screen.getByLabelText(labelText);
    await user.click(checkbox);

    // Assert
    expect(Notifications.notify).toHaveBeenCalled();
  });
});
