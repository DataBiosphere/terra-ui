import '@testing-library/jest-dom'

import { render, screen } from '@testing-library/react'
import { div, h } from 'react-hyperscript-helpers'
import { DownloadFileLink } from 'src/components/file-browser/DownloadFileLink'
import { FileDetails } from 'src/components/file-browser/FileDetails'
import FileBrowserProvider, { FileBrowserFile } from 'src/libs/ajax/file-browser-providers/FileBrowserProvider'
import { asMockedFn } from 'src/testing/test-utils'


jest.mock('src/components/file-browser/DownloadFileLink', () => ({
  ...jest.requireActual('src/components/file-browser/DownloadFileLink'),
  DownloadFileLink: jest.fn(),
}))

beforeAll(() => {
  asMockedFn(DownloadFileLink).mockImplementation(() => div(['Download file']))
})

describe('FileDetails', () => {
  // Arrange
  const file: FileBrowserFile = {
    path: 'path/to/example.txt',
    url: 'gs://test-bucket/path/to/example.txt',
    size: 1024 ** 2,
    createdAt: 1667408400000,
    updatedAt: 1667494800000,
  }

  const mockProvider = {} as FileBrowserProvider

  it.each([
    { field: 'Last modified', expected: '11/3/2022, 5:00:00 PM' },
    { field: 'Created', expected: '11/2/2022, 5:00:00 PM' },
    { field: 'Size', expected: '1 MB' },
  ])('renders $field', ({ field, expected }) => {
    // Act
    render(h(FileDetails, { file, provider: mockProvider }))

    // Assert
    const renderedValue = screen.getByText(field).parentElement!.lastElementChild!.textContent!
    expect(renderedValue).toBe(expected)
  })

  it('renders download link', () => {
    // Act
    render(h(FileDetails, { file, provider: mockProvider }))

    // Assert
    screen.getByText('Download file')
  })
})
