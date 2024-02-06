import _ from 'lodash/fp';
import { Fragment, ReactNode, useEffect, useRef } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import * as Utils from 'src/libs/utils';

import { renderInputForAttributeType } from '../shared/AttributeInput';
import { getAttributeType } from './attribute-utils';

const defaultValueForAttributeType = (attributeType: string | undefined): any => {
  return Utils.switchCase(
    attributeType,
    ['string', () => ''],
    ['number', () => 0],
    ['boolean', () => false],
    ['json', () => ({})]
  );
};

export interface WDSAttributeInputProps {
  autoFocus: boolean;
  value: any;
  attributeName: string;
  dataProvider: object;
  recordTypeAttributes: { name: string; datatype: string }[];
  onChange: any;
  initialValue: any;
}

const AttributeInput = (props: WDSAttributeInputProps): ReactNode => {
  const {
    autoFocus = false,
    value: attributeValue,
    attributeName,
    dataProvider,
    onChange,
    recordTypeAttributes,
  } = props;
  const { type: attributeType, isList } = getAttributeType(attributeName, recordTypeAttributes, dataProvider);

  const renderInput = renderInputForAttributeType(attributeType);

  const defaultValue = defaultValueForAttributeType(attributeType);

  const focusLastListItemInput = useRef(false);
  const lastListItemInput = useRef(null);
  useEffect(() => {
    if (!isList) {
      lastListItemInput.current = null;
    }
    if (focusLastListItemInput.current && lastListItemInput.current) {
      focusLastListItemInput.current = false;
    }
  }, [attributeValue, isList]);

  return h(Fragment, [
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
              onChange(v);
            },
          }),
        ]),
  ]);
};

export default AttributeInput;
