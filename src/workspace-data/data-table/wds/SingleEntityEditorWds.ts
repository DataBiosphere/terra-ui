import _ from 'lodash/fp';
import { Fragment, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { ButtonPrimary, ButtonSecondary, spinnerOverlay } from 'src/components/common';
import Modal from 'src/components/Modal';
import { reportError } from 'src/libs/error';

import { getAttributeType } from './attribute-utils';
import AttributeInput from './AttributeInput';

export interface SingleEntityWdsProps {
  recordType: string;
  recordName: string;
  attributeName: string;
  attributeValue: any;
  workspaceId: string;
  onDismiss: any;
  onSuccess: any;
  dataProvider: any;
  recordTypeAttributes: { name: string; datatype: string }[];
}

export const SingleEntityEditorWds = ({
  recordType,
  recordName,
  attributeName,
  attributeValue,
  workspaceId,
  onDismiss,
  onSuccess,
  dataProvider,
  recordTypeAttributes,
}: SingleEntityWdsProps) => {
  const { type: originalValueType } = getAttributeType(attributeName, recordTypeAttributes, dataProvider);
  const [newValue, setNewValue] = useState(attributeValue);
  const isUnchanged = _.isEqual(attributeValue, newValue);

  const [isBusy, setIsBusy] = useState(false);

  const modalTitle = `Edit ${attributeName} value for ${recordName}`;
  const modalDetails = originalValueType ? `Column type is  ${originalValueType}` : '';

  const doEdit = async () => {
    try {
      setIsBusy(true);
      const record = {};
      // for lists the records will be in the items
      if (newValue.items !== undefined) {
        record[attributeName] = newValue.items;
      } else {
        record[attributeName] = newValue;
      }

      const listOfRecords = { attributes: record };
      await dataProvider.updateRecord({
        instance: workspaceId,
        recordName: recordType,
        recordId: recordName,
        record: listOfRecords,
      });

      onSuccess();
    } catch (e) {
      onDismiss();
      reportError('Unable to modify record', e);
    }
  };

  return h(
    Modal,
    {
      title: modalTitle,
      onDismiss,
      showButtons: false,
    },
    [
      div([modalDetails]),
      h(Fragment, [
        h(AttributeInput, {
          autoFocus: true,
          value: newValue,
          onChange: setNewValue,
          initialValue: attributeValue,
          attributeName,
          recordTypeAttributes,
          dataProvider,
        }),
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
