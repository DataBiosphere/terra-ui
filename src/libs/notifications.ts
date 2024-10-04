import {
  ButtonPrimary,
  Clickable,
  icon,
  IconId,
  Link,
  Modal,
  useThemeFromContext,
  useUniqueId,
} from '@terra-ui-packages/components';
import { DEFAULT, switchCase } from '@terra-ui-packages/core-utils';
import { NotificationType } from '@terra-ui-packages/notifications';
import _ from 'lodash/fp';
import { ReactNode, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { Store } from 'react-notifications-component';
import ErrorView from 'src/components/ErrorView';
import { getLocalPref, setLocalPref } from 'src/libs/prefs';
import { useStore } from 'src/libs/react-utils';
import { notificationStore } from 'src/libs/state';
import * as StateHistory from 'src/libs/state-history';
import { v4 as uuid } from 'uuid';

// documentation: https://github.com/teodosii/react-notifications-component

export interface NotificationState {
  id?: string;
  type: NotificationType;
  title: string;
  message?: ReactNode;

  /**
   * string, Error(unknown), or json object to be displayed in detail section
   */
  detail?: unknown;
  timeout?: number;
}

export type NotificationProps = Omit<NotificationState, 'type' | 'title'>;

export const sessionExpirationProps = {
  id: 'sessionTimeout',
};

const makeNotification = (props) => _.defaults({ id: uuid() }, props);

export const notify = (type: NotificationType, title: ReactNode, props?: NotificationProps): string => {
  const notification = makeNotification({ type, title, ...props });
  if (!isNotificationMuted(notification.id)) {
    const visibleNotificationIds = _.map('id', notificationStore.get());
    notificationStore.update((previousNotifications) => [...previousNotifications, notification]);
    if (!_.includes(notification.id, visibleNotificationIds)) {
      showNotification(notification);
    }
  }
  return notification.id;
};

export const clearNotification = (id) => Store.removeNotification(id);

export const clearMatchingNotifications = (idPrefix) => {
  const matchingNotificationIds = _.flow(_.map(_.get('id')), _.filter(_.startsWith(idPrefix)))(notificationStore.get());
  matchingNotificationIds.forEach((id) => {
    Store.removeNotification(id);
  });
};

const muteNotificationPreferenceKey = (id) => `mute-notification/${id}`;

export const isNotificationMuted = (id) => {
  const mutedUntil = getLocalPref(muteNotificationPreferenceKey(id));
  return switchCase(mutedUntil, [undefined, () => false], [-1, () => true], [DEFAULT, () => mutedUntil > Date.now()]);
};

export const muteNotification = (id, until = -1) => {
  setLocalPref(muteNotificationPreferenceKey(id), until);
};

const NotificationDisplay = ({ id }) => {
  const { colors } = useThemeFromContext();
  const notificationState = useStore(notificationStore);
  const [modal, setModal] = useState(false);
  const [notificationNumber, setNotificationNumber] = useState(0);

  const notifications: NotificationState[] = _.filter((n) => n.id === id, notificationState);
  const onFirst = notificationNumber === 0;
  const onLast = notificationNumber + 1 === notifications.length;

  const { title, message, detail, type } = notifications[notificationNumber];
  const [baseColor, ariaLabel] = switchCase(
    type,
    ['success', () => [colors.success, 'success notification']],
    ['info', () => [colors.accent, 'info notification']],
    ['welcome', () => [colors.accent, 'welcome notification']],
    ['warn', () => [colors.warning, 'warning notification']],
    ['error', () => [colors.danger, 'error notification']],
    [DEFAULT, () => [colors.accent, 'notification']]
  );
  const iconType = switchCase<string, IconId>(
    type,
    ['success', () => 'success-standard'],
    ['warn', () => 'warning-standard'],
    ['error', () => 'error-standard'],
    [DEFAULT, () => 'info-circle-regular']
  );
  const labelId = useUniqueId();
  const descId = useUniqueId();

  return div(
    {
      style: {
        backgroundColor: baseColor(0.15),
        borderRadius: '4px',
        boxShadow: '0 0 4px 0 rgba(0,0,0,0.5)',
        cursor: 'auto',
        display: 'flex',
        flexDirection: 'column',
        fontSize: 12,
      },
      role: 'alert',
      'aria-labelledby': labelId,
      'aria-describedby': message ? descId : undefined,
    },
    [
      // content and close button
      div({ style: { display: 'flex', padding: '0.75rem 1rem' } }, [
        // content
        div({ style: { display: 'flex', flex: 1, flexDirection: 'column', overflow: 'hidden' } }, [
          // icon and title
          div({ style: { display: 'flex' } }, [
            !!iconType &&
              icon(iconType, {
                'aria-hidden': false,
                'aria-label': ariaLabel,
                size: 26,
                style: { color: baseColor(), flexShrink: 0, marginRight: '0.5rem' },
              }),
            div({ id: labelId, style: { fontWeight: 600, overflow: 'hidden', overflowWrap: 'break-word' } }, [title]),
          ]),
          !!message && div({ id: descId, style: { marginTop: '0.5rem', overflowWrap: 'break-word' } }, [message]),
          div({ style: { display: 'flex' } }, [
            !!detail &&
              h(
                Clickable,
                {
                  style: { marginTop: '0.25rem', marginRight: '0.5rem', textDecoration: 'underline' },
                  onClick: () => setModal(true),
                },
                ['Details']
              ),
          ]),
        ]),
        h(
          Link,
          {
            style: { alignSelf: 'start' },
            'aria-label': type ? `Dismiss ${type} notification` : 'Dismiss notification',
            title: 'Dismiss notification',
            onClick: () => {
              Store.removeNotification(id);
            },
          },
          [icon('times', { size: 20 })]
        ),
      ]),
      notifications.length > 1 &&
        div(
          {
            style: {
              alignItems: 'center',
              borderTop: `1px solid ${baseColor()}`,
              display: 'flex',
              fontSize: 10,
              padding: '0.75rem 1rem',
            },
          },
          [
            h(
              Link,
              {
                disabled: onFirst,
                onClick: () => setNotificationNumber(notificationNumber - 1),
                'aria-label': 'Previous notification',
              },
              [icon('angle-left', { size: 12 })]
            ),
            div(
              {
                style: {
                  backgroundColor: colors.accent(),
                  color: 'white',
                  fontWeight: 600,
                  borderRadius: 10,
                  padding: '0.2rem 0.5rem',
                },
              },
              [notificationNumber + 1, '/', notifications.length]
            ),
            h(
              Link,
              {
                disabled: onLast,
                onClick: () => setNotificationNumber(notificationNumber + 1),
                'aria-label': 'Next notification',
              },
              [icon('angle-right', { size: 12 })]
            ),
          ]
        ),
      modal &&
        h(
          Modal,
          {
            width: 800,
            title,
            showCancel: false,
            showX: true,
            onDismiss: () => setModal(false),
            okButton: h(ButtonPrimary, { onClick: refreshPage }, ['Refresh Page']),
          },
          [h(ErrorView, { error: detail })]
        ),
    ]
  );
};

const refreshPage = () => {
  StateHistory.clearCurrent();
  document.location.reload();
};

const showNotification = ({ id, timeout }) => {
  Store.addNotification({
    id,
    onRemoval: () => notificationStore.update(_.reject({ id })),
    content: div({ style: { width: '100%' } }, [h(NotificationDisplay, { id })]),
    container: 'top-right',
    dismiss: { duration: timeout || 0, click: false, touch: false },
    animationIn: ['animate__animated', 'animate__fadeIn'],
    animationOut: ['animate__animated', 'animate__fadeOut'],
    insert: 'bottom',
    width: 350,
  });
};
