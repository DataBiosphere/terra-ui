import { TooltipTrigger } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { Fragment, useEffect, useRef, useState } from 'react';
import { div, fieldset, h, label, legend, span } from 'react-hyperscript-helpers';
import { IdContainer, LabeledCheckbox, Link, RadioButton, Select } from 'src/components/common';
import { icon } from 'src/components/icons';
import * as Utils from 'src/libs/utils';

import { renderInputForAttributeType } from '../shared/AttributeInput';
import { convertAttributeValue, getAttributeType } from './attribute-utils';

interface AttributeTypeInputProps {
  label?: string;
  value: TypeOption;
  onChange: (newValue: TypeOption) => void;
  entityTypes?: string[];
  defaultReferenceEntityType?: string;
  showJsonTypeOption?: boolean;
}

interface BaseTypeOption {
  type: 'string' | 'reference' | 'number' | 'boolean' | 'json';
}

interface ReferenceTypeOption extends BaseTypeOption {
  entityType: string;
}

function isReferenceTypeOption(typeOption: TypeOption): typeOption is ReferenceTypeOption {
  return typeOption.type === 'reference';
}

interface JsonTypeOption extends BaseTypeOption {
  label: string;
}

function isJsonTypeOption(typeOption: TypeOption): typeOption is JsonTypeOption {
  return 'label' in typeOption;
}

type TypeOption = BaseTypeOption | ReferenceTypeOption | JsonTypeOption;

export const AttributeTypeInput = (props: AttributeTypeInputProps) => {
  const type = props.value.type;
  const labelText = props.label !== undefined && !!props.label ? props.label : 'Type';
  const entityTypes = props.entityTypes !== undefined && !!props.entityTypes ? props.entityTypes : [];
  const defaultReferenceEntityType =
    props.defaultReferenceEntityType !== undefined && !!props.defaultReferenceEntityType
      ? props.defaultReferenceEntityType
      : null;

  const showJsonTypeOption = props.showJsonTypeOption ?? false;

  const typeOptions: TypeOption[] = [
    { type: 'string' },
    { type: 'reference', entityType: defaultReferenceEntityType ?? entityTypes[0] },
    { type: 'number' },
    { type: 'boolean' },
  ];

  if (showJsonTypeOption) {
    typeOptions.push({ type: 'json', label: 'JSON' });
  }

  const sortedEntityTypes: string[] = _.sortBy(_.identity, entityTypes);

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
          (typeOption: TypeOption) =>
            h(TooltipTrigger, { content: isReferenceTypeOption(typeOption) ? 'A link to another row' : '' }, [
              span({ style: { display: 'inline-block', whiteSpace: 'nowrap' } }, [
                h(RadioButton, {
                  name: `radio-button-${typeOption.type}`,
                  text: isJsonTypeOption(typeOption) ? typeOption.label : _.startCase(typeOption.type),
                  checked: type === typeOption.type,
                  onChange: () => {
                    let newType: TypeOption = typeOption;
                    if (isReferenceTypeOption(typeOption)) {
                      newType = {
                        ...typeOption,
                        entityType: defaultReferenceEntityType ?? sortedEntityTypes[0],
                      };
                    }
                    props.onChange(newType);
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
              label({ htmlFor: id, style: { marginBottom: '0.5rem' } }, ['Referenced entity type:']),
              h(Select<string>, {
                id,
                value: (props.value as ReferenceTypeOption).entityType,
                options: sortedEntityTypes,
                onChange: (selectedEntityType) => {
                  const newReferenceEntityType = selectedEntityType?.value;
                  props.onChange({ ...props.value, entityType: newReferenceEntityType });
                },
              }),
            ]),
        ]),
      ]),
  ]);
};

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

type EntityReference = { entityName: string; entityType: string };

type SingleAttributeValue = string | EntityReference | number | boolean | {};

interface AttributeList<T extends SingleAttributeValue = SingleAttributeValue> {
  itemsType: 'AttributeValue' | 'EntityReference';
  items: T[];
}

type AttributeValue = SingleAttributeValue | AttributeList;

function isListValue(value: AttributeValue): value is AttributeList {
  return typeof value === 'object' && 'items' in value;
}

interface AttributeInputProps {
  autoFocus?: boolean;
  attributeValue: AttributeValue;
  initialValue: AttributeValue;
  onChange: (newValue: AttributeValue) => void;
  entityTypes: string[];
  showJsonTypeOption?: boolean;
}

const AttributeInput = (props: AttributeInputProps) => {
  const [edited, setEdited] = useState(false);
  const { type: attributeType, isList } = getAttributeType(props.attributeValue);
  const autoFocus = props.autoFocus || false;
  const entityTypes = props.entityTypes || [];
  const showJsonTypeOption = props.showJsonTypeOption || false;

  const renderInput = renderInputForAttributeType(attributeType);

  const referenceEntityType = Utils.cond(
    [
      attributeType === 'reference' && isListValue(props.attributeValue),
      () =>
        !_.isEmpty((props.attributeValue as AttributeList).items)
          ? ((props.attributeValue as AttributeList).items[0] as EntityReference).entityType
          : entityTypes[0],
    ],
    [attributeType === 'reference', () => (props.attributeValue as EntityReference).entityType]
  );
  const defaultValue = defaultValueForAttributeType(attributeType, referenceEntityType);

  const focusLastListItemInput = useRef(false);
  const lastListItemInput = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (!isList) {
      lastListItemInput.current = null;
    }
    if (focusLastListItemInput.current && lastListItemInput.current) {
      lastListItemInput.current.focus();
      focusLastListItemInput.current = false;
    }
  }, [props.attributeValue, isList]);

  return h(Fragment, [
    h(AttributeTypeInput, {
      label: isList ? 'List item type' : 'Type',
      value: { type: attributeType, entityType: referenceEntityType },
      entityTypes,
      defaultReferenceEntityType: referenceEntityType,
      showJsonTypeOption: attributeType === 'json' || showJsonTypeOption,
      onChange: (typeOption) => {
        const newAttributeValue = convertAttributeValue(
          props.initialValue && !edited ? props.initialValue : props.attributeValue,
          typeOption.type,
          isReferenceTypeOption(typeOption) ? typeOption.entityType : null
        );
        props.onChange(newAttributeValue);
      },
    }),
    attributeType !== 'json' &&
      div({ style: { marginBottom: '0.5rem' } }, [
        h(
          LabeledCheckbox,
          {
            checked: isList,
            onChange: (willBeList) => {
              const newAttributeValue: AttributeValue = willBeList
                ? ({
                    items: [props.attributeValue],
                    itemsType: attributeType === 'reference' ? 'EntityReference' : 'AttributeValue',
                  } as AttributeList)
                : (props.attributeValue as AttributeList).items[0];
              props.onChange(newAttributeValue);
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
                      ref:
                        i === (props.attributeValue as AttributeList).items.length - 1 ? lastListItemInput : undefined,
                      value,
                      onChange: (v) => {
                        const newAttributeValue = _.update('items', _.set(i, v), props.attributeValue as AttributeList);
                        setEdited(true);
                        props.onChange(newAttributeValue);
                      },
                    }),
                    h(
                      Link,
                      {
                        'aria-label': `Remove list value ${i + 1}`,
                        disabled: _.size((props.attributeValue as AttributeList).items) === 1,
                        onClick: () => {
                          const newAttributeValue = _.update(
                            'items',
                            _.pullAt(i),
                            props.attributeValue as AttributeList
                          );
                          setEdited(true);
                          props.onChange(newAttributeValue);
                        },
                        style: { marginLeft: '0.5rem' },
                      },
                      [icon('times', { size: 20 })]
                    ),
                  ]
                ),
              Utils.toIndexPairs((props.attributeValue as AttributeList).items)
            )
          ),
          h(
            Link,
            {
              style: { display: 'block', marginTop: '1rem' },
              onClick: () => {
                focusLastListItemInput.current = true;
                const newAttributeValue = _.update(
                  'items',
                  Utils.append(defaultValue),
                  props.attributeValue as AttributeList
                );
                setEdited(true);
                props.onChange(newAttributeValue);
              },
            },
            [icon('plus', { style: { marginRight: '0.5rem' } }), ['Add item']]
          ),
        ])
      : div({ style: { marginTop: '1.5rem' } }, [
          renderInput({
            'aria-label': 'New value',
            autoFocus,
            value: props.attributeValue,
            onChange: (v) => {
              setEdited(true);
              props.onChange(v);
            },
          }),
        ]),
  ]);
};

export default AttributeInput;
