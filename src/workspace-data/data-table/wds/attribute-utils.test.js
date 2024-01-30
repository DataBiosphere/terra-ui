import { getAttributeType } from './attribute-utils';

// this test needs to be edited
describe('getAttributeType', () => {
  it('returns type of attribute value', () => {
    expect(getAttributeType('value')).toEqual({ type: 'string', isList: false });
    expect(getAttributeType(3)).toEqual({ type: 'number', isList: false });
    expect(getAttributeType(false)).toEqual({ type: 'boolean', isList: false });
    expect(
      getAttributeType({
        entityType: 'thing',
        entityName: 'thing_one',
      })
    ).toEqual({ type: 'reference', isList: false });

    expect(getAttributeType({ items: ['a', 'b', 'c'], itemsType: 'AttributeValue' })).toEqual({ type: 'string', isList: true });
    expect(getAttributeType({ items: [1, 2, 3], itemsType: 'AttributeValue' })).toEqual({ type: 'number', isList: true });
    expect(getAttributeType({ items: [true, false], itemsType: 'AttributeValue' })).toEqual({ type: 'boolean', isList: true });

    expect(getAttributeType({ key: 'value' })).toEqual({ type: 'json', isList: false });
    expect(getAttributeType(['a', 'b', 'c'])).toEqual({ type: 'json', isList: false });
    expect(getAttributeType([{ idx: 0 }, { idx: 1 }, { idx: 2 }])).toEqual({ type: 'json', isList: false });
  });

  it('returns string for null values', () => {
    expect(getAttributeType(null)).toEqual({ type: 'string', isList: false });
    expect(getAttributeType({ items: [], itemsType: 'AttributeValue' })).toEqual({ type: 'string', isList: true });
    expect(getAttributeType({ items: [null], itemsType: 'AttributeValue' })).toEqual({ type: 'string', isList: true });
  });
});
