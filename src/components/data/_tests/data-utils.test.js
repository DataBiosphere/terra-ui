import '@testing-library/jest-dom'

import { render } from '@testing-library/react'
import _ from 'lodash/fp'
import { concatenateAttributeNames, convertAttributeValue, entityAttributeText, getAttributeType, prepareAttributeForUpload, renderDataCell } from 'src/components/data/data-utils'
import * as Utils from 'src/libs/utils'


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

    expect(getAttributeType({ items: ['a', 'b', 'c'], itemsType: 'AttributeValue' })).toEqual({ type: 'string', isList: true })
    expect(getAttributeType({ items: [1, 2, 3], itemsType: 'AttributeValue' })).toEqual({ type: 'number', isList: true })
    expect(getAttributeType({ items: [true, false], itemsType: 'AttributeValue' })).toEqual({ type: 'boolean', isList: true })
    expect(getAttributeType({
      items: [
        { entityType: 'thing', entityName: 'thing_one' },
        { entityType: 'thing', entityName: 'thing_two' }
      ],
      itemsType: 'EntityReference'
    })).toEqual({ type: 'reference', isList: true })

    expect(getAttributeType({ key: 'value' })).toEqual({ type: 'json', isList: false })
    expect(getAttributeType(['a', 'b', 'c'])).toEqual({ type: 'json', isList: false })
    expect(getAttributeType([{ idx: 0 }, { idx: 1 }, { idx: 2 }])).toEqual({ type: 'json', isList: false })
  })

  it('returns string for null values', () => {
    expect(getAttributeType(null)).toEqual({ type: 'string', isList: false })
    expect(getAttributeType({ items: [], itemsType: 'AttributeValue' })).toEqual({ type: 'string', isList: true })
    expect(getAttributeType({ items: [null], itemsType: 'AttributeValue' })).toEqual({ type: 'string', isList: true })
  })
})

describe('entityAttributeText', () => {
  describe('basic data types', () => {
    it('returns value for strings', () => {
      expect(entityAttributeText('abc')).toEqual('abc')
      expect(entityAttributeText({ items: ['a', 'b', 'c'], itemsType: 'AttributeValue' })).toEqual('a, b, c')
    })

    it('returns stringified value for numbers', () => {
      expect(entityAttributeText(42)).toEqual('42')
      expect(entityAttributeText({ items: [1, 2, 3], itemsType: 'AttributeValue' })).toEqual('1, 2, 3')
    })

    it('returns stringified value for booleans', () => {
      expect(entityAttributeText(true)).toEqual('true')
      expect(entityAttributeText(false)).toEqual('false')
      expect(entityAttributeText({ items: [true, false], itemsType: 'AttributeValue' })).toEqual('true, false')
    })

    it('returns entity name for references', () => {
      expect(entityAttributeText({ entityType: 'thing', entityName: 'thing_one' })).toEqual('thing_one')
      expect(entityAttributeText({
        items: [
          { entityType: 'thing', entityName: 'thing_one' },
          { entityType: 'thing', entityName: 'thing_two' }
        ],
        itemsType: 'EntityReference'
      })).toEqual('thing_one, thing_two')
    })
  })

  it('formats missing values', () => {
    expect(entityAttributeText(undefined)).toEqual('')
  })

  it('formats empty lists', () => {
    expect(entityAttributeText({ items: [], itemsType: 'AttributeValue' })).toEqual('')
  })

  it('can return JSON encoded list items', () => {
    expect(entityAttributeText({ items: ['a', 'b', 'c'], itemsType: 'AttributeValue' }, true)).toEqual('["a","b","c"]')
    expect(entityAttributeText({ items: [1, 2, 3], itemsType: 'AttributeValue' }, true)).toEqual('[1,2,3]')
    expect(entityAttributeText({
      items: [
        { entityType: 'thing', entityName: 'thing_one' },
        { entityType: 'thing', entityName: 'thing_two' }
      ],
      itemsType: 'EntityReference'
    }, true)).toEqual('[{"entityType":"thing","entityName":"thing_one"},{"entityType":"thing","entityName":"thing_two"}]')
  })

  describe('JSON values', () => {
    it('stringifies arrays containing basic data types', () => {
      expect(entityAttributeText(['one', 'two', 'three'])).toEqual('["one","two","three"]')
    })

    it('stringifies empty arrays', () => {
      expect(entityAttributeText([])).toEqual('[]')
    })

    it('stringifies arrays of objects', () => {
      expect(entityAttributeText([
        { key1: 'value1' },
        { key2: 'value2' },
        { key3: 'value3' }
      ])).toEqual('[{"key1":"value1"},{"key2":"value2"},{"key3":"value3"}]')
    })

    it('stringifies objects', () => {
      expect(entityAttributeText({ key: 'value' })).toEqual('{"key":"value"}')
    })
  })
})

describe('renderDataCell', () => {
  const testWorkspace = { workspace: { bucketName: 'test-bucket', googleProject: 'test-project' } }

  describe('basic data types', () => {
    it('renders strings', () => {
      expect(render(renderDataCell('abc', testWorkspace)).container).toHaveTextContent('abc')
      expect(render(renderDataCell({ items: ['a', 'b', 'c'], itemsType: 'AttributeValue' }, testWorkspace)).container).toHaveTextContent('a,b,c')
    })

    it('renders numbers', () => {
      expect(render(renderDataCell(42, testWorkspace)).container).toHaveTextContent('42')
      expect(render(renderDataCell({ items: [1, 2, 3], itemsType: 'AttributeValue' }, testWorkspace)).container).toHaveTextContent('1,2,3')
    })

    it('renders booleans', () => {
      expect(render(renderDataCell(true, testWorkspace)).container).toHaveTextContent('true')
      expect(render(renderDataCell(false, testWorkspace)).container).toHaveTextContent('false')
      expect(render(renderDataCell({ items: [true, false], itemsType: 'AttributeValue' }, testWorkspace)).container).toHaveTextContent('true,false')
    })

    it('renders entity name for references', () => {
      expect(render(renderDataCell({ entityType: 'thing', entityName: 'thing_one' }, testWorkspace)).container).toHaveTextContent('thing_one')
      expect(render(renderDataCell({
        items: [
          { entityType: 'thing', entityName: 'thing_one' },
          { entityType: 'thing', entityName: 'thing_two' }
        ],
        itemsType: 'EntityReference'
      }, testWorkspace)).container).toHaveTextContent('thing_one,thing_two')
    })
  })

  it('renders empty lists', () => {
    expect(render(renderDataCell({ items: [], itemsType: 'AttributeValue' }, testWorkspace)).container).toHaveTextContent('')
  })

  it('limits the number of list items rendered', () => {
    expect(render(renderDataCell({
      items: _.map(_.toString, _.range(0, 1000)),
      itemsType: 'AttributeValue'
    }, testWorkspace)).container).toHaveTextContent(
      _.flow(
        _.map(_.toString),
        Utils.append('and 900 more'),
        _.join(',')
      )(_.range(0, 100))
    )
  })

  it('renders missing values', () => {
    expect(render(renderDataCell(undefined, testWorkspace)).container).toHaveTextContent('')
  })

  describe('JSON values', () => {
    it('renders each item of arrays containing basic data types', () => {
      expect(render(renderDataCell(['one', 'two', 'three'], testWorkspace)).container).toHaveTextContent('one,two,three')
    })

    it('renders JSON for arrays of objects', () => {
      expect(render(renderDataCell([
        { key1: 'value1' },
        { key2: 'value2' },
        { key3: 'value3' }
      ], testWorkspace)).container).toHaveTextContent('[ { "key1": "value1" }, { "key2": "value2" }, { "key3": "value3" } ]')
    })

    it('renders empty arrays', () => {
      expect(render(renderDataCell([], testWorkspace)).container).toHaveTextContent('')
    })

    it('renders JSON for other values', () => {
      expect(render(renderDataCell({ key: 'value' }, testWorkspace)).container).toHaveTextContent('{ "key": "value" }')
    })
  })

  describe('URLs', () => {
    it('renders links to GCS URLs', () => {
      const { container, getByRole } = render(renderDataCell('gs://bucket/file.txt', testWorkspace))
      expect(container).toHaveTextContent('file.txt')
      const link = getByRole('link')
      expect(link).toHaveAttribute('href', 'gs://bucket/file.txt')
    })

    it('renders a warning for GCS URLs outside the workspace bucket', () => {
      const { getByText } = render(renderDataCell('gs://other-bucket/file.txt', testWorkspace))
      expect(getByText('Some files are located outside of the current workspace')).toBeTruthy()
    })

    it('does not render a warning for GCS URLs in the workspace bucket', () => {
      const { queryByText } = render(renderDataCell('gs://test-bucket/file.txt', testWorkspace))
      expect(queryByText('Some files are located outside of the current workspace')).toBeNull()
    })

    it('renders lists of GCS URLs', () => {
      const { getAllByRole } = render(renderDataCell({
        itemsType: 'AttributeValue',
        items: ['gs://bucket/file1.txt', 'gs://bucket/file2.txt', 'gs://bucket/file3.txt']
      }, testWorkspace))
      const links = getAllByRole('link')
      expect(_.map('textContent', links)).toEqual(['file1.txt', 'file2.txt', 'file3.txt'])
      expect(_.map('href', links)).toEqual(['gs://bucket/file1.txt', 'gs://bucket/file2.txt', 'gs://bucket/file3.txt'])
    })

    it('renders links to DRS URLs', () => {
      const { container, getByRole } = render(renderDataCell('drs://example.data.service.org/6cbffaae-fc48-4829-9419-1a2ef0ca98ce', testWorkspace))
      expect(container).toHaveTextContent('drs://example.data.service.org/6cbffaae-fc48-4829-9419-1a2ef0ca98ce')
      const link = getByRole('link')
      expect(link).toHaveAttribute('href', 'drs://example.data.service.org/6cbffaae-fc48-4829-9419-1a2ef0ca98ce')
    })
  })
})

describe('convertAttributeValue', () => {
  it('converts between different attribute types', () => {
    expect(convertAttributeValue('42', 'number')).toEqual(42)
    expect(convertAttributeValue('a_string', 'number')).toEqual(0)
    expect(convertAttributeValue('a_string', 'boolean')).toEqual(true)
    expect(convertAttributeValue('a_string', 'reference', 'thing')).toEqual({ entityType: 'thing', entityName: 'a_string' })
    expect(convertAttributeValue('a_string', 'json')).toEqual({ value: 'a_string' })

    expect(convertAttributeValue(7, 'string')).toEqual('7')
    expect(convertAttributeValue(7, 'boolean')).toEqual(true)
    expect(convertAttributeValue(7, 'reference', 'thing')).toEqual({ entityType: 'thing', entityName: '7' })
    expect(convertAttributeValue(7, 'json')).toEqual({ value: 7 })

    expect(convertAttributeValue(true, 'string')).toEqual('true')
    expect(convertAttributeValue(true, 'number')).toEqual(1)
    expect(convertAttributeValue(false, 'reference', 'thing')).toEqual({ entityType: 'thing', entityName: 'false' })
    expect(convertAttributeValue(true, 'json')).toEqual({ value: true })

    expect(convertAttributeValue({ entityType: 'thing', entityName: 'thing_one' }, 'string')).toEqual('thing_one')
    expect(convertAttributeValue({ entityType: 'thing', entityName: 'thing_one' }, 'number')).toEqual(0)
    expect(convertAttributeValue({ entityType: 'thing', entityName: 'thing_one' }, 'boolean')).toEqual(true)

    expect(convertAttributeValue({ key: 'value' }, 'string')).toEqual('')
    expect(convertAttributeValue({ key: 'value' }, 'number')).toEqual(0)
    expect(convertAttributeValue({ key: 'value' }, 'boolean')).toEqual(true)
    expect(convertAttributeValue({ key: 'value' }, 'reference', 'thing')).toEqual({ entityType: 'thing', entityName: '' })
    expect(convertAttributeValue({ key: 'value' }, 'json')).toEqual({ key: 'value' })

    expect(() => convertAttributeValue('abc', 'notatype')).toThrow('Invalid attribute type "notatype"')
  })

  it('throws an error if attempting to convert to a reference without an entity type', () => {
    expect(() => convertAttributeValue('thing_one', 'reference')).toThrowError()
  })

  it('converts each value of lists', () => {
    expect(convertAttributeValue({ items: ['42', 'value'], itemsType: 'AttributeValue' }, 'number')).toEqual({ items: [42, 0], itemsType: 'AttributeValue' })

    expect(convertAttributeValue({
      items: [
        { entityType: 'thing', entityName: 'thing_one' },
        { entityType: 'thing', entityName: 'thing_two' }
      ],
      itemsType: 'EntityReference'
    }, 'string')).toEqual({ items: ['thing_one', 'thing_two'], itemsType: 'AttributeValue' })
  })

  it('adds itemsType to reference lists', () => {
    expect(convertAttributeValue({ items: ['thing_one', 'thing_two'], itemsType: 'AttributeValue' }, 'reference', 'thing')).toEqual({
      items: [
        { entityType: 'thing', entityName: 'thing_one' },
        { entityType: 'thing', entityName: 'thing_two' }
      ],
      itemsType: 'EntityReference'
    })
  })

  it('converts lists to arrays', () => {
    expect(convertAttributeValue({
      items: ['a', 'b', 'c'],
      itemsType: 'AttributeValue'
    }, 'json')).toEqual(['a', 'b', 'c'])
    expect(convertAttributeValue({
      items: [1, 2, 3],
      itemsType: 'AttributeValue'
    }, 'json')).toEqual([1, 2, 3])
    expect(convertAttributeValue({
      items: [true, false, true],
      itemsType: 'AttributeValue'
    }, 'json')).toEqual([true, false, true])
  })

  it('converts arrays to lists', () => {
    expect(convertAttributeValue(['a', 'b', 'c'], 'string')).toEqual({
      items: ['a', 'b', 'c'],
      itemsType: 'AttributeValue'
    })
    expect(convertAttributeValue(['1', '2', '3'], 'number')).toEqual({
      items: [1, 2, 3],
      itemsType: 'AttributeValue'
    })
    expect(convertAttributeValue(['true', 'false', 'true'], 'boolean')).toEqual({
      items: [true, false, true],
      itemsType: 'AttributeValue'
    })
  })
})

describe('prepareAttributeForUpload', () => {
  it('trims string values', () => {
    expect(prepareAttributeForUpload('foo ')).toEqual('foo')
    expect(prepareAttributeForUpload({
      items: [' foo', ' bar '],
      itemsType: 'AttributeValue'
    })).toEqual({
      items: ['foo', 'bar'],
      itemsType: 'AttributeValue'
    })
  })

  it('trims entity names in references', () => {
    expect(prepareAttributeForUpload({
      entityType: 'thing',
      entityName: 'thing_one '
    })).toEqual({
      entityType: 'thing',
      entityName: 'thing_one'
    })
    expect(prepareAttributeForUpload({
      items: [
        { entityType: 'thing', entityName: 'thing_one ' },
        { entityType: 'thing', entityName: ' thing_two' }
      ],
      itemsType: 'EntityReference'
    })).toEqual({
      items: [
        { entityType: 'thing', entityName: 'thing_one' },
        { entityType: 'thing', entityName: 'thing_two' }
      ],
      itemsType: 'EntityReference'
    })
  })

  it('leaves other types unchanged', () => {
    expect(prepareAttributeForUpload(false)).toEqual(false)
    expect(prepareAttributeForUpload({
      items: [true, false],
      itemsType: 'AttributeValue'
    })).toEqual({
      items: [true, false],
      itemsType: 'AttributeValue'
    })

    expect(prepareAttributeForUpload(42)).toEqual(42)
    expect(prepareAttributeForUpload({
      items: [1, 2, 3],
      itemsType: 'AttributeValue'
    })).toEqual({
      items: [1, 2, 3],
      itemsType: 'AttributeValue'
    })
  })
})
