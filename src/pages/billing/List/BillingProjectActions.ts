import _ from 'lodash/fp';
import { useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import { Ajax } from 'src/libs/ajax';
import { reportError } from 'src/libs/error';
import * as Nav from 'src/libs/nav';
import * as Utils from 'src/libs/utils';
import { WorkspaceWrapper } from 'src/libs/workspace-utils';
import DeleteBillingProjectModal from 'src/pages/billing/DeleteBillingProjectModal';

export interface BillingProjectActionsProps {
  projectName: string;
  loadProjects: () => void;
  workspacesLoading: boolean;
  allWorkspaces: WorkspaceWrapper[] | undefined;
}

export const BillingProjectActions = (props: BillingProjectActionsProps) => {
  const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const hasWorkspaces = _.find({ namespace: props.projectName }, _.map('workspace', props.allWorkspaces)) !== undefined;

  return div({ style: { marginLeft: 'auto' } }, [
    h(
      Link,
      {
        disabled: props.workspacesLoading || hasWorkspaces,
        tooltip: Utils.cond(
          [props.workspacesLoading, () => 'Cannot delete billing project while workspaces are loading'],
          [hasWorkspaces, () => 'Cannot delete billing project because it contains workspaces'],
          () => `Delete billing project ${props.projectName}`
        ),
        style: { padding: '0.5rem' },
        onClick: () => setShowDeleteProjectModal(true),
      },
      [icon('trash')]
    ),

    showDeleteProjectModal &&
      h(DeleteBillingProjectModal, {
        projectName: props.projectName,
        deleting,
        onDismiss: () => setShowDeleteProjectModal(false),
        onConfirm: async () => {
          setDeleting(true);
          try {
            await Ajax().Billing.deleteProject(props.projectName);
            setShowDeleteProjectModal(false);
            props.loadProjects();
            Nav.history.replace({ search: '' });
          } catch (err) {
            reportError('Error deleting billing project.', err);
            setShowDeleteProjectModal(false);
          }
          setDeleting(false);
        },
      }),
  ]);
};
