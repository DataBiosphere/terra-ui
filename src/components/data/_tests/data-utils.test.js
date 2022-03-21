import { concatenateAttributeNames, convertAttributeValue, getAttributeType } from 'src/components/data/data-utils.js'


describe('concatenateAttributeNames', () => {
  it('works with two empty arrays', () => {
    const attrList1 = []
    const attrList2 = []
    const expected = []
    expect(concatenateAttributeNames(attrList1, attrList2)).toEqual(expected)
  })
  it('works with left empty array', () => {
    const attrList1 = []
    const attrList2 = ['aaa', 'bbb']
    const expected = ['aaa', 'bbb']
    expect(concatenateAttributeNames(attrList1, attrList2)).toEqual(expected)
  })
  it('works with right empty array', () => {
    const attrList1 = ['aaa', 'bbb']
    const attrList2 = []
    const expected = ['aaa', 'bbb']
    expect(concatenateAttributeNames(attrList1, attrList2)).toEqual(expected)
  })
  it('returns only unique attribute names', () => {
    const attrList1 = ['namespace:aaa', 'namespace:bbb']
    const attrList2 = ['namespace:bbb', 'namespace:ccc']
    const expected = ['namespace:aaa', 'namespace:bbb', 'namespace:ccc']
    expect(concatenateAttributeNames(attrList1, attrList2)).toEqual(expected)
  })
  it('works when arrays are equal', () => {
    const attrList1 = ['aaa', 'bbb', 'ccc', 'ddd']
    const attrList2 = ['aaa', 'bbb', 'ccc', 'ddd']
    const expected = ['aaa', 'bbb', 'ccc', 'ddd']
    expect(concatenateAttributeNames(attrList1, attrList2)).toEqual(expected)
  })
  it('uniqueifies in a case-insensitive manner', () => {
    const attrList1 = ['CASE']
    const attrList2 = ['case', 'foo']
    const expected = ['CASE', 'foo']
    expect(concatenateAttributeNames(attrList1, attrList2)).toEqual(expected)
  })
  it('prefers the leftmost instance of a case-insensitive uniqification', () => {
    // note that 'CASE' will sort earlier than 'case', so putting 'case' first in this
    // test proves that we prefer the leftmost instance
    const attrList1 = ['case']
    const attrList2 = ['CASE', 'foo']
    const expected = ['case', 'foo']
    expect(concatenateAttributeNames(attrList1, attrList2)).toEqual(expected)
  })
  it('handles case divergence within a single array', () => {
    // note that 'CASE' will sort earlier than 'case', so putting 'case' first in this
    // test proves that we prefer the leftmost instance
    const attrList1 = ['case', 'CASE', 'Case']
    const attrList2 = ['CASE', 'foo']
    const expected = ['case', 'foo']
    expect(concatenateAttributeNames(attrList1, attrList2)).toEqual(expected)
  })
  it('sorts attribute names', () => {
    const attrList1 = ['namespace:ccc', 'namespace:aaa', 'ddd']
    const attrList2 = ['namespace:bbb', 'aaa']
    const expected = ['aaa', 'ddd', 'namespace:aaa', 'namespace:bbb', 'namespace:ccc']
    expect(concatenateAttributeNames(attrList1, attrList2)).toEqual(expected)
  })
})

describe('getAttributeType', () => {
  it('returns type of attribute value', () => {
    expect(getAttributeType('value')).toEqual({ type: 'string', isList: false })
    expect(getAttributeType(3)).toEqual({ type: 'number', isList: false })
    expect(getAttributeType(false)).toEqual({ type: 'boolean', isList: false })
    expect(getAttributeType({
      entityType: 'thing',
      entityName: 'thing_one'
    })).toEqual({ type: 'reference', isList: false })

    expect(getAttributeType({ items: ['a', 'b', 'c'] })).toEqual({ type: 'string', isList: true })
    expect(getAttributeType({ items: [1, 2, 3] })).toEqual({ type: 'number', isList: true })
    expect(getAttributeType({ items: [true, false] })).toEqual({ type: 'boolean', isList: true })
    expect(getAttributeType({
      items: [
        { entityType: 'thing', entityName: 'thing_one' },
        { entityType: 'thing', entityName: 'thing_two' }
      ],
      itemsType: 'EntityReference'
    })).toEqual({ type: 'reference', isList: true })
  })

  it('returns string for null values', () => {
    expect(getAttributeType(null)).toEqual({ type: 'string', isList: false })
    expect(getAttributeType({ items: [] })).toEqual({ type: 'string', isList: true })
    expect(getAttributeType({ items: [null] })).toEqual({ type: 'string', isList: true })
  })
})

describe('convertAttributeValue', () => {
  it('converts between different attribute types', () => {
    expect(convertAttributeValue('42', 'number')).toEqual(42)
    expect(convertAttributeValue('a_string', 'number')).toEqual(0)
    expect(convertAttributeValue('a_string', 'boolean')).toEqual(true)
    expect(convertAttributeValue('a_string', 'reference', 'thing')).toEqual({ entityType: 'thing', entityName: 'a_string' })

    expect(convertAttributeValue(7, 'string')).toEqual('7')
    expect(convertAttributeValue(7, 'boolean')).toEqual(true)
    expect(convertAttributeValue(7, 'reference', 'thing')).toEqual({ entityType: 'thing', entityName: '7' })

    expect(convertAttributeValue(true, 'string')).toEqual('true')
    expect(convertAttributeValue(true, 'number')).toEqual(1)
    expect(convertAttributeValue(false, 'reference', 'thing')).toEqual({ entityType: 'thing', entityName: 'false' })

    expect(convertAttributeValue({ entityType: 'thing', entityName: 'thing_one' }, 'string')).toEqual('thing_one')
    expect(convertAttributeValue({ entityType: 'thing', entityName: 'thing_one' }, 'number')).toEqual(0)
    expect(convertAttributeValue({ entityType: 'thing', entityName: 'thing_one' }, 'boolean')).toEqual(true)
  })

  it('throws an error if attempting to convert to a reference without an entity type', () => {
    expect(() => convertAttributeValue('thing_one', 'reference')).toThrowError()
  })

  it('converts each value of lists', () => {
    expect(convertAttributeValue({ items: ['42', 'value'] }, 'number')).toEqual({ items: [42, 0] })

    expect(convertAttributeValue({
      items: [
        { entityType: 'thing', entityName: 'thing_one' },
        { entityType: 'thing', entityName: 'thing_two' }
      ],
      itemsType: 'EntityReference'
    }, 'string')).toEqual({ items: ['thing_one', 'thing_two'] })
  })

  it('adds itemsType to reference lists', () => {
    expect(convertAttributeValue({ items: ['thing_one', 'thing_two'] }, 'reference', 'thing')).toEqual({
      items: [
        { entityType: 'thing', entityName: 'thing_one' },
        { entityType: 'thing', entityName: 'thing_two' }
      ],
      itemsType: 'EntityReference'
    })
  })
})
