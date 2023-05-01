import _ from 'lodash/fp';
import { useState } from 'react';
import { div, h, span, table, tbody, td, th, thead, tr } from 'react-hyperscript-helpers';
import { ButtonPrimary, Link } from 'src/components/common';
import { centeredSpinner, icon } from 'src/components/icons';
import Modal from 'src/components/Modal';
import { Ajax } from 'src/libs/ajax';
import { withErrorReporting } from 'src/libs/error';
import { useCancellation, useOnMount } from 'src/libs/react-utils';
import { cond, withBusyState } from 'src/libs/utils';

export const RequestAccessModal = ({ onDismiss, workspace }) => {
  const [groups, setGroups] = useState([]);
  const [accessInstructions, setAccessInstructions] = useState([]);
  const [loading, setLoading] = useState(false);
  const signal = useCancellation();

  const { Groups, Workspaces } = Ajax(signal);

  const fetchGroups = withErrorReporting('Error loading groups')(async () => {
    setGroups(await Groups.list());
  });

  const fetchAccessInstructions = withErrorReporting('Error loading instructions')(async () => {
    setAccessInstructions(await Workspaces.workspace(workspace.workspace.namespace, workspace.workspace.name).accessInstructions());
  });

  const fetchAll = withBusyState(setLoading)(async () => {
    await Promise.all([fetchGroups(), fetchAccessInstructions()]);
  });

  useOnMount(() => {
    fetchAll();
  });

  const groupNames = _.map('groupName', groups);
  const authDomain = workspace.workspace.authorizationDomain;
  return h(
    Modal,
    {
      title: 'Request Access',
      width: '40rem',
      showCancel: false,
      onDismiss,
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
                            instructions: accessInstructions[groupName],
                          }),
                    ]),
                  ]),
                authDomain
              )
            ),
          ]),
    ]
  );
};

const RequestAccessButton = ({ groupName }) => {
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);
  const signal = useCancellation();

  const { Groups } = Ajax(signal);

  const requestAccess = _.flow(
    withBusyState(setRequesting),
    withErrorReporting('Error requesting group access')
  )(async () => {
    await Groups.group(groupName).requestAccess();
    setRequested(true);
  });

  return h(
    ButtonPrimary,
    {
      disabled: requesting || requested,
      onClick: async () => {
        await requestAccess();
      },
    },
    [cond([requested, () => 'Request Sent'], [requesting, () => 'Sending Request...'], () => 'Request Access')]
  );
};
