import { InfoBox, Spinner } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React, { ReactNode, useState } from 'react';
import { LabeledCheckbox } from 'src/components/common';
import { withErrorReporting } from 'src/libs/error';
import { userStore } from 'src/libs/state';
import { withBusyState } from 'src/libs/utils';
import {
  notificationEnabled,
  NotificationType,
  updateNotificationPreferences,
  workspaceChangedNotificationInfo,
  workspaceChangedNotificationKey,
  workspaceSubmissionNotificationInfo,
  workspaceSubmissionNotificationKeys,
} from 'src/profile/notification-settings/utils';
import { WorkspaceWrapper as Workspace } from 'src/workspaces/utils';

interface WorkspaceNotificationsProps {
  workspace: Workspace;
}

export const WorkspaceNotifications = (props: WorkspaceNotificationsProps): ReactNode => {
  const {
    workspace: { namespace, name },
  } = props.workspace;

  const [submissionNotificationSaving, setSubmissionNotificationSaving] = useState(false);
  const [workspaceChangedSaving, setWorkspaceChangedSaving] = useState(false);

  const [prefsData] = _.over(_.pickBy)((_v, k) => _.startsWith('notifications/', k), userStore.get().profile);
  const submissionNotificationKeys = workspaceSubmissionNotificationKeys(namespace, name);
  const workspaceNotificationKey = workspaceChangedNotificationKey(namespace, name);

  const leftCharSpace = { marginLeft: '1ch' };

  const renderNotificationCheckbox = (
    notificationKeys: string[],
    saving: boolean,
    setSaving: (saving: boolean) => void,
    notificationType: NotificationType,
    label: string,
    tooltipInfo: string
  ) => {
    return (
      <div style={{ display: 'flex', alignItems: 'center', padding: '0.25rem' }}>
        <LabeledCheckbox
          checked={notificationEnabled(notificationKeys, prefsData as Record<string, string>)}
          disabled={saving}
          onChange={_.flow(
            withBusyState(setSaving),
            withErrorReporting('Error saving notification preference')
          )(async (value) => {
            await updateNotificationPreferences(notificationKeys, value, notificationType, props.workspace);
          })}
        >
          <span style={leftCharSpace}>{label}</span>
        </LabeledCheckbox>
        <InfoBox style={leftCharSpace}>{tooltipInfo}</InfoBox>
        {saving && <Spinner size={12} style={leftCharSpace} />}
      </div>
    );
  };

  return (
    <div style={{ margin: '0.5rem' }}>
      {renderNotificationCheckbox(
        submissionNotificationKeys,
        submissionNotificationSaving,
        setSubmissionNotificationSaving,
        'WorkspaceSubmission',
        'Receive submission notifications',
        workspaceSubmissionNotificationInfo
      )}
      {renderNotificationCheckbox(
        workspaceNotificationKey,
        workspaceChangedSaving,
        setWorkspaceChangedSaving,
        'WorkspaceChanged',
        'Receive workspace changed notifications',
        workspaceChangedNotificationInfo
      )}
    </div>
  );
};
