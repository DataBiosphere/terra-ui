import { concatenateAttributeNames, convertAttributeValue, getAttributeType } from 'src/components/data/attribute-utils';

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
    expect(
      getAttributeType({
        items: [
          { entityType: 'thing', entityName: 'thing_one' },
          { entityType: 'thing', entityName: 'thing_two' },
        ],
        itemsType: 'EntityReference',
      })
    ).toEqual({ type: 'reference', isList: true });

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

describe('convertAttributeValue', () => {
  it('converts between different attribute types', () => {
    expect(convertAttributeValue('42', 'number')).toEqual(42);
    expect(convertAttributeValue('a_string', 'number')).toEqual(0);
    expect(convertAttributeValue('a_string', 'boolean')).toEqual(true);
    expect(convertAttributeValue('a_string', 'reference', 'thing')).toEqual({ entityType: 'thing', entityName: 'a_string' });
    expect(convertAttributeValue('a_string', 'json')).toEqual({ value: 'a_string' });

    expect(convertAttributeValue(7, 'string')).toEqual('7');
    expect(convertAttributeValue(7, 'boolean')).toEqual(true);
    expect(convertAttributeValue(7, 'reference', 'thing')).toEqual({ entityType: 'thing', entityName: '7' });
    expect(convertAttributeValue(7, 'json')).toEqual({ value: 7 });

    expect(convertAttributeValue(true, 'string')).toEqual('true');
    expect(convertAttributeValue(true, 'number')).toEqual(1);
    expect(convertAttributeValue(false, 'reference', 'thing')).toEqual({ entityType: 'thing', entityName: 'false' });
    expect(convertAttributeValue(true, 'json')).toEqual({ value: true });

    expect(convertAttributeValue({ entityType: 'thing', entityName: 'thing_one' }, 'string')).toEqual('thing_one');
    expect(convertAttributeValue({ entityType: 'thing', entityName: 'thing_one' }, 'number')).toEqual(0);
    expect(convertAttributeValue({ entityType: 'thing', entityName: 'thing_one' }, 'boolean')).toEqual(true);

    expect(convertAttributeValue({ key: 'value' }, 'string')).toEqual('');
    expect(convertAttributeValue({ key: 'value' }, 'number')).toEqual(0);
    expect(convertAttributeValue({ key: 'value' }, 'boolean')).toEqual(true);
    expect(convertAttributeValue({ key: 'value' }, 'reference', 'thing')).toEqual({ entityType: 'thing', entityName: '' });
    expect(convertAttributeValue({ key: 'value' }, 'json')).toEqual({ key: 'value' });

    expect(() => convertAttributeValue('abc', 'notatype')).toThrow('Invalid attribute type "notatype"');
  });

  it('throws an error if attempting to convert to a reference without an entity type', () => {
    expect(() => convertAttributeValue('thing_one', 'reference')).toThrowError();
  });

  it('changes referenced entity type', () => {
    expect(convertAttributeValue({ entityType: 'thing', entityName: 'thing_one' }, 'reference', 'other_thing')).toEqual({
      entityType: 'other_thing',
      entityName: 'thing_one',
    });
  });

  it('converts each value of lists', () => {
    expect(convertAttributeValue({ items: ['42', 'value'], itemsType: 'AttributeValue' }, 'number')).toEqual({
      items: [42, 0],
      itemsType: 'AttributeValue',
    });

    expect(
      convertAttributeValue(
        {
          items: [
            { entityType: 'thing', entityName: 'thing_one' },
            { entityType: 'thing', entityName: 'thing_two' },
          ],
          itemsType: 'EntityReference',
        },
        'string'
      )
    ).toEqual({ items: ['thing_one', 'thing_two'], itemsType: 'AttributeValue' });
  });

  it('adds itemsType to reference lists', () => {
    expect(convertAttributeValue({ items: ['thing_one', 'thing_two'], itemsType: 'AttributeValue' }, 'reference', 'thing')).toEqual({
      items: [
        { entityType: 'thing', entityName: 'thing_one' },
        { entityType: 'thing', entityName: 'thing_two' },
      ],
      itemsType: 'EntityReference',
    });
  });

  it('converts lists to arrays', () => {
    expect(
      convertAttributeValue(
        {
          items: ['a', 'b', 'c'],
          itemsType: 'AttributeValue',
        },
        'json'
      )
    ).toEqual(['a', 'b', 'c']);
    expect(
      convertAttributeValue(
        {
          items: [1, 2, 3],
          itemsType: 'AttributeValue',
        },
        'json'
      )
    ).toEqual([1, 2, 3]);
    expect(
      convertAttributeValue(
        {
          items: [true, false, true],
          itemsType: 'AttributeValue',
        },
        'json'
      )
    ).toEqual([true, false, true]);
  });

  it('converts arrays to lists', () => {
    expect(convertAttributeValue(['a', 'b', 'c'], 'string')).toEqual({
      items: ['a', 'b', 'c'],
      itemsType: 'AttributeValue',
    });
    expect(convertAttributeValue(['1', '2', '3'], 'number')).toEqual({
      items: [1, 2, 3],
      itemsType: 'AttributeValue',
    });
    expect(convertAttributeValue(['true', 'false', 'true'], 'boolean')).toEqual({
      items: [true, false, true],
      itemsType: 'AttributeValue',
    });
  });
});

describe('concatenateAttributeNames', () => {
  it('works with two empty arrays', () => {
    const attrList1 = [];
    const attrList2 = [];
    const expected = [];
    expect(concatenateAttributeNames(attrList1, attrList2)).toEqual(expected);
  });
  it('works with left empty array', () => {
    const attrList1 = [];
    const attrList2 = ['aaa', 'bbb'];
    const expected = ['aaa', 'bbb'];
    expect(concatenateAttributeNames(attrList1, attrList2)).toEqual(expected);
  });
  it('works with right empty array', () => {
    const attrList1 = ['aaa', 'bbb'];
    const attrList2 = [];
    const expected = ['aaa', 'bbb'];
    expect(concatenateAttributeNames(attrList1, attrList2)).toEqual(expected);
  });
  it('returns only unique attribute names', () => {
    const attrList1 = ['namespace:aaa', 'namespace:bbb'];
    const attrList2 = ['namespace:bbb', 'namespace:ccc'];
    const expected = ['namespace:aaa', 'namespace:bbb', 'namespace:ccc'];
    expect(concatenateAttributeNames(attrList1, attrList2)).toEqual(expected);
  });
  it('works when arrays are equal', () => {
    const attrList1 = ['aaa', 'bbb', 'ccc', 'ddd'];
    const attrList2 = ['aaa', 'bbb', 'ccc', 'ddd'];
    const expected = ['aaa', 'bbb', 'ccc', 'ddd'];
    expect(concatenateAttributeNames(attrList1, attrList2)).toEqual(expected);
  });
  it('sorts attribute names', () => {
    const attrList1 = ['namespace:ccc', 'namespace:aaa', 'ddd'];
    const attrList2 = ['namespace:bbb', 'aaa'];
    const expected = ['aaa', 'ddd', 'namespace:aaa', 'namespace:bbb', 'namespace:ccc'];
    expect(concatenateAttributeNames(attrList1, attrList2)).toEqual(expected);
  });
});
