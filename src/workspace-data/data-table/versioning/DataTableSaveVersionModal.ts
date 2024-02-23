import { Modal } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { Fragment, ReactNode, useState } from 'react';
import { div, fieldset, h, legend } from 'react-hyperscript-helpers';
import { ButtonPrimary, IdContainer, LabeledCheckbox } from 'src/components/common';
import { TextInput } from 'src/components/input';
import { FormLabel } from 'src/libs/forms';

interface DataTableSaveVersionModalProps {
  entityType: string;
  allEntityTypes: string[];
  includeSetsByDefault?: boolean;
  onDismiss: () => void;
  onSubmit: (version: { description: string; includedSetEntityTypes: string[] }) => void;
}

export const DataTableSaveVersionModal = (props: DataTableSaveVersionModalProps): ReactNode => {
  const { entityType, allEntityTypes, includeSetsByDefault = false, onDismiss, onSubmit } = props;

  const relatedSetTables = _.flow(
    _.filter((t: string) => new RegExp(`^${entityType}(_set)+$`).test(t)),
    _.sortBy(_.identity)
  )(allEntityTypes);

  const [description, setDescription] = useState('');
  const [selectedSetTables, setSelectedSetTables] = useState(
    _.fromPairs(_.map((table) => [table, includeSetsByDefault], relatedSetTables))
  );

  return h(
    Modal,
    {
      onDismiss,
      title: `Save version of ${entityType}`,
      okButton: h(
        ButtonPrimary,
        {
          onClick: () =>
            onSubmit({
              description,
              includedSetEntityTypes: _.keys(_.pickBy(_.identity, selectedSetTables)),
            }),
        },
        ['Save']
      ),
    },
    [
      h(IdContainer, [
        (id) =>
          h(Fragment, [
            h(FormLabel, { htmlFor: id }, ['Description']),
            h(TextInput, {
              id,
              placeholder: 'Enter a description',
              value: description,
              onChange: setDescription,
            }),
          ]),
      ]),
      _.size(relatedSetTables) > 0 &&
        fieldset({ style: { border: 'none', margin: '1rem 0 0', padding: 0 } }, [
          legend({ style: { marginBottom: '0.25rem', fontSize: '16px', fontWeight: 600 } }, ['Include set tables?']),
          _.map(
            (table) =>
              div(
                {
                  key: table,
                  style: { marginBottom: '0.25rem' },
                },
                [
                  h(
                    LabeledCheckbox,
                    {
                      checked: selectedSetTables[table],
                      onChange: (value) => setSelectedSetTables(_.set(table, value)),
                    },
                    [table]
                  ),
                ]
              ),
            relatedSetTables
          ),
        ]),
    ]
  );
};
