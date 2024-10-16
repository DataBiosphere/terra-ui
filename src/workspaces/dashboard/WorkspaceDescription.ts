import { ButtonPrimary, ButtonSecondary, Link } from '@terra-ui-packages/components';
import { cond } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import { Fragment, ReactNode, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { spinnerOverlay } from 'src/components/common';
import { icon } from 'src/components/icons';
import { MarkdownEditor, MarkdownViewer } from 'src/components/markdown';
import { Metrics } from 'src/libs/ajax/Metrics';
import { Workspaces } from 'src/libs/ajax/workspaces/Workspaces';
import { reportError } from 'src/libs/error';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import * as Style from 'src/libs/style';
import { withBusyState } from 'src/libs/utils';
import { canEditWorkspace, WorkspaceWrapper as Workspace } from 'src/workspaces/utils';

interface WorkspaceDescriptionProps {
  workspace: Workspace;
  refreshWorkspace: () => void;
}

export const WorkspaceDescription = (props: WorkspaceDescriptionProps): ReactNode => {
  const { workspace, refreshWorkspace } = props;

  const description = workspace.workspace?.attributes?.description?.toString() ?? '';

  const [editedDescription, setEditedDescription] = useState<string>();
  const [saving, setSaving] = useState<boolean>(false);

  const isEditing = _.isString(editedDescription);

  // @ts-expect-error
  const { value: canEdit, message: editErrorMessage } = canEditWorkspace(workspace);

  const save = withBusyState(setSaving, async (): Promise<void> => {
    try {
      const { namespace, name } = workspace.workspace;
      await Workspaces().workspace(namespace, name).shallowMergeNewAttributes({ description: editedDescription });
      refreshWorkspace();
      void Metrics().captureEvent(Events.workspaceDashboardSaveDescription, extractWorkspaceDetails(workspace));
    } catch (error) {
      reportError('Error saving workspace', error);
    } finally {
      setEditedDescription(undefined);
    }
  });

  return h(Fragment, [
    div({ style: Style.dashboard.header }, [
      'About the workspace',
      !isEditing &&
        h(
          Link,
          {
            style: { marginLeft: '0.5rem' },
            disabled: !canEdit,
            tooltip: canEdit ? 'Edit description' : editErrorMessage,
            onClick: () => {
              setEditedDescription(description);
              void Metrics().captureEvent(Events.workspaceDashboardEditDescription, extractWorkspaceDetails(workspace));
            },
          },
          [icon('edit')]
        ),
    ]),
    cond(
      [
        isEditing,
        () =>
          h(Fragment, [
            // @ts-expect-error
            h(MarkdownEditor, {
              placeholder: 'Enter a description',
              value: editedDescription,
              onChange: setEditedDescription,
            }),
            div({ style: { display: 'flex', justifyContent: 'flex-end', margin: '1rem' } }, [
              h(ButtonSecondary, { onClick: () => setEditedDescription(undefined) }, ['Cancel']),
              h(ButtonPrimary, { style: { marginLeft: '1rem' }, onClick: () => save() }, ['Save']),
            ]),
            saving && spinnerOverlay,
          ]),
      ],

      [!!description, () => h(MarkdownViewer, [description])],
      () => div({ style: { fontStyle: 'italic' } }, ['No description added'])
    ),
  ]);
};
