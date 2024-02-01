export interface WdsAttributeType {
  type?: string;
  isList?: boolean;
  error?: string;
}

export const getAttributeType = (
  attributeName: string,
  recordTypeAttributes: { name: string; datatype: string }[],
  dataProvider: any
): WdsAttributeType => {
  // type that comes from the database schema in wds
  // when uploading form tsv, you can end up with an undefined column (if there are extra tabs) which causes errors with this logic
  if (attributeName !== undefined) {
    let getTypeAttribute = recordTypeAttributes.find((attribute) => attribute.name === attributeName).datatype;

    let isList = false;
    if (getTypeAttribute.includes('ARRAY')) {
      isList = true;
      getTypeAttribute = getTypeAttribute.replace('ARRAY_OF_', '');
    }

    // if the type matches, editing is allowed
    if (dataProvider.features.supportEntityUpdatingTypes.includes(getTypeAttribute.toLowerCase())) {
      return { type: getTypeAttribute.toLowerCase(), isList };
    }
  }

  // there is likely a better way to expose this
  return { error: 'Editing the current type is not supported.' };
};
