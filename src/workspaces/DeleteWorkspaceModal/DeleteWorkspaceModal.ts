import { Modal } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import pluralize from 'pluralize';
import { ReactNode, useState } from 'react';
import { b, div, h, label, p, span } from 'react-hyperscript-helpers';
import { bucketBrowserUrl } from 'src/auth/auth';
import { ButtonPrimary, Link, spinnerOverlay } from 'src/components/common';
import { icon } from 'src/components/icons';
import { TextInput } from 'src/components/input';
import colors from 'src/libs/colors';
import { warningBoxStyle } from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { useDeleteWorkspaceState } from 'src/workspaces/DeleteWorkspaceModal/state/useDeleteWorkspaceState';
import { isGoogleWorkspace, WorkspaceWrapper as Workspace } from 'src/workspaces/utils';

interface DeleteWorkspaceModalProps {
  workspace: Workspace;
  onDismiss: () => void;
  onSuccess: () => void;
}

export const DeleteWorkspaceModal = (props: DeleteWorkspaceModalProps): ReactNode => {
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const { workspace, onDismiss, onSuccess } = props;
  const {
    workspaceResources,
    loading,
    deleting,
    isDeleteDisabledFromResources,
    workspaceBucketUsageInBytes,
    collaboratorEmails,
    deleteWorkspace,
  } = useDeleteWorkspaceState({ workspace, onDismiss, onSuccess });

  const numDeletableResources =
    (workspaceResources?.deleteableApps.length ?? 0) + (workspaceResources?.deleteableRuntimes.length ?? 0);

  const getStorageDeletionMessage = () => {
    return div({ style: { marginTop: '1rem' } }, [
      'Deleting it will delete the associated ',
      isGoogleWorkspace(props.workspace)
        ? h(
            Link,
            {
              ...Utils.newTabLinkProps,
              href: bucketBrowserUrl(props.workspace.workspace.bucketName),
            },
            ['Google Cloud Bucket']
          )
        : 'Azure Storage Container',
      ' and all its data',
      workspaceBucketUsageInBytes !== undefined &&
        span({ style: { fontWeight: 600 } }, [` (${Utils.formatBytes(workspaceBucketUsageInBytes)})`]),
      '.',
    ]);
  };

  const getResourceDeletionMessage = () => {
    const nonDeletableResourceMessage =
      'You cannot delete this workspace because it contains at least one cloud resource, ' +
      'such as an application or cloud environment, that is in an undeletable state. Please try again in a few minutes.';
    return isDeleteDisabledFromResources
      ? div({ style: { ...warningBoxStyle, fontSize: 14, display: 'flex', flexDirection: 'column' } }, [
          div({ style: { display: 'flex', flexDirection: 'row', alignItems: 'center' } }, [
            icon('warning-standard', {
              size: 19,
              style: { color: colors.warning(), flex: 'none', marginRight: '0.5rem' },
            }),
            'Undeletable Workspace Warning',
          ]),
          p({ style: { fontWeight: 'normal' } }, [nonDeletableResourceMessage]),
        ])
      : p(['Deleting it will also automatically delete all cloud resources in the workspace.']);
  };

  const getWorkspaceName = () => {
    return span({ style: { fontWeight: 600, wordBreak: 'break-word' } }, [workspace.workspace.name]);
  };

  if (loading) {
    // only show the deletion modal when we have all of our constituent data elements
    return div([spinnerOverlay]);
  }
  return h(
    Modal,
    {
      title: span({ style: { display: 'flex', alignItems: 'center' } }, [
        icon('warning-standard', { size: 24, color: colors.warning() }),
        span({ style: { marginLeft: '1ch' } }, ['Delete workspace']),
      ]),
      onDismiss,
      okButton: h(
        ButtonPrimary,
        {
          disabled: _.toLower(deleteConfirmation) !== 'delete workspace' || isDeleteDisabledFromResources,
          onClick: deleteWorkspace,
          tooltip: Utils.cond(
            [
              isDeleteDisabledFromResources && isGoogleWorkspace(workspace),
              () => 'You must ensure all apps in this workspace are deletable',
            ],
            [_.toLower(deleteConfirmation) !== 'delete workspace', () => 'You must type the confirmation message'],
            () => ''
          ),
        },
        ['Delete workspace']
      ),
      styles: { modal: { background: colors.warning(0.1) } },
    },
    [
      div(['Are you sure you want to permanently delete the workspace ', getWorkspaceName(), '?']),
      getStorageDeletionMessage(),
      isDeleteDisabledFromResources && div({ style: { marginTop: '1rem' } }, [getResourceDeletionMessage()]),
      !isDeleteDisabledFromResources &&
        numDeletableResources > 0 &&
        div({ style: { marginTop: '1rem' } }, [getResourceDeletionMessage()]),
      collaboratorEmails &&
        collaboratorEmails.length > 0 &&
        div({ style: { marginTop: '1rem' } }, [
          p([`${pluralize('collaborator', collaboratorEmails.length, true)} will lose access to this workspace.`]),
          div(
            collaboratorEmails
              .slice(0, 5)
              .map((email) =>
                div({ key: email, style: { overflow: 'hidden', textOverflow: 'ellipsis' } }, [
                  h(Link, { href: `mailto:${email}` }, [email]),
                ])
              )
          ),
          collaboratorEmails.length > 5 && div([`and ${collaboratorEmails.length - 5} more`]),
        ]),
      !isDeleteDisabledFromResources &&
        b({ style: { display: 'block', marginTop: '1rem' } }, ['This cannot be undone.']),
      !isDeleteDisabledFromResources &&
        div({ style: { display: 'flex', flexDirection: 'column', marginTop: '1rem' } }, [
          label({ htmlFor: 'delete-workspace-confirmation', style: { marginBottom: '0.25rem' } }, [
            "Please type 'Delete Workspace' to continue:",
          ]),
          h(TextInput, {
            id: 'delete-workspace-confirmation',
            placeholder: 'Delete Workspace',
            value: deleteConfirmation,
            onChange: setDeleteConfirmation,
          }),
        ]),
      (deleting || loading) && spinnerOverlay,
    ]
  );
};
