import { render } from '@testing-library/react'
import _ from 'lodash/fp'
import { entityAttributeText, getRootTypeForSetTable, prepareAttributeForUpload, renderDataCell } from 'src/components/data/data-utils'
import * as Utils from 'src/libs/utils'


describe('getRootTypeForSetTable', () => {
  it('gets member type for set tables', () => {
    expect(getRootTypeForSetTable('sample_set')).toBe('sample')
  })

  it('gets member type for nested set tables', () => {
    expect(getRootTypeForSetTable('sample_set_set')).toBe('sample')
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
  const testGoogleWorkspace = { workspace: { bucketName: 'test-bucket', cloudPlatform: 'Gcp' } }
  const testAzureWorkspace = { workspace: { bucketName: 'test-bucket', cloudPlatform: 'Azure' } }

  describe('basic data types', () => {
    it.each([
      { testWorkspace: testGoogleWorkspace },
      { testWorkspace: testAzureWorkspace },
    ])('renders strings', ({ testWorkspace }) => {
      expect(render(renderDataCell('abc', testWorkspace)).container).toHaveTextContent('abc')
      expect(render(renderDataCell({ items: ['a', 'b', 'c'], itemsType: 'AttributeValue' }, testWorkspace)).container).toHaveTextContent('a,b,c')
    })

    it.each([
      { testWorkspace: testGoogleWorkspace },
      { testWorkspace: testAzureWorkspace },
    ])('renders numbers', ({ testWorkspace }) => {
      expect(render(renderDataCell(42, testWorkspace)).container).toHaveTextContent('42')
      expect(render(renderDataCell({ items: [1, 2, 3], itemsType: 'AttributeValue' }, testWorkspace)).container).toHaveTextContent('1,2,3')
    })

    it.each([
      { testWorkspace: testGoogleWorkspace },
      { testWorkspace: testAzureWorkspace },
    ])('renders booleans', ({ testWorkspace }) => {
      expect(render(renderDataCell(true, testWorkspace)).container).toHaveTextContent('true')
      expect(render(renderDataCell(false, testWorkspace)).container).toHaveTextContent('false')
      expect(render(renderDataCell({ items: [true, false], itemsType: 'AttributeValue' }, testWorkspace)).container).toHaveTextContent('true,false')
    })

    it('renders entity name for references', () => {
      expect(render(renderDataCell({ entityType: 'thing', entityName: 'thing_one' }, testGoogleWorkspace)).container).toHaveTextContent('thing_one')
      expect(render(renderDataCell({
        items: [
          { entityType: 'thing', entityName: 'thing_one' },
          { entityType: 'thing', entityName: 'thing_two' }
        ],
        itemsType: 'EntityReference'
      }, testGoogleWorkspace)).container).toHaveTextContent('thing_one,thing_two')
    })
  })

  it.each([
    { testWorkspace: testGoogleWorkspace },
    { testWorkspace: testAzureWorkspace },
  ])('renders empty lists', ({ testWorkspace }) => {
    expect(render(renderDataCell({ items: [], itemsType: 'AttributeValue' }, testWorkspace)).container).toHaveTextContent('')
  })

  it.each([
    { testWorkspace: testGoogleWorkspace },
    { testWorkspace: testAzureWorkspace },
  ])('limits the number of list items rendered', ({ testWorkspace }) => {
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

  it.each([
    { testWorkspace: testGoogleWorkspace },
    { testWorkspace: testAzureWorkspace },
  ])('renders missing values', ({ testWorkspace }) => {
    expect(render(renderDataCell(undefined, testWorkspace)).container).toHaveTextContent('')
  })

  describe('JSON values', () => {
    it.each([
      { testWorkspace: testGoogleWorkspace },
      { testWorkspace: testAzureWorkspace },
    ])('renders each item of arrays containing basic data types', ({ testWorkspace }) => {
      expect(render(renderDataCell(['one', 'two', 'three'], testWorkspace)).container).toHaveTextContent('one,two,three')
    })

    it.each([
      { testWorkspace: testGoogleWorkspace },
      { testWorkspace: testAzureWorkspace },
    ])('renders JSON for arrays of objects', ({ testWorkspace }) => {
      expect(render(renderDataCell([
        { key1: 'value1' },
        { key2: 'value2' },
        { key3: 'value3' }
      ], testWorkspace)).container).toHaveTextContent('[ { "key1": "value1" }, { "key2": "value2" }, { "key3": "value3" } ]')
    })

    it.each([
      { testWorkspace: testGoogleWorkspace },
      { testWorkspace: testAzureWorkspace },
    ])('renders empty arrays', ({ testWorkspace }) => {
      expect(render(renderDataCell([], testWorkspace)).container).toHaveTextContent('')
    })

    it.each([
      { testWorkspace: testGoogleWorkspace },
      { testWorkspace: testAzureWorkspace },
    ])('renders JSON for other values', ({ testWorkspace }) => {
      expect(render(renderDataCell({ key: 'value' }, testWorkspace)).container).toHaveTextContent('{ "key": "value" }')
    })
  })

  describe('URLs', () => {
    it('renders links to GCS URLs', () => {
      const { container, getByRole } = render(renderDataCell('gs://bucket/file.txt', testGoogleWorkspace))
      expect(container).toHaveTextContent('file.txt')
      const link = getByRole('link')
      expect(link).toHaveAttribute('href', 'gs://bucket/file.txt')
    })

    it('renders a warning for GCS URLs outside the workspace bucket', () => {
      const { getByText } = render(renderDataCell('gs://other-bucket/file.txt', testGoogleWorkspace))
      expect(getByText('Some files are located outside of the current workspace')).toBeTruthy()
    })

    it('does not render a warning for GCS URLs in the workspace bucket', () => {
      const { queryByText } = render(renderDataCell('gs://test-bucket/file.txt', testGoogleWorkspace))
      expect(queryByText('Some files are located outside of the current workspace')).toBeNull()
    })

    it('renders lists of GCS URLs', () => {
      const { getAllByRole } = render(renderDataCell({
        itemsType: 'AttributeValue',
        items: ['gs://bucket/file1.txt', 'gs://bucket/file2.txt', 'gs://bucket/file3.txt']
      }, testGoogleWorkspace))
      const links = getAllByRole('link')
      expect(_.map('textContent', links)).toEqual(['file1.txt', 'file2.txt', 'file3.txt'])
      expect(_.map('href', links)).toEqual(['gs://bucket/file1.txt', 'gs://bucket/file2.txt', 'gs://bucket/file3.txt'])
    })

    it.each([
      { testWorkspace: testGoogleWorkspace },
      { testWorkspace: testAzureWorkspace },
    ])('renders links to DRS URLs', ({ testWorkspace }) => {
      const { container, getByRole } = render(renderDataCell('drs://example.data.service.org/6cbffaae-fc48-4829-9419-1a2ef0ca98ce', testWorkspace))
      expect(container).toHaveTextContent('drs://example.data.service.org/6cbffaae-fc48-4829-9419-1a2ef0ca98ce')
      const link = getByRole('link')
      expect(link).toHaveAttribute('href', 'drs://example.data.service.org/6cbffaae-fc48-4829-9419-1a2ef0ca98ce')
    })

    it('renders links to Azure URLs', () => {
      const { container, getByRole } = render(renderDataCell('https://sa226344b664da26ad6863.blob.core.windows.net/file1.cram', testAzureWorkspace))
      expect(container).toHaveTextContent('https://sa226344b664da26ad6863.blob.core.windows.net/file1.cram')
      const link = getByRole('link')
      expect(link).toHaveAttribute('href', 'https://sa226344b664da26ad6863.blob.core.windows.net/file1.cram')
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
