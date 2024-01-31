import { getAttributeType } from './attribute-utils';

// this test needs to be edited
describe('getAttributeType', () => {
  it('returns type of attribute value', () => {
    const entityTypeAttribute = [
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
    const dataProvider = { features: { supportEntityUpdatingTypes: [] } };
    dataProvider.features.supportEntityUpdatingTypes = ['string', 'json', 'number', 'boolean'];
    dataProvider.features.supportEntityUpdatingTypes = ['string', 'json', 'number', 'boolean'];

    expect(getAttributeType('annotated_sex', entityTypeAttribute, 'value', dataProvider)).toEqual({ type: 'string', isList: false });
    expect(getAttributeType('bmi_baseline', entityTypeAttribute, 3, dataProvider)).toEqual({ type: 'number', isList: false });
    expect(getAttributeType('boolean_field', entityTypeAttribute, true, dataProvider)).toEqual({ type: 'boolean', isList: false });

    expect(getAttributeType('array_string', entityTypeAttribute, { items: ['a', 'b', 'c'] }, dataProvider)).toEqual({ type: 'string', isList: true });
    expect(getAttributeType('array_num', entityTypeAttribute, { items: [1, 2, 3] }, dataProvider)).toEqual({ type: 'number', isList: true });
    expect(getAttributeType('booleans_list', entityTypeAttribute, { items: [true, false] }, dataProvider)).toEqual({ type: 'boolean', isList: true });

    expect(getAttributeType('json_field', entityTypeAttribute, { key: 'value' }, dataProvider)).toEqual({ type: 'json', isList: false });
    expect(getAttributeType('json_field', entityTypeAttribute, ['a', 'b', 'c'], dataProvider)).toEqual({ type: 'json', isList: false });
    expect(getAttributeType('json_field', entityTypeAttribute, [{ idx: 0 }, { idx: 1 }, { idx: 2 }], dataProvider)).toEqual({
      type: 'json',
      isList: false,
    });

    expect(
      getAttributeType(
        'files',
        entityTypeAttribute,
        'https://smth.blob.core.windows.net/sc-e3ac5af2-dc4f-42cc-9111-a6f37acfe21a/nextstrain.tsv',
        dataProvider
      )
    ).toEqual({ error: 'Editing the current type is not supported.' });
  });
});
