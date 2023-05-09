import _ from 'lodash/fp';
import * as Utils from 'src/libs/utils';

export const getAttributeType = (attributeValue) => {
  const isList = Boolean(_.isObject(attributeValue) && attributeValue.items);

  const isReference = _.isObject(attributeValue) && (attributeValue.entityType || attributeValue.itemsType === 'EntityReference');
  const type = Utils.cond(
    [isReference, () => 'reference'],
    // explicit double-equal to check for null and undefined, since entity attribute lists can contain nulls
    // eslint-disable-next-line eqeqeq
    [(isList ? attributeValue.items[0] : attributeValue) == undefined, () => 'string'],
    [isList, () => typeof attributeValue.items[0]],
    [typeof attributeValue === 'object', () => 'json'],
    () => typeof attributeValue
  );

  return { type, isList };
};

export const convertAttributeValue = (attributeValue, newType, referenceEntityType) => {
  if (newType === 'reference' && !referenceEntityType) {
    throw new Error('An entity type is required to convert an attribute to a reference');
  }

  const { type, isList } = getAttributeType(attributeValue);

  const isNoop = type === 'reference' ? newType === 'reference' && referenceEntityType === attributeValue.entityType : newType === type;
  if (isNoop) {
    return attributeValue;
  }

  const baseConvertFn = Utils.switchCase(
    newType,
    ['string', () => _.toString],
    [
      'reference',
      () => (value) => ({
        entityType: referenceEntityType,
        entityName: type === 'json' ? '' : _.toString(value), // eslint-disable-line lodash-fp/preferred-alias
      }),
    ],
    [
      'number',
      () => (value) => {
        const numberVal = _.toNumber(value);
        return _.isNaN(numberVal) ? 0 : numberVal;
      },
    ],
    ['boolean', () => Utils.convertValue('boolean')],
    ['json', () => (value) => ({ value })],
    [
      Utils.DEFAULT,
      () => {
        throw new Error(`Invalid attribute type "${newType}"`);
      },
    ]
  );
  const convertFn = type === 'reference' ? _.flow(_.get('entityName'), baseConvertFn) : baseConvertFn;

  return Utils.cond(
    [isList && newType === 'json', () => _.get('items', attributeValue)],
    [
      isList,
      () =>
        _.flow(
          _.update('items', _.map(convertFn)),
          _.set('itemsType', newType === 'reference' ? 'EntityReference' : 'AttributeValue')
        )(attributeValue),
    ],
    [
      type === 'json' && _.isArray(attributeValue),
      () => ({
        items: _.map(convertFn, attributeValue),
        itemsType: newType === 'reference' ? 'EntityReference' : 'AttributeValue',
      }),
    ],
    [type === 'json' && newType === 'string', () => ''],
    () => convertFn(attributeValue)
  );
};

// Accepts two arrays of attribute names. Concatenates, uniquifies, and sorts those attribute names, returning
// the resultant array. This is broken out into this helper method so as to easily control the criteria for uniqueness
// and sorting; for instance, we could use localeCompare for case-insensitive uniqueness.
export const concatenateAttributeNames = (attrList1, attrList2) => {
  return _.uniq(_.concat(attrList1, attrList2)).sort();
};
