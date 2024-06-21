import _ from 'lodash/fp';
import { useEffect, useState } from 'react';
import { div, h, h2 } from 'react-hyperscript-helpers';
import { spinnerOverlay } from 'src/components/common';
import { InfoBox } from 'src/components/InfoBox';
import { PageBox, PageBoxVariants } from 'src/components/PageBox';
import { memoWithName } from 'src/libs/react-utils';
import { userStore } from 'src/libs/state';
import * as Style from 'src/libs/style';
import {
  NotificationCard,
  NotificationCardProps,
  UserAttributesCard,
  UserAttributesCardProps,
} from 'src/profile/notification-settings/PreferenceCard';
import {
  workspaceChangedNotificationInfo,
  workspaceChangedNotificationKey,
  workspaceSubmissionNotificationInfo,
  workspaceSubmissionNotificationKeys,
} from 'src/profile/notification-settings/utils';
import { useWorkspaces } from 'src/workspaces/common/state/useWorkspaces';
import { WorkspaceWrapper } from 'src/workspaces/utils';

// "Headers" for each section (note that checkboxes have aria labels to make up for the fact that the information
// is not actually being displayed in a table).
const headerGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', margin: '1.5rem 0 0.5rem 0' };
const boldDiv = (text) => div({ style: { fontWeight: 600 } }, text);

const NotificationCardHeaders = memoWithName('NotificationCardHeaders', () => {
  return div({ style: headerGridStyle }, [
    div({ style: { gridColumnStart: '1', gridColumnEnd: '3', marginLeft: '0.75rem' } }, [boldDiv('Name')]),
    div({ style: { textAlign: 'center' } }, [boldDiv('Opt In')]),
  ]);
});

const WorkspaceNotificationCardHeaders = memoWithName('NotificationCardHeaders', () => {
  return div({ style: headerGridStyle }, [
    div({ style: { gridColumnStart: '1', gridColumnEnd: '3', marginLeft: '0.75rem' } }, [boldDiv('Name')]),
    div({ style: { display: 'flex', justifyContent: 'center' } }, [
      boldDiv('Submission Opt In'),
      h(InfoBox, { style: { marginLeft: '0.5rem' } }, [workspaceSubmissionNotificationInfo]),
    ]),
    div({ style: { display: 'flex', justifyContent: 'center' } }, [
      boldDiv('Data Changed Opt In'),
      h(InfoBox, { style: { marginLeft: '0.5rem' } }, [workspaceChangedNotificationInfo]),
    ]),
  ]);
});

export const NotificationSettings = () => {
  const { workspaces } = useWorkspaces();
  const [prefsData] = _.over(_.pickBy)((_v, k) => _.startsWith('notifications/', k), userStore.get().profile);
  const [saving, setSaving] = useState(false);

  const userAttributes = userStore.get().terraUserAttributes;
  const [marketingConsent, setMarketingConsent] = useState(userAttributes.marketingConsent);

  useEffect(() => {
    setMarketingConsent(userAttributes.marketingConsent);
  }, [userAttributes.marketingConsent]);

  return h(PageBox, { role: 'main', style: { flexGrow: 1 }, variant: PageBoxVariants.light }, [
    div({ style: Style.cardList.toolbarContainer }, [
      h2({ style: { ...Style.elements.sectionHeader, margin: 0, textTransform: 'uppercase' } }, [
        'System Notifications',
        h(InfoBox, { style: { marginLeft: '0.5rem' } }, [
          'You may opt in or out of recieving marketing communications from Terra',
        ]),
      ]),
    ]),
    h(NotificationCardHeaders),
    div({ role: 'list', 'aria-label': 'communication preferences from terra', style: { flexGrow: 1, width: '100%' } }, [
      h(UserAttributesCard, {
        value: true,
        label: 'Necessary communications related to platform operations',
        setSaving,
        notificationKeys: [],
        notificationType: 'PlatformOperations',
        disabled: true,
      } as UserAttributesCardProps),
      h(UserAttributesCard, {
        value: marketingConsent,
        label: 'Marketing communications, including upcoming workshops and new flagship dataset additions',
        setSaving,
        notificationKeys: ['notifications/MarketingConsent'],
        notificationType: 'Marketing',
      } as UserAttributesCardProps),
    ]),
    div({ style: Style.cardList.toolbarContainer }, [
      h2({ style: { ...Style.elements.sectionHeader, marginTop: '2rem', textTransform: 'uppercase' } }, [
        'Account Notifications',
        h(InfoBox, { style: { marginLeft: '0.5rem' } }, [
          'You may receive email notifications regarding certain events in Terra. You may globally opt in or out of receiving these emails.',
        ]),
      ]),
    ]),
    h(NotificationCardHeaders),
    div(
      { role: 'list', 'aria-label': 'notification settings for your account', style: { flexGrow: 1, width: '100%' } },
      [
        h(NotificationCard, {
          setSaving,
          prefsData,
          label: 'Group Access Requested',
          options: [
            {
              notificationKeys: ['notifications/GroupAccessRequestNotification'],
              notificationType: 'GroupAccessRequest',
              optionLabel: 'Opt-in to group access requested notifications',
            },
          ],
        } as NotificationCardProps),
        h(NotificationCard, {
          setSaving,
          prefsData,
          label: 'Workspace Access Added',
          options: [
            {
              notificationKeys: ['notifications/WorkspaceAddedNotification'],
              notificationType: 'WorkspaceAccessAdded',
              optionLabel: 'Opt-in to workspace access added notifications',
            },
          ],
        } as NotificationCardProps),
        h(NotificationCard, {
          setSaving,
          prefsData,
          label: 'Workspace Access Removed',
          options: [
            {
              notificationKeys: ['notifications/WorkspaceRemovedNotification'],
              notificationType: 'WorkspaceAccessRemoved',
              optionLabel: 'Opt-in to workspace access removed notifications',
            },
          ],
        } as NotificationCardProps),
      ]
    ),
    div({ style: Style.cardList.toolbarContainer }, [
      h2({ style: { ...Style.elements.sectionHeader, marginTop: '2rem', textTransform: 'uppercase' } }, [
        'Workspace Notifications',
        h(InfoBox, { style: { marginLeft: '0.5rem' } }, [
          'You may receive email notifications related to workspace operations. You may opt in or out of receiving these emails for individual workspaces.',
        ]),
      ]),
    ]),
    h(WorkspaceNotificationCardHeaders),
    div(
      { role: 'list', 'aria-label': 'notification settings for workspaces', style: { flexGrow: 1, width: '100%' } },
      _.flow(
        _.filter({ public: false }), // public workspaces are not useful to display here and clutter the list
        _.map((workspace: WorkspaceWrapper) => {
          const label = `${workspace.workspace.namespace}/${workspace.workspace.name}`;
          return h(NotificationCard, {
            setSaving,
            prefsData,
            label,
            workspace,
            options: [
              {
                notificationKeys: workspaceSubmissionNotificationKeys(
                  workspace.workspace.namespace,
                  workspace.workspace.name
                ),
                notificationType: 'WorkspaceSubmission',
                optionLabel: `Opt-in to submission notifications for ${label}`,
              },
              {
                notificationKeys: workspaceChangedNotificationKey(
                  workspace.workspace.namespace,
                  workspace.workspace.name
                ),
                notificationType: 'WorkspaceChanged',
                optionLabel: `Opt-in to workspace data changed notifications for ${label}`,
              },
            ],
          } as NotificationCardProps);
        })
      )(workspaces)
    ),
    saving && spinnerOverlay,
  ]);
};
