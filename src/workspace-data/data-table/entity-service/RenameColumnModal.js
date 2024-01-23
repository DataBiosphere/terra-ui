import { Fragment, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { ButtonPrimary, IdContainer, spinnerOverlay } from 'src/components/common';
import { ValidatedInput } from 'src/components/input';
import Modal from 'src/components/Modal';
import { Ajax } from 'src/libs/ajax';
import { reportError } from 'src/libs/error';
import { FormLabel } from 'src/libs/forms';
import * as Utils from 'src/libs/utils';
import { isGoogleWorkspace } from 'src/libs/workspace-utils';
import validate from 'validate.js';

export const RenameColumnModal = ({ onDismiss, onSuccess, workspace, entityType, oldAttributeName, dataProvider }) => {
  // State
  const [newAttributeName, setNewAttributeName] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  // TODO match the actual naming convention:
  //  Composed of only letters, numbers, underscores, or dashes; regex match "[A-z0-9_-]+"
  // Not one of these reserved words:
  // “name”
  // “entityType”
  // “${entityType}_id”, where ${entityType} is the name of the data table
  // As an example of restriction 2.3, if your table is named "sample", then "sample_id" is a reserved word. If your table is named "aliquot", then "aliquot_id" is a reserved word.
  const columnNameErrors = validate.single(newAttributeName, {
    presence: {
      allowEmpty: false,
      message: 'Column name is required',
    },
    format: {
      pattern: `^(?:name|entityType|${entityType}_id|[A-z0-9_-]+)`,
      flags: 'i',
      message: 'Column name may only contain alphanumeric characters, underscores, dashes, and periods.',
    },
  });

  const renameColumn = async () => {
    try {
      setIsBusy(true);
      if (isGoogleWorkspace(workspace)) {
        await Ajax()
          .Workspaces.workspace(workspace.workspace.namespace, workspace.workspace.name)
          .renameEntityColumn(entityType, oldAttributeName, newAttributeName);
      } else {
        // Azure
        await dataProvider.updateAttribute(entityType, oldAttributeName, {
          name: newAttributeName,
        });
      }
      onSuccess();
    } catch (e) {
      onDismiss();
      reportError('Unable to rename column.', e);
    }
  };

  return h(
    Modal,
    {
      onDismiss,
      title: 'Rename Column',
      okButton: h(
        ButtonPrimary,
        {
          disabled: isBusy || columnNameErrors,
          onClick: renameColumn,
        },
        ['Rename']
      ),
    },
    [
      h(IdContainer, [
        (id) =>
          h(Fragment, [
            div('Workflow configurations that reference the current column name will need to be updated manually.'),
            h(FormLabel, { htmlFor: id, required: true }, ['New Name']),
            h(ValidatedInput, {
              inputProps: {
                id,
                value: newAttributeName,
                autoFocus: true,
                placeholder: 'Enter a name',
                onChange: (v) => {
                  setNewAttributeName(v);
                },
              },
              error: Utils.summarizeErrors(columnNameErrors),
            }),
            isBusy && spinnerOverlay,
          ]),
      ]),
    ]
  );
};
