import { render } from '@testing-library/react'
import { formatTableCell } from 'src/pages/library/DataBrowserPreview'


describe('DataBrowserPreview', () => {
  it('renders json as view json', () => {
    const { getByText } = render(formatTableCell({ cellKey: 'string', cellContent: '{"key": "value"}', rowIndex: 0, table: 'table', setViewJSON: () => {} }))
    expect(getByText('View JSON')).toBeTruthy()
  })

  it('renders object as view json', () => {
    const { getByText } = render(formatTableCell({ cellKey: 'string', cellContent: { key: 'value' }, rowIndex: 0, table: 'table', setViewJSON: () => {} }))
    expect(getByText('View JSON')).toBeTruthy()
  })

  it('renders array as view json', () => {
    const { getByText } = render(formatTableCell({ cellKey: 'string', cellContent: ['a', 'b', 'c'], rowIndex: 0, table: 'table', setViewJSON: () => {} }))
    expect(getByText('View JSON')).toBeTruthy()
  })

  it('renders numbers as number', () => {
    const { getByText } = render(formatTableCell({ cellKey: 'string', cellContent: 1, rowIndex: 0, table: 'table', setViewJSON: () => {} }))
    expect(getByText('1')).toBeTruthy()
  })

  it('renders non number, non object as toString version', () => {
    const cellContent = 'abc'
    const { getByText } = render(formatTableCell({ cellKey: 'string', cellContent, rowIndex: 0, table: 'table', setViewJSON: () => {} }))
    expect(getByText(cellContent)).toBeTruthy()
  })
})
