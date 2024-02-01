import { getAttributeType } from './attribute-utils';

// this test needs to be edited
describe('getAttributeType', () => {
  it.each([
    { recordAttribute: 'annotated_sex', expectedType: 'string', expectedIsList: false },
    { recordAttribute: 'bmi_baseline', expectedType: 'number', expectedIsList: false },
    { recordAttribute: 'boolean_field', expectedType: 'boolean', expectedIsList: false },
    { recordAttribute: 'array_string', expectedType: 'string', expectedIsList: true },
    { recordAttribute: 'array_num', expectedType: 'number', expectedIsList: true },
    { recordAttribute: 'booleans_list', expectedType: 'boolean', expectedIsList: true },
    { recordAttribute: 'json_field', expectedType: 'json', expectedIsList: false },
  ])('returns type of attribute value', ({ recordAttribute, expectedType, expectedIsList }) => {
    const dataProvider = { features: { supportEntityUpdatingTypes: ['string', 'json', 'number', 'boolean'] } };

    const recordTypeAttribute = [
      {
        name: 'annotated_sex',
        datatype: 'STRING',
      },
      {
        name: 'array_num',
        datatype: 'ARRAY_OF_NUMBER',
      },
      {
        name: 'array_string',
        datatype: 'ARRAY_OF_STRING',
      },
      {
        name: 'bmi_baseline',
        datatype: 'NUMBER',
      },
      {
        name: 'boolean_field',
        datatype: 'BOOLEAN',
      },
      {
        name: 'booleans_list',
        datatype: 'ARRAY_OF_BOOLEAN',
      },
      {
        name: 'files',
        datatype: 'FILE',
      },
      {
        name: 'height_baseline',
        datatype: 'NUMBER',
      },
      {
        name: 'json_field',
        datatype: 'JSON',
      },
    ];

    expect(getAttributeType(recordAttribute, recordTypeAttribute, dataProvider)).toEqual({
      type: expectedType,
      isList: expectedIsList,
    });
  });
});
