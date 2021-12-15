import {getDisplayedAttribute, renameAttribute} from 'src/components/data/LocalVariablesContent'

describe('getDisplayedAttribute', () => {
  it('gets a displayed attribute with a description', () => {
    const input = [
      {key: 'the_key', value: 'the_value'},
      {key: 'the_key', description: 'the_description'}
    ]
    const expected = ['the_key', 'the_value', 'the_description']
    expect(getDisplayedAttribute(input)).toStrictEqual(expected)
  })
  it('gets a displayed attribute with an empty-string description', () => {
    const input = [
      {key: 'the_key', value: 'the_value'},
      {key: 'the_key', description: ''}
    ]
    const expected = ['the_key', 'the_value', '']
    expect(getDisplayedAttribute(input)).toStrictEqual(expected)
  })
  it('gets a displayed attribute with an undefined description', () => {
    const input = [
      {key: 'the_key', value: 'the_value'},
    ]
    const expected = ['the_key', 'the_value', '']
    expect(getDisplayedAttribute(input)).toStrictEqual(expected)
  })
})

describe('renameAttribute', () => {
  it('renames a value attribute', () => {
    const input = ['the_key', 'the_value']
    const expected = {key: 'the_key', value: 'the_value'}
    expect(renameAttribute(input)).toStrictEqual(expected)
  })
  it('renames a description attribute', () => {
    const input = ['the_key__DESCRIPTION__', 'the_description']
    const expected = {key: 'the_key', description: 'the_description'}
    expect(renameAttribute(input)).toStrictEqual(expected)
  })
})
