import _ from 'lodash/fp';
import { Fragment, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { ButtonPrimary, ButtonSecondary, spinnerOverlay } from 'src/components/common';
import { TextInput } from 'src/components/input';
import Modal from 'src/components/Modal';
import { reportError } from 'src/libs/error';

export const SingleEntityEditorWds = ({ entityType, entityName, attributeName, attributeValue, workspaceId, onDismiss, onSuccess, dataProvider }) => {
  const [newValue, setNewValue] = useState(attributeValue);
  const isUnchanged = _.isEqual(attributeValue, newValue);

  const [isBusy, setIsBusy] = useState();

  const doEdit = async () => {
    try {
      setIsBusy(true);
      const record = {};

      // need to run a check to make sure that the type matches
      record[attributeName] = newValue;
      const listOfRecords = { attributes: record };
      await dataProvider.updateRecord({ instance: workspaceId, recordName: entityType, recordId: entityName, record: listOfRecords });

      onSuccess();
    } catch (e) {
      onDismiss();
      reportError('Unable to modify entity', e);
    }
  };

  return h(
    Modal,
    {
      title: 'Edit value',
      onDismiss,
      showButtons: false,
    },
    [
      h(Fragment, [
        div({ style: { marginTop: '1.5rem' } }, [
          h(TextInput, {
            autoFocus: true,
            placeholder: 'Enter a value',
            value: newValue ?? attributeValue,
            onChange: setNewValue,
          }),
        ]),
        div({ style: { marginTop: '2rem', display: 'flex', alignItems: 'baseline' } }, [
          div({ style: { flexGrow: 1 } }),
          h(ButtonSecondary, { style: { marginRight: '1rem' }, onClick: onDismiss }, ['Cancel']),
          h(
            ButtonPrimary,
            {
              onClick: doEdit,
              disabled: isUnchanged || newValue === undefined || newValue === '',
              tooltip: isUnchanged && 'No changes to save',
            },
            ['Save Changes']
          ),
        ]),
      ]),
      isBusy && spinnerOverlay,
    ]
  );
};
