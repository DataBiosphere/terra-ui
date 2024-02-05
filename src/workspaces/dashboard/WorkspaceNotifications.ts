import { InfoBox, Spinner } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { ReactNode, useState } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import { refreshTerraProfile } from 'src/auth/auth';
import { LabeledCheckbox } from 'src/components/common';
import { Ajax } from 'src/libs/ajax';
import { withErrorReporting } from 'src/libs/error';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { userStore } from 'src/libs/state';
import { withBusyState } from 'src/libs/utils';
import { WorkspaceWrapper as Workspace } from 'src/workspaces/utils';

interface WorkspaceNotificationsProps {
  workspace: Workspace;
}

export const WorkspaceNotifications = (props: WorkspaceNotificationsProps): ReactNode => {
  const {
    workspace: { namespace, name },
  } = props.workspace;

  const [saving, setSaving] = useState(false);

  const notificationsPreferences = _.pickBy((_v, k) => _.startsWith('notifications/', k), userStore.get().profile);

  // TODO: These keys are not included in the type of the user store profile object
  const submissionNotificationKeys = [
    `notifications/SuccessfulSubmissionNotification/${namespace}/${name}`,
    `notifications/FailedSubmissionNotification/${namespace}/${name}`,
    `notifications/AbortedSubmissionNotification/${namespace}/${name}`,
  ];

  const submissionNotificationsEnabled = !_.isMatch(
    _.fromPairs(_.map((k) => [k, 'false'], submissionNotificationKeys)),
    notificationsPreferences
  );

  return div({ style: { margin: '0.5rem' } }, [
    div({ style: { display: 'flex', alignItems: 'center' } }, [
      h(
        LabeledCheckbox,
        {
          checked: submissionNotificationsEnabled,
          disabled: saving,
          onChange: _.flow(
            withBusyState(setSaving),
            withErrorReporting('Error saving preferences')
          )(async (value) => {
            await Ajax().User.profile.setPreferences(
              _.fromPairs(_.map((k) => [k, JSON.stringify(value)], submissionNotificationKeys))
            );
            await refreshTerraProfile();
            Ajax().Metrics.captureEvent(Events.notificationToggle, {
              notificationKeys: submissionNotificationKeys,
              enabled: value,
              ...extractWorkspaceDetails(props.workspace),
            });
          }),
        },
        [span({ style: { marginLeft: '1ch' } }, ['Receive submission notifications'])]
      ),
      h(InfoBox, { style: { marginLeft: '1ch' } }, [
        'Receive email notifications when a submission in this workspace has succeeded, failed, or been aborted.',
      ]),
      saving && h(Spinner, { size: 12, style: { marginLeft: '1ch' } }),
    ]),
  ]);
};
