import { InfoBox, Spinner } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { ReactNode, useState } from 'react';
import { LabeledCheckbox } from 'src/components/common';
import { withErrorReporting } from 'src/libs/error';
import { userStore } from 'src/libs/state';
import { withBusyState } from 'src/libs/utils';
import {
  notificationEnabled,
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

  const renderNotificationCheckbox = (
    notificationKeys: string[],
    saving: boolean,
    setSaving: (saving: boolean) => void,
    notificationType: string,
    label: string,
    tooltipInfo: string
  ) => {
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
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
          <span style={{ marginLeft: '1ch' }}>{label}</span>
        </LabeledCheckbox>
        <InfoBox style={{ marginLeft: '1ch' }}>{tooltipInfo}</InfoBox>
        {saving && <Spinner size={12} style={{ marginLeft: '1ch' }} />}
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
