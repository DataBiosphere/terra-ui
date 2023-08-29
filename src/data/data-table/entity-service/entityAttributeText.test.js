import { entityAttributeText } from './entityAttributeText';

describe('entityAttributeText', () => {
  describe('basic data types', () => {
    it('returns value for strings', () => {
      expect(entityAttributeText('abc')).toEqual('abc');
      expect(entityAttributeText({ items: ['a', 'b', 'c'], itemsType: 'AttributeValue' })).toEqual('a, b, c');
    });

    it('returns stringified value for numbers', () => {
      expect(entityAttributeText(42)).toEqual('42');
      expect(entityAttributeText({ items: [1, 2, 3], itemsType: 'AttributeValue' })).toEqual('1, 2, 3');
    });

    it('returns stringified value for booleans', () => {
      expect(entityAttributeText(true)).toEqual('true');
      expect(entityAttributeText(false)).toEqual('false');
      expect(entityAttributeText({ items: [true, false], itemsType: 'AttributeValue' })).toEqual('true, false');
    });

    it('returns entity name for references', () => {
      expect(entityAttributeText({ entityType: 'thing', entityName: 'thing_one' })).toEqual('thing_one');
      expect(
        entityAttributeText({
          items: [
            { entityType: 'thing', entityName: 'thing_one' },
            { entityType: 'thing', entityName: 'thing_two' },
          ],
          itemsType: 'EntityReference',
        })
      ).toEqual('thing_one, thing_two');
    });
  });

  it('formats missing values', () => {
    expect(entityAttributeText(undefined)).toEqual('');
  });

  it('formats empty lists', () => {
    expect(entityAttributeText({ items: [], itemsType: 'AttributeValue' })).toEqual('');
  });

  it('can return JSON encoded list items', () => {
    expect(entityAttributeText({ items: ['a', 'b', 'c'], itemsType: 'AttributeValue' }, true)).toEqual('["a","b","c"]');
    expect(entityAttributeText({ items: [1, 2, 3], itemsType: 'AttributeValue' }, true)).toEqual('[1,2,3]');
    expect(
      entityAttributeText(
        {
          items: [
            { entityType: 'thing', entityName: 'thing_one' },
            { entityType: 'thing', entityName: 'thing_two' },
          ],
          itemsType: 'EntityReference',
        },
        true
      )
    ).toEqual('[{"entityType":"thing","entityName":"thing_one"},{"entityType":"thing","entityName":"thing_two"}]');
  });

  describe('JSON values', () => {
    it('stringifies arrays containing basic data types', () => {
      expect(entityAttributeText(['one', 'two', 'three'])).toEqual('["one","two","three"]');
    });

    it('stringifies empty arrays', () => {
      expect(entityAttributeText([])).toEqual('[]');
    });

    it('stringifies arrays of objects', () => {
      expect(entityAttributeText([{ key1: 'value1' }, { key2: 'value2' }, { key3: 'value3' }])).toEqual(
        '[{"key1":"value1"},{"key2":"value2"},{"key3":"value3"}]'
      );
    });

    it('stringifies objects', () => {
      expect(entityAttributeText({ key: 'value' })).toEqual('{"key":"value"}');
    });
  });
});
