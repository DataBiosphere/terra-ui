import * as Utils from 'src/libs/utils';

export const getAttributeType = (attributeName, entityTypes, attributeValue, dataProvider) => {
  // type that comes from the database schema in wds
  let getTypeAttribute = entityTypes.find((attribute) => attribute.name === attributeName).datatype;

  let isList = false;
  if (getTypeAttribute.includes('ARRAY')) {
    isList = true;
    getTypeAttribute = getTypeAttribute.replace('ARRAY_OF_', '');
  }

  // type that the Attribute Value is holding
  const type = Utils.cond(
    // explicit double-equal to check for null and undefined, since entity attribute lists can contain nulls
    // eslint-disable-next-line eqeqeq
    [(isList ? attributeValue.items[0] : attributeValue) == undefined, () => 'string'],
    [isList, () => typeof attributeValue.items[0]],
    [typeof attributeValue === 'object', () => 'json'],
    () => typeof attributeValue
  );

  // if the type matches, editing is allowed
  if (type === getTypeAttribute.toLowerCase() && dataProvider.features.supportEntityUpdatingTypes.includes(getTypeAttribute.toLowerCase())) {
    return { type: getTypeAttribute.toLowerCase(), isList };
  }

  // there is likely a better way to expose this
  return { error: 'Editing the current type is not supported.' };
};
