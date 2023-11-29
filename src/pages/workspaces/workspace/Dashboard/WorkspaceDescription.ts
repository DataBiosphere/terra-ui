import { cond } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import { Fragment, ReactNode, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { ButtonPrimary, ButtonSecondary, Link, spinnerOverlay } from 'src/components/common';
import { icon } from 'src/components/icons';
import { MarkdownEditor, MarkdownViewer } from 'src/components/markdown';
import * as Style from 'src/libs/style';
import { canEditWorkspace } from 'src/libs/workspace-utils';
import { InitializedWorkspaceWrapper as Workspace } from 'src/pages/workspaces/hooks/useWorkspace';

interface WorkspaceDescriptionProps {
  workspace: Workspace;
  save: (description?: string) => void;
  saving: boolean;
}

export const WorkspaceDescription = (props: WorkspaceDescriptionProps): ReactNode => {
  const { workspace, save, saving } = props;

  const description = workspace.workspace?.attributes?.description ?? '';

  const [editDescription, setEditDescription] = useState<string>();
  const isEditing = _.isString(editDescription);

  // @ts-expect-error
  const { value: canEdit, message: editErrorMessage } = canEditWorkspace(workspace);

  return div({ style: { flex: 1, display: 'flex' } }, [
    div({ style: Style.dashboard.leftBox }, [
      div({ style: Style.dashboard.header }, [
        'About the workspace',
        !isEditing &&
          h(
            Link,
            {
              style: { marginLeft: '0.5rem' },
              disabled: !canEdit,
              tooltip: canEdit ? 'Edit description' : editErrorMessage,
              onClick: () => setEditDescription(description?.toString()),
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
                h(ButtonPrimary, { style: { marginLeft: '1rem' }, onClick: () => save(editDescription) }, ['Save']),
              ]),
              saving && spinnerOverlay,
            ]),
        ],
        [!!description, () => h(MarkdownViewer, [description?.toString()])],
        () => div({ style: { fontStyle: 'italic' } }, ['No description added'])
      ),
    ]),
  ]);
};
