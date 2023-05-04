import _ from 'lodash/fp';
import { Fragment, useEffect, useRef, useState } from 'react';
import { div, fieldset, h, label, legend, span } from 'react-hyperscript-helpers';
import ReactJson from 'react-json-view';
import { IdContainer, LabeledCheckbox, Link, RadioButton, Select, Switch } from 'src/components/common';
import { convertAttributeValue, getAttributeType } from 'src/components/data/attribute-utils';
import { icon } from 'src/components/icons';
import { NumberInput, TextInput } from 'src/components/input';
import TooltipTrigger from 'src/components/TooltipTrigger';
import * as Utils from 'src/libs/utils';

export const AttributeTypeInput = ({
  label: labelText = 'Type',
  value,
  onChange,
  entityTypes = [],
  defaultReferenceEntityType = null,
  showJsonTypeOption = false,
}) => {
  const { type, entityType: referenceEntityType } = value;

  const typeOptions = [{ type: 'string' }, { type: 'reference', tooltip: 'A link to another row' }, { type: 'number' }, { type: 'boolean' }];

  if (showJsonTypeOption) {
    typeOptions.push({ type: 'json', label: 'JSON' });
  }

  const sortedEntityTypes = _.sortBy(_.identity, entityTypes);

  return div({ style: { marginBottom: '1rem' } }, [
    fieldset({ style: { border: 'none', margin: 0, padding: 0 } }, [
      legend({ style: { marginBottom: '0.5rem' } }, [`${labelText}:`]),
      div(
        {
          style: {
            display: 'flex',
            flexFlow: 'row',
            justifyContent: 'space-between',
            marginBottom: '0.5rem',
          },
        },
        _.map(
          ({ label, type: typeOption, tooltip }) =>
            h(TooltipTrigger, { content: tooltip }, [
              span({ style: { display: 'inline-block', whiteSpace: 'nowrap' } }, [
                h(RadioButton, {
                  text: label || _.startCase(typeOption),
                  checked: type === typeOption,
                  onChange: () => {
                    const newType = { type: typeOption };
                    if (typeOption === 'reference') {
                      newType.entityType = defaultReferenceEntityType || sortedEntityTypes[0];
                    }
                    onChange(newType);
                  },
                  labelStyle: { paddingLeft: '0.5rem' },
                }),
              ]),
            ]),
          typeOptions
        )
      ),
    ]),
    type === 'reference' &&
      div({ style: { marginTop: '0.5rem' } }, [
        h(IdContainer, [
          (id) =>
            h(Fragment, [
              label({ htmlFor: id, style: { marginBottom: '0.5rem' } }, 'Referenced entity type:'),
              h(Select, {
                id,
                value: referenceEntityType,
                options: sortedEntityTypes,
                onChange: ({ value: newReferenceEntityType }) => {
                  onChange({ ...value, entityType: newReferenceEntityType });
                },
              }),
            ]),
        ]),
      ]),
  ]);
};

const renderInputForAttributeType = _.curry((attributeType, props) => {
  return Utils.switchCase(
    attributeType,
    [
      'string',
      () => {
        const { value = '', ...otherProps } = props;
        return h(TextInput, {
          autoFocus: true,
          placeholder: 'Enter a value',
          value,
          ...otherProps,
        });
      },
    ],
    [
      'reference',
      () => {
        const { value, onChange, ...otherProps } = props;
        return h(TextInput, {
          autoFocus: true,
          placeholder: `Enter a ${value.entityType}_id`,
          value: value.entityName,
          onChange: (v) => onChange({ ...value, entityName: v }),
          ...otherProps,
        });
      },
    ],
    [
      'number',
      () => {
        const { value = 0, ...otherProps } = props;
        return h(NumberInput, { autoFocus: true, isClearable: false, value, ...otherProps });
      },
    ],
    [
      'boolean',
      () => {
        const { value = false, ...otherProps } = props;
        return div({ style: { flexGrow: 1, display: 'flex', alignItems: 'center', height: '2.25rem' } }, [
          h(Switch, { checked: value, ...otherProps }),
        ]);
      },
    ],
    [
      'json',
      () => {
        const { value, onChange, ...otherProps } = props;
        return h(ReactJson, {
          ...otherProps,
          style: { ...otherProps.style, whiteSpace: 'pre-wrap' },
          src: value,
          displayObjectSize: false,
          displayDataTypes: false,
          enableClipboard: false,
          name: false,
          onAdd: _.flow(_.get('updated_src'), onChange),
          onDelete: _.flow(_.get('updated_src'), onChange),
          onEdit: _.flow(_.get('updated_src'), onChange),
        });
      },
    ]
  );
});

const defaultValueForAttributeType = (attributeType, referenceEntityType) => {
  return Utils.switchCase(
    attributeType,
    ['string', () => ''],
    ['reference', () => ({ entityName: '', entityType: referenceEntityType })],
    ['number', () => 0],
    ['boolean', () => false],
    ['json', () => ({})]
  );
};

const AttributeInput = ({ autoFocus = false, value: attributeValue, initialValue, onChange, entityTypes = [], showJsonTypeOption = false }) => {
  const [edited, setEdited] = useState(false);
  const { type: attributeType, isList } = getAttributeType(attributeValue);

  const renderInput = renderInputForAttributeType(attributeType);

  const referenceEntityType = Utils.cond(
    [attributeType === 'reference' && isList, () => (!_.isEmpty(attributeValue.items) ? attributeValue.items[0].entityType : entityTypes[0])],
    [attributeType === 'reference', () => attributeValue.entityType]
  );
  const defaultValue = defaultValueForAttributeType(attributeType, referenceEntityType);

  const focusLastListItemInput = useRef(false);
  const lastListItemInput = useRef(null);
  useEffect(() => {
    if (!isList) {
      lastListItemInput.current = null;
    }
    if (focusLastListItemInput.current && lastListItemInput.current) {
      lastListItemInput.current.focus();
      focusLastListItemInput.current = false;
    }
  }, [attributeValue, isList]);

  return h(Fragment, [
    h(AttributeTypeInput, {
      label: isList ? 'List item type' : 'Type',
      value: { type: attributeType, entityType: referenceEntityType },
      entityTypes,
      defaultReferenceEntityType: referenceEntityType,
      showJsonTypeOption: attributeType === 'json' || showJsonTypeOption,
      onChange: ({ type: newType, entityType: newEntityType }) => {
        const newAttributeValue = convertAttributeValue(initialValue && !edited ? initialValue : attributeValue, newType, newEntityType);
        onChange(newAttributeValue);
      },
    }),
    attributeType !== 'json' &&
      div({ style: { marginBottom: '0.5rem' } }, [
        h(
          LabeledCheckbox,
          {
            checked: isList,
            onChange: (willBeList) => {
              const newAttributeValue = willBeList
                ? { items: [attributeValue], itemsType: attributeType === 'reference' ? 'EntityReference' : 'AttributeValue' }
                : attributeValue.items[0];
              onChange(newAttributeValue);
            },
          },
          [span({ style: { marginLeft: '0.5rem' } }, ['Value is a list'])]
        ),
      ]),
    isList
      ? h(Fragment, [
          div(
            { style: { marginTop: '1rem' } },
            _.map(
              ([i, value]) =>
                div(
                  {
                    style: { display: 'flex', alignItems: 'center', marginBottom: '0.5rem' },
                  },
                  [
                    renderInput({
                      'aria-label': `List value ${i + 1}`,
                      autoFocus: i === 0 && autoFocus,
                      ref: i === attributeValue.items.length - 1 ? lastListItemInput : undefined,
                      value,
                      onChange: (v) => {
                        const newAttributeValue = _.update('items', _.set(i, v), attributeValue);
                        setEdited(true);
                        onChange(newAttributeValue);
                      },
                    }),
                    h(
                      Link,
                      {
                        'aria-label': `Remove list value ${i + 1}`,
                        disabled: _.size(attributeValue.items) === 1,
                        onClick: () => {
                          const newAttributeValue = _.update('items', _.pullAt(i), attributeValue);
                          setEdited(true);
                          onChange(newAttributeValue);
                        },
                        style: { marginLeft: '0.5rem' },
                      },
                      [icon('times', { size: 20 })]
                    ),
                  ]
                ),
              Utils.toIndexPairs(attributeValue.items)
            )
          ),
          h(
            Link,
            {
              style: { display: 'block', marginTop: '1rem' },
              onClick: () => {
                focusLastListItemInput.current = true;
                const newAttributeValue = _.update('items', Utils.append(defaultValue), attributeValue);
                setEdited(true);
                onChange(newAttributeValue);
              },
            },
            [icon('plus', { style: { marginRight: '0.5rem' } }), 'Add item']
          ),
        ])
      : div({ style: { marginTop: '1.5rem' } }, [
          renderInput({
            'aria-label': 'New value',
            autoFocus,
            value: attributeValue,
            onChange: (v) => {
              setEdited(true);
              onChange(v);
            },
          }),
        ]),
  ]);
};

export default AttributeInput;
