export interface WdsAttributeType {
  type?: string;
  isList?: boolean;
  message?: string;
}

export const getAttributeType = (
  attributeName: string,
  recordTypeAttributes: { name: string; datatype: string }[],
  dataProvider: any
): WdsAttributeType => {
  // type that comes from the database schema in wds
  // when uploading form tsv, you can end up with an undefined column (if there are extra tabs) which causes errors with this logic
  if (attributeName !== undefined) {
    let getTypeAttribute = recordTypeAttributes.find((attribute) => attribute.name === attributeName)?.datatype;

    if (getTypeAttribute !== undefined) {
      let isList = false;
      if (getTypeAttribute.includes('ARRAY')) {
        isList = true;
        getTypeAttribute = getTypeAttribute.replace('ARRAY_OF_', '');
      }

      // if the type matches, editing is allowed
      if (dataProvider.features.supportsEntityUpdatingTypes.includes(getTypeAttribute.toLowerCase())) {
        return { type: getTypeAttribute.toLowerCase(), isList };
      }

      return { message: 'Editing the current type is not supported.' };
    }
  }

  throw new Error('Unable to determine attribute type');
};
