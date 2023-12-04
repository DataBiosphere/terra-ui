import _ from 'lodash/fp';
import { useEffect, useState } from 'react';
import { div, h, h2 } from 'react-hyperscript-helpers';
import { refreshSamUserAttributes, refreshTerraProfile } from 'src/auth/auth';
import { Checkbox, spinnerOverlay } from 'src/components/common';
import { InfoBox } from 'src/components/InfoBox';
import { PageBox, PageBoxVariants } from 'src/components/PageBox';
import { Ajax } from 'src/libs/ajax';
import { withErrorReporting } from 'src/libs/error';
import Events from 'src/libs/events';
import { memoWithName } from 'src/libs/react-utils';
import { userStore } from 'src/libs/state';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { useWorkspaces } from 'src/workspaces/useWorkspaces';

const NotificationCheckbox = ({ notificationKeys, label, setSaving, prefsData }) => {
  const notificationKeysWithValue = ({ notificationKeys, value }) => {
    return _.fromPairs(_.map((notificationKey) => [notificationKey, JSON.stringify(value)], notificationKeys));
  };

  return h(Checkbox, {
    // Thurloe defaults all notifications to being on. So if the key is not present, then we also treat that as enabled
    'aria-label': label,
    checked: !_.isMatch(notificationKeysWithValue({ notificationKeys, value: false }), prefsData),
    onChange: _.flow(
      Utils.withBusyState(setSaving),
      withErrorReporting('Error saving preferences')
    )(async (v) => {
      await Ajax().User.profile.setPreferences(notificationKeysWithValue({ notificationKeys, value: v }));
      Ajax().Metrics.captureEvent(Events.notificationToggle, { notificationKeys, enabled: v });
      await refreshTerraProfile();
    }),
  });
};

const NotificationCardHeaders = memoWithName('NotificationCardHeaders', () => {
  return div({ style: { display: 'flex', justifyContent: 'space-between', margin: '1.5rem 0 0.5rem 0', padding: '0 1rem' } }, [
    div({ style: { flex: 1 } }, [div({ style: { fontWeight: 600 } }, 'Name')]),
    div({ style: { flex: 1 } }, [div({ style: { fontWeight: 600 } }, 'Opt In')]),
  ]);
});

const NotificationCard = memoWithName('NotificationCard', ({ label, notificationKeys, setSaving, prefsData }) => {
  const notificationCardStyles = {
    field: {
      ...Style.noWrapEllipsis,
      flex: 1,
      height: '1rem',
      paddingRight: '1rem',
    },
    row: { display: 'flex', alignItems: 'center', width: '100%', padding: '1rem' },
  };

  return div({ role: 'listitem', style: { ...Style.cardList.longCardShadowless, padding: 0, flexDirection: 'column' } }, [
    div({ style: notificationCardStyles.row }, [
      div({ style: { ...notificationCardStyles.field, display: 'flex', alignItems: 'center' } }, label),
      div({ style: notificationCardStyles.field }, [h(NotificationCheckbox, { notificationKeys, label, setSaving, prefsData })]),
    ]),
  ]);
});

const UserAttributesCard = memoWithName('NotificationCard', ({ value, label, setSaving, notificationKeys, disabled = false }) => {
  const notificationCardStyles = {
    field: {
      ...Style.noWrapEllipsis,
      flex: 1,
      height: '1rem',
      paddingRight: '1rem',
    },
    row: { display: 'flex', alignItems: 'center', width: '100%', padding: '1rem' },
  };

  return div({ role: 'listitem', style: { ...Style.cardList.longCardShadowless, padding: 0, flexDirection: 'column' } }, [
    div({ style: notificationCardStyles.row }, [
      div({ style: { ...notificationCardStyles.field, display: 'flex', alignItems: 'center' } }, label),
      div({ style: notificationCardStyles.field }, [h(UserAttributesCheckbox, { value, label, setSaving, notificationKeys, disabled })]),
    ]),
  ]);
});

const UserAttributesCheckbox = ({ value, label, setSaving, notificationKeys, disabled }) => {
  const onChangeFunc = disabled
    ? (_) => {}
    : _.flow(
        Utils.withBusyState(setSaving),
        withErrorReporting('Error saving user attributes')
      )(async (v) => {
        await Ajax().User.setUserAttributes({ marketingConsent: v });
        Ajax().Metrics.captureEvent(Events.notificationToggle, { notificationKeys, enabled: v });
        await refreshSamUserAttributes();
      });
  return h(Checkbox, {
    'aria-label': label,
    checked: value,
    onChange: onChangeFunc,
    disabled,
  });
};

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
        h(InfoBox, { style: { marginLeft: '0.5rem' } }, 'You may opt in or out of recieving marketing communications from Terra'),
      ]),
    ]),
    h(NotificationCardHeaders),
    div({ role: 'list', 'aria-label': 'communication preferences from terra', style: { flexGrow: 1, width: '100%' } }, [
      h(UserAttributesCard, {
        value: true,
        label: 'Necessary communications related to platform operations',
        setSaving,
        notificationKeys: [],
        disabled: true,
      }),
      h(UserAttributesCard, {
        value: marketingConsent,
        label: 'Marketing communications including notifications for upcoming workshops and new flagship dataset additions',
        setSaving,
        notificationKeys: ['notifications/MarketingConsent'],
      }),
    ]),
    div({ style: Style.cardList.toolbarContainer }, [
      h2({ style: { ...Style.elements.sectionHeader, marginTop: '2rem', textTransform: 'uppercase' } }, [
        'Account Notifications',
        h(
          InfoBox,
          { style: { marginLeft: '0.5rem' } },
          'You may receive email notifications regarding certain events in Terra. You may globally opt in or out of receiving these emails.'
        ),
      ]),
    ]),
    h(NotificationCardHeaders),
    div({ role: 'list', 'aria-label': 'notification settings for your account', style: { flexGrow: 1, width: '100%' } }, [
      h(NotificationCard, {
        setSaving,
        prefsData,
        label: 'Group Access Requested',
        notificationKeys: ['notifications/GroupAccessRequestNotification'],
      }),
      h(NotificationCard, {
        setSaving,
        prefsData,
        label: 'Workspace Access Added',
        notificationKeys: ['notifications/WorkspaceAddedNotification'],
      }),
      h(NotificationCard, {
        setSaving,
        prefsData,
        label: 'Workspace Access Removed',
        notificationKeys: ['notifications/WorkspaceRemovedNotification'],
      }),
    ]),
    div({ style: Style.cardList.toolbarContainer }, [
      h2({ style: { ...Style.elements.sectionHeader, marginTop: '2rem', textTransform: 'uppercase' } }, [
        'Submission Notifications',
        h(
          InfoBox,
          { style: { marginLeft: '0.5rem' } },
          'You may receive email notifications when a submission has succeeded, failed, or been aborted. You may opt in or out of receiving these emails for individual workspaces.'
        ),
      ]),
    ]),
    h(NotificationCardHeaders),
    div(
      { role: 'list', 'aria-label': 'notification settings for workspaces', style: { flexGrow: 1, width: '100%' } },
      _.flow(
        _.filter({ public: false }), // public workspaces are not useful to display here and clutter the list
        _.map((workspace) => {
          const label = `${workspace.workspace.namespace}/${workspace.workspace.name}`;
          return h(NotificationCard, {
            setSaving,
            prefsData,
            label,
            notificationKeys: [
              `notifications/SuccessfulSubmissionNotification/${label}`,
              `notifications/FailedSubmissionNotification/${label}`,
              `notifications/AbortedSubmissionNotification/${label}`,
            ],
          });
        })
      )(workspaces)
    ),
    saving && spinnerOverlay,
  ]);
};
