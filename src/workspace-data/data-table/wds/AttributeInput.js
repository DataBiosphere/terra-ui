import _ from 'lodash/fp';
import { Fragment, useEffect, useRef } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import * as Utils from 'src/libs/utils';

import { renderInputForAttributeType } from '../shared/AttributeInput';
import { getAttributeType } from './attribute-utils';

const defaultValueForAttributeType = (attributeType) => {
  return Utils.switchCase(attributeType, ['string', () => ''], ['number', () => 0], ['boolean', () => false], ['json', () => ({})]);
};

const AttributeInput = ({ autoFocus = false, value: attributeValue, attributeName, dataProvider, onChange, entityTypes = [] }) => {
  const { type: attributeType, isList, error } = getAttributeType(attributeName, entityTypes, attributeValue, dataProvider);

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
    !error
      ? isList
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
          ])
      : div(error),
  ]);
};

export default AttributeInput;
