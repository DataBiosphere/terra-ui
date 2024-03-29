import { Modal } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { ReactNode, useState } from 'react';
import { div, h, p, span, table, tbody, td, th, thead, tr } from 'react-hyperscript-helpers';
import { ButtonPrimary, Link } from 'src/components/common';
import { centeredSpinner, icon } from 'src/components/icons';
import { Ajax } from 'src/libs/ajax';
import { CurrentUserGroupMembership } from 'src/libs/ajax/Groups';
import { withErrorReporting } from 'src/libs/error';
import { useCancellation, useOnMount } from 'src/libs/react-utils';
import { getTerraUser } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { cond, withBusyState } from 'src/libs/utils';
import {
  azureControlledAccessRequestMessage,
  GoogleWorkspaceInfo,
  isAzureWorkspace,
  WorkspaceWrapper as Workspace,
} from 'src/workspaces/utils';

interface RequestAccessModalProps {
  onDismiss: () => void;
  workspace: Workspace;
}

export const RequestAccessModal = (props: RequestAccessModalProps): ReactNode => {
  return isAzureWorkspace(props.workspace)
    ? h(AzureRequestAccessModal, { onDismiss: props.onDismiss })
    : h(GcpRequestAccessModal, {
        onDismiss: props.onDismiss,
        workspaceInfo: props.workspace.workspace,
      });
};

interface GcpRequestAccessModalProps {
  onDismiss: () => void;
  workspaceInfo: GoogleWorkspaceInfo;
}

const GcpRequestAccessModal = (props: GcpRequestAccessModalProps): ReactNode => {
  const [groups, setGroups] = useState<CurrentUserGroupMembership[]>([]);
  const [loading, setLoading] = useState(false);
  const signal = useCancellation();
  const workspace = props.workspaceInfo;

  const fetchGroups = async () => {
    setGroups(await Ajax(signal).Groups.list());
  };

  useOnMount(() => {
    const load = _.flow(
      withBusyState(setLoading),
      withErrorReporting('Error loading groups')
    )(async () => {
      await fetchGroups();
    });
    load();
  });

  const groupNames = _.map('groupName', groups);

  return h(
    Modal,
    {
      title: 'Request Access',
      width: '40rem',
      showCancel: false,
      onDismiss: props.onDismiss,
    },
    [
      div([
        `
      You cannot access this workspace because it is protected by an Authorization Domain.
      You need to obtain permission from an admin of each group in the Authorization Domain in order to get access.
      Clicking the "Request Access" button below will send an email to the admins of that group.`,
      ]),
      div({ style: { marginTop: '1rem' } }, [
        h(
          Link,
          {
            href: 'https://support.terra.bio/hc/en-us/articles/360026775691',
            ...Utils.newTabLinkProps,
          },
          ['Learn more about Authorization Domains', icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } })]
        ),
      ]),
      loading
        ? centeredSpinner({ size: 32 })
        : table({ style: { margin: '1rem', width: '100%' } }, [
            thead([
              tr({ style: { height: '2rem' } }, [
                th({ style: { textAlign: 'left' } }, ['Group Name']),
                th({ style: { textAlign: 'left', width: '15rem' } }, ['Access']),
              ]),
            ]),
            tbody(
              _.map(
                ({ membersGroupName: groupName }) =>
                  tr({ style: { height: '2rem' } }, [
                    td([groupName]),
                    td([
                      _.includes(groupName, groupNames)
                        ? span({ style: { fontWeight: 600 } }, ['Yes'])
                        : h(RequestAccessButton, {
                            groupName,
                          }),
                    ]),
                  ]),
                workspace.authorizationDomain
              )
            ),
          ]),
    ]
  );
};

interface RequestAccessButtonProps {
  groupName: string;
}

const RequestAccessButton = (props: RequestAccessButtonProps): ReactNode => {
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);
  const signal = useCancellation();

  const { Groups } = Ajax(signal);

  const requestAccess = _.flow(
    withBusyState(setRequesting),
    withErrorReporting('Error requesting group access')
  )(async () => {
    await Groups.group(props.groupName).requestAccess();
    setRequested(true);
  });

  return h(
    ButtonPrimary,
    {
      disabled: requesting || requested,
      'aria-label': `Request access to ${props.groupName}`,
      onClick: async () => {
        await requestAccess();
      },
    },
    [cond([requested, () => 'Request Sent'], [requesting, () => 'Sending Request...'], () => 'Request Access')]
  );
};

interface AzureRequestAccessModalProps {
  onDismiss: () => void;
}

const AzureRequestAccessModal = (props: AzureRequestAccessModalProps): ReactNode => {
  return h(
    Modal,
    {
      title: 'No Workspace Access',
      width: '40rem',
      showCancel: false,
      onDismiss: props.onDismiss,
    },
    [
      'You are currently logged in as ',
      span({ style: { fontWeight: 600 } }, [getTerraUser().email]),
      '. You may have access with a different account, or your linked identity may have expired. ',
      h(
        Link,
        {
          href: 'https://support.terra.bio/hc/en-us/articles/19124069598235',
          ...Utils.newTabLinkProps,
        },
        ['Learn more about linking your NIH account', icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } })]
      ),
      p([azureControlledAccessRequestMessage]),
    ]
  );
};
