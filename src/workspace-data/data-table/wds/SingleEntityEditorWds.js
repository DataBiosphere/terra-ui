import _ from 'lodash/fp';
import { Fragment, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { ButtonPrimary, ButtonSecondary, spinnerOverlay } from 'src/components/common';
import Modal from 'src/components/Modal';
import { reportError } from 'src/libs/error';

import { getAttributeType } from './attribute-utils';
import AttributeInput from './AttributeInput';

export const SingleEntityEditorWds = ({
  entityType,
  entityName,
  attributeName,
  attributeValue,
  workspaceId,
  onDismiss,
  onSuccess,
  dataProvider,
  entityTypes,
}) => {
  const { type: originalValueType } = getAttributeType(attributeValue);
  const [newValue, setNewValue] = useState(attributeValue);
  const isUnchanged = _.isEqual(attributeValue, newValue);

  const [isBusy, setIsBusy] = useState();

  const modalTitle = `Edit ${typeof attributeValue} value`;
  // console.log("type is: " + typeof attributeValue)
  // format
  // {"name":"sample2","attributes":[{"name":"HG00096","datatype":"STRING"},{"name":"annotated_sex","datatype":"STRING"},{"name":"bmi_baseline","datatype":"STRING"},{"name":"height_baseline","datatype":"NUMBER"},{"name":"sample_id","datatype":"STRING"},{"name":"undefined","datatype":"STRING"}],"count":2504,"primaryKey":"sample_id"}]

  const doEdit = async () => {
    try {
      setIsBusy(true);
      // console.log("new value:", newValue)
      // console.log("old value type:", entityTypes)
      const record = {};
      if (typeof newValue === 'object') {
        record[attributeName] = newValue.items;
      } else {
        record[attributeName] = newValue;
      }

      // console.log(JSON.stringify(record));
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
      title: modalTitle,
      onDismiss,
      showButtons: false,
    },
    [
      h(Fragment, [
        h(AttributeInput, {
          autoFocus: true,
          value: newValue,
          onChange: setNewValue,
          initialValue: attributeValue,
          entityTypes,
          showJsonTypeOption: originalValueType === 'json',
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
