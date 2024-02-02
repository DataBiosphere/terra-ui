import { Fragment, ReactNode, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { ButtonPrimary, IdContainer, spinnerOverlay } from 'src/components/common';
import { ValidatedInput } from 'src/components/input';
import Modal from 'src/components/Modal';
import { reportError } from 'src/libs/error';
import { FormLabel } from 'src/libs/forms';
import * as Utils from 'src/libs/utils';
import validate from 'validate.js';

export type RenameColumnModalProps = {
  onDismiss: () => void;
  onSuccess: () => void;
  workspace: any;
  entityType: string;
  attributeNames: string[];
  oldAttributeName: string;
  dataProvider: any;
};

export const RenameColumnModal = (props: RenameColumnModalProps): ReactNode => {
  // State
  const [newAttributeName, setNewAttributeName] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const { onDismiss, onSuccess, entityType, attributeNames, oldAttributeName, dataProvider } = props;

  // Imposes same constraints on GCP and Azure:
  // Composed of only letters, numbers, underscores, or dashes; regex match "[A-z0-9_-]+"
  // Not one of these reserved words:
  //   “name”
  //   “entityType”
  //   “${entityType}_id”, where ${entityType} is the name of the data table
  // Does not begin with “sys_”
  const columnNameErrors = validate.single(newAttributeName, {
    presence: {
      allowEmpty: false,
      message: 'Column name is required',
    },
    format: {
      pattern: `^(?!name$|entityType$|${entityType}_id$|sys_)[A-Za-z0-9_-]+$`,
      flags: 'i',
      message: Utils.cond(
        [
          ['name', 'entityType', `${entityType}_id`].includes(newAttributeName),
          () => `Column name cannot be "name", "entityType" or "${entityType}_id".`,
        ],
        [newAttributeName.startsWith('sys_'), () => 'Column name cannot start with "sys_".'],

        () => 'Column name may only contain alphanumeric characters, underscores, and dashes.'
      ),
    },
    exclusion: {
      within: attributeNames,
      message: "'%{value}' already exists as an attribute name",
    },
  });

  const renameColumn = async () => {
    try {
      setIsBusy(true);
      await dataProvider.updateAttribute({ entityType, oldAttributeName, newAttributeName });
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
            div(['Workflow configurations that reference the current column name will need to be updated manually.']),
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
