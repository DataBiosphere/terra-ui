import '@testing-library/jest-dom'

import { render, screen } from '@testing-library/react'
import { h } from 'react-hyperscript-helpers'
import { FileDetails } from 'src/components/file-browser/FileDetails'
import { FileBrowserFile } from 'src/libs/ajax/file-browser-providers/FileBrowserProvider'


describe('FileDetails', () => {
  // Arrange
  const file: FileBrowserFile = {
    path: 'path/to/example.txt',
    url: 'gs://test-bucket/path/to/example.txt',
    size: 1024 ** 2,
    createdAt: 1667408400000,
    updatedAt: 1667494800000,
  }

  it.each([
    { field: 'Last modified', expected: '11/3/2022, 5:00:00 PM' },
    { field: 'Created', expected: '11/2/2022, 5:00:00 PM' },
    { field: 'Size', expected: '1 MB' },
  ])('renders $field', ({ field, expected }) => {
    // Act
    render(h(FileDetails, { file }))

    // Assert
    const renderedValue = screen.getByText(field).parentElement!.lastElementChild!.textContent!
    expect(renderedValue).toBe(expected)
  })
})
