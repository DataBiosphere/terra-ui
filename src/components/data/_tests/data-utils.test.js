import { concatenateAttributeNames } from 'src/components/data/data-utils.js'


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
