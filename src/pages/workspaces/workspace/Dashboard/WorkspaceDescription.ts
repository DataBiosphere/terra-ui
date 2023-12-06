import { ButtonPrimary, ButtonSecondary, Link } from '@terra-ui-packages/components';
import { cond } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import { Fragment, ReactNode, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { spinnerOverlay } from 'src/components/common';
import { icon } from 'src/components/icons';
import { MarkdownEditor, MarkdownViewer } from 'src/components/markdown';
import { Ajax } from 'src/libs/ajax';
import { reportError } from 'src/libs/error';
import * as Style from 'src/libs/style';
import { withBusyState } from 'src/libs/utils';
import { canEditWorkspace, WorkspaceWrapper as Workspace } from 'src/libs/workspace-utils';

interface WorkspaceDescriptionProps {
  workspace: Workspace;
  refreshWorkspace: () => void;
}

export const WorkspaceDescription = (props: WorkspaceDescriptionProps): ReactNode => {
  const { workspace, refreshWorkspace } = props;

  const description = workspace.workspace?.attributes?.description?.toString() ?? '';

  const [editDescription, setEditDescription] = useState<string>();
  const [saving, setSaving] = useState<boolean>(false);

  const isEditing = _.isString(editDescription);

  // @ts-expect-error
  const { value: canEdit, message: editErrorMessage } = canEditWorkspace(workspace);

  const save = withBusyState(setSaving, async (): Promise<void> => {
    try {
      const { namespace, name } = workspace.workspace;
      await Ajax().Workspaces.workspace(namespace, name).shallowMergeNewAttributes({ description: editDescription });
      refreshWorkspace();
    } catch (error) {
      reportError('Error saving workspace', error);
    } finally {
      setEditDescription(undefined);
    }
  }) as (description?: string) => Promise<void>;

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
            onClick: () => setEditDescription(description),
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
              value: editDescription,
              onChange: setEditDescription,
            }),
            div({ style: { display: 'flex', justifyContent: 'flex-end', margin: '1rem' } }, [
              h(ButtonSecondary, { onClick: () => setEditDescription(undefined) }, ['Cancel']),
              h(ButtonPrimary, { style: { marginLeft: '1rem' }, onClick: () => save }, ['Save']),
            ]),
            saving && spinnerOverlay,
          ]),
      ],

      [!!description, () => h(MarkdownViewer, [description])],
      () => div({ style: { fontStyle: 'italic' } }, ['No description added'])
    ),
  ]);
};
