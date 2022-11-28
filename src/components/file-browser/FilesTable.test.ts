import '@testing-library/jest-dom'

import { getAllByRole, getByRole, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { h } from 'react-hyperscript-helpers'
import FilesTable from 'src/components/file-browser/FilesTable'
import { FileBrowserFile } from 'src/libs/ajax/file-browser-providers/FileBrowserProvider'


// FileBrowserTable uses react-virtualized's AutoSizer to size the table.
// This makes the virtualized window large enough for all rows/columns to be rendered in tests.
jest.mock('react-virtualized', () => ({
  ...jest.requireActual('react-virtualized'),
  AutoSizer: ({ children }) => children({ width: 1000, height: 1000 })
}))

describe('FilesTable', () => {
  const files: FileBrowserFile[] = [
    {
      path: 'path/to/file1.txt',
      url: 'gs://test-bucket/path/to/file1.txt',
      size: 1024,
      createdAt: 1667408400000,
      updatedAt: 1667408400000
    },
    {
      path: 'path/to/file2.bam',
      url: 'gs://test-bucket/path/to/file2.bam',
      size: 1024 ** 2,
      createdAt: 1667410200000,
      updatedAt: 1667410200000
    },
    {
      path: 'path/to/file3.vcf',
      url: 'gs://test-bucket/path/to/file3.vcf',
      size: 1024 ** 3,
      createdAt: 1667412000000,
      updatedAt: 1667412000000
    }
  ]

  it.each([
    { field: 'name', columnIndex: 0, expected: ['file1.txt', 'file2.bam', 'file3.vcf'] },
    { field: 'size', columnIndex: 1, expected: ['1 KB', '1 MB', '1 GB'] }
    // { field: 'last modified', columnIndex: 2, expected: [] }
  ])('renders a column with file $field', ({ columnIndex, expected }) => {
    // Act
    render(h(FilesTable, { files, onClickFile: jest.fn() }))

    const tableRows = screen.getAllByRole('row').slice(1) // skip header row
    const cellsInColumn = tableRows.map(row => getAllByRole(row, 'cell')[columnIndex])
    const valuesInColumn = cellsInColumn.map(cell => cell.textContent)

    // Assert
    expect(valuesInColumn).toEqual(expected)
  })

  it('renders file names as links', () => {
    // Act
    render(h(FilesTable, { files, onClickFile: jest.fn() }))

    const tableRows = screen.getAllByRole('row').slice(1) // skip header row
    const fileNameCells = tableRows.map(row => getAllByRole(row, 'cell')[0])
    const fileLinks = fileNameCells.map(cell => getByRole(cell, 'link'))

    // Assert
    expect(fileLinks.map(link => link.getAttribute('href'))).toEqual([
      'gs://test-bucket/path/to/file1.txt',
      'gs://test-bucket/path/to/file2.bam',
      'gs://test-bucket/path/to/file3.vcf'
    ])
  })

  it('calls onClickFile callback when a file link is clicked', async () => {
    // Arrange
    const user = userEvent.setup()

    const onClickFile = jest.fn()
    render(h(FilesTable, { files, onClickFile }))

    const tableRows = screen.getAllByRole('row').slice(1) // skip header row
    const fileNameCells = tableRows.map(row => getAllByRole(row, 'cell')[0])
    const fileLinks = fileNameCells.map(cell => getByRole(cell, 'link'))

    // Act
    await user.click(fileLinks[0])
    await user.click(fileLinks[1])

    // Assert
    expect(onClickFile).toHaveBeenCalledTimes(2)
    expect(onClickFile.mock.calls.map(call => call[0])).toEqual([
      {
        path: 'path/to/file1.txt',
        url: 'gs://test-bucket/path/to/file1.txt',
        size: 1024,
        createdAt: 1667408400000,
        updatedAt: 1667408400000
      },
      {
        path: 'path/to/file2.bam',
        url: 'gs://test-bucket/path/to/file2.bam',
        size: 1024 ** 2,
        createdAt: 1667410200000,
        updatedAt: 1667410200000
      }
    ])
  })
})
