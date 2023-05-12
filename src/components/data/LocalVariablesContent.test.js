import { convertInitialAttributes, getDisplayedAttribute, renameAttribute } from 'src/components/data/LocalVariablesContent';
import { describe, expect, it } from 'vitest';

describe('getDisplayedAttribute', () => {
  it('gets a displayed attribute with a description', () => {
    const input = [
      { key: 'the_key', value: 'the_value' },
      { key: 'the_key', description: 'the_description' },
    ];
    const expected = ['the_key', 'the_value', 'the_description'];
    expect(getDisplayedAttribute(input)).toStrictEqual(expected);
  });
  it('gets a displayed attribute with an empty-string description', () => {
    const input = [
      { key: 'the_key', value: 'the_value' },
      { key: 'the_key', description: '' },
    ];
    const expected = ['the_key', 'the_value', ''];
    expect(getDisplayedAttribute(input)).toStrictEqual(expected);
  });
  it('gets a displayed attribute with an undefined description', () => {
    const input = [{ key: 'the_key', value: 'the_value' }];
    const expected = ['the_key', 'the_value', ''];
    expect(getDisplayedAttribute(input)).toStrictEqual(expected);
  });
});

describe('renameAttribute', () => {
  it('renames a value attribute', () => {
    const input = ['the_key', 'the_value'];
    const expected = { key: 'the_key', value: 'the_value' };
    expect(renameAttribute(input)).toStrictEqual(expected);
  });
  it('renames a description attribute', () => {
    const input = ['__DESCRIPTION__the_key', 'the_description'];
    const expected = { key: 'the_key', description: 'the_description' };
    expect(renameAttribute(input)).toStrictEqual(expected);
  });
});

describe('convertInitialAttributes', () => {
  it('removes an attribute with key "description"', () => {
    expect(convertInitialAttributes({ description: 'description' })).toStrictEqual([]);
  });
  it('removes an attribute with key starting with "referenceData_"', () => {
    expect(convertInitialAttributes({ referenceData_FOO: 'FOO' })).toStrictEqual([]);
  });
  it('converts an attribute without a description', () => {
    const input = { key1: 'value1' };
    const expected = [['key1', 'value1', '']];
    expect(convertInitialAttributes(input)).toStrictEqual(expected);
  });
  it('converts an attribute with a description', () => {
    const input = { key1: 'value1', __DESCRIPTION__key1: 'description1' };
    const expected = [['key1', 'value1', 'description1']];
    expect(convertInitialAttributes(input)).toStrictEqual(expected);
  });
  it('converts all types of attributes at once', () => {
    const input = {
      description: 'workspace description',
      referenceData_FOO: 'FOO',
      key0: 'value0',
      key1: 'value1',
      __DESCRIPTION__key1: 'description1',
    };
    const expected = [
      ['key0', 'value0', ''],
      ['key1', 'value1', 'description1'],
    ];
    expect(convertInitialAttributes(input)).toStrictEqual(expected);
  });
});
