import _ from 'lodash/fp';
import React from 'react';
import { Checkbox } from 'src/components/common';
import { withErrorReporting } from 'src/libs/error';
import { EventWorkspaceAttributes } from 'src/libs/events';
import * as Utils from 'src/libs/utils';
import {
  notificationEnabled,
  NotificationType,
  updateNotificationPreferences,
  updateUserAttributes,
} from 'src/profile/notification-settings/utils';

export interface NotificationCheckboxProps {
  notificationKeys: string[];
  notificationType: NotificationType;
  label: string;
  setSaving: (boolean) => void;
  prefsData: Record<string, string>;
  workspace: EventWorkspaceAttributes | undefined;
}

export const NotificationCheckbox = (props: NotificationCheckboxProps) => {
  const { label, notificationKeys, notificationType, prefsData, setSaving, workspace } = props;
  const checkboxProps = {
    'aria-label': label,
    checked: notificationEnabled(notificationKeys, prefsData),
    onChange: _.flow(
      Utils.withBusyState(setSaving),
      withErrorReporting('Error saving notification preferences')
    )(async (v) => {
      await updateNotificationPreferences(notificationKeys, v, notificationType, workspace);
    }),
  };

  return <Checkbox {...checkboxProps} />;
};

export interface UserAttributesCheckboxProps {
  notificationKeys: string[];
  notificationType: NotificationType;
  label: string;
  value: boolean;
  disabled: boolean;
  setSaving: (boolean) => void;
}

export const UserAttributesCheckbox = (props: UserAttributesCheckboxProps) => {
  const { notificationKeys, notificationType, label, value, disabled, setSaving } = props;
  const onChange = disabled
    ? (_) => {}
    : _.flow(
        Utils.withBusyState(setSaving),
        withErrorReporting('Error saving user attributes')
      )(async (v) => {
        await updateUserAttributes(notificationKeys, v, notificationType);
      });
  const checkboxProps = {
    'aria-label': label,
    checked: value,
    onChange,
    disabled,
  };
  return <Checkbox {...checkboxProps} />;
};
