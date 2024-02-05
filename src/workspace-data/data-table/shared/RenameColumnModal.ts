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

  // For both GCP and Azure:
  // Cannot be blank or matching an existing attribute
  const mutualColumnNameErrors = validate.single(newAttributeName, {
    presence: {
      allowEmpty: false,
      message: 'Column name is required',
    },
    exclusion: {
      within: attributeNames,
      message: "'%{value}' already exists as an attribute name",
    },
  });

  // On GCP only, cannot be one of these reserved words:
  //   “name”
  //   “entityType”
  //   “${entityType}_id”, where ${entityType} is the name of the data table
  // A single colon is allowed (for namespacing), otherwise only alphanumeric characters, underscores, and dashes are allowed
  const gcpColumnNameErrors =
    dataProvider.providerName === 'Entity Service'
      ? validate.single(newAttributeName, {
          exclusion: {
            within: ['name', 'entityType', `${entityType}_id`],
            message: `Column name cannot be "name", "entityType" or "${entityType}_id".`,
          },
          format: {
            pattern: '[A-Za-z0-9_-]*:?[A-Za-z0-9_-]+$',
            message: Utils.cond(
              [newAttributeName.includes(':'), () => 'Column name may only include a single colon.'],
              () => 'Column name may only contain alphanumeric characters, underscores, and dashes.'
            ),
          },
        })
      : [];

  // On Azure only, cannot begin with “sys_”
  // Must contain only alphanumeric characters, underscores, and dashes
  const azureColumnNameErrors =
    dataProvider.providerName === 'WDS'
      ? validate.single(newAttributeName, {
          format: {
            pattern: '^(?!sys_)[A-Za-z0-9_-]+$',
            message: Utils.cond(
              [newAttributeName.startsWith('sys_'), () => 'Column name cannot start with "sys_"'],
              () => 'Column name may only contain alphanumeric characters, underscores, and dashes.'
            ),
          },
        })
      : [];

  const columnNameErrors = [
    ...(mutualColumnNameErrors || []),
    ...(gcpColumnNameErrors || []),
    ...(azureColumnNameErrors || []),
  ];

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
          disabled: isBusy || columnNameErrors.length > 0,
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
