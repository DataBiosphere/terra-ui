import { render, screen } from '@testing-library/react';
import { div, h } from 'react-hyperscript-helpers';
import { DownloadFileCommand } from 'src/components/file-browser/DownloadFileCommand';
import { DownloadFileLink } from 'src/components/file-browser/DownloadFileLink';
import { FileDetails } from 'src/components/file-browser/FileDetails';
import FileBrowserProvider, { FileBrowserFile } from 'src/libs/ajax/file-browser-providers/FileBrowserProvider';
import { asMockedFn } from 'src/testing/test-utils';

jest.mock('src/components/file-browser/DownloadFileLink', () => ({
  ...jest.requireActual('src/components/file-browser/DownloadFileLink'),
  DownloadFileLink: jest.fn(),
}));

jest.mock('src/components/file-browser/DownloadFileCommand', () => ({
  ...jest.requireActual('src/components/file-browser/DownloadFileCommand'),
  DownloadFileCommand: jest.fn(),
}));

beforeAll(() => {
  asMockedFn(DownloadFileLink).mockImplementation(() => div(['Download file']));
  asMockedFn(DownloadFileCommand).mockImplementation(() => div(['Download command']));
});

describe('FileDetails', () => {
  // Arrange
  const file: FileBrowserFile = {
    path: 'path/to/example.txt',
    url: 'gs://test-bucket/path/to/example.txt',
    contentType: 'text/plain',
    size: 1024 ** 2,
    createdAt: 1667408400000,
    updatedAt: 1667494800000,
  };

  const mockProvider = {} as FileBrowserProvider;

  it.each([
    { field: 'Last modified', expected: '11/3/2022, 5:00:00 PM' },
    { field: 'Created', expected: '11/2/2022, 5:00:00 PM' },
    { field: 'Size', expected: '1 MB' },
  ])('renders $field', ({ field, expected }) => {
    // Act
    render(h(FileDetails, { file, provider: mockProvider }));

    // Assert
    const rawRenderedValue = screen.getByText(field).parentElement!.lastElementChild!.textContent!;
    // normalize non-breaking spaces to just be normal space character for simpler assertion
    const renderedValue = rawRenderedValue.replace(/\xa0/g, ' ').replace(/\u202f/g, ' ');
    expect(renderedValue).toBe(expected);
  });

  it('renders download link', () => {
    // Act
    render(h(FileDetails, { file, provider: mockProvider }));

    // Assert
    screen.getByText('Download file');
  });

  it('renders download command', () => {
    // Act
    render(h(FileDetails, { file, provider: mockProvider }));

    // Assert
    screen.getByText('Download command');
  });
});
