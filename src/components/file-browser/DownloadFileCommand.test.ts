import { render, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import FileBrowserProvider, { FileBrowserFile } from 'src/libs/ajax/file-browser-providers/FileBrowserProvider';
import { asMockedFn } from 'src/testing/test-utils';

import { DownloadFileCommand } from './DownloadFileCommand';
import { useFileDownloadCommand } from './useFileDownloadCommand';

jest.mock('./useFileDownloadCommand', () => ({
  ...jest.requireActual('./useFileDownloadCommand'),
  useFileDownloadCommand: jest.fn(),
}));

describe('DownloadFileComamnd', () => {
  // Arrange
  const file: FileBrowserFile = {
    path: 'path/to/example.txt',
    url: 'gs://test-bucket/path/to/example.txt',
    size: 1024 ** 2,
    createdAt: 1667408400000,
    updatedAt: 1667494800000,
  };

  const mockProvider = {} as FileBrowserProvider;

  it('renders download command', () => {
    // Arrange
    asMockedFn(useFileDownloadCommand).mockReturnValue({
      status: 'Ready',
      state: 'gsutil cp gs://test-bucket/path/to/example.txt example.txt',
    });

    // Act
    render(h(DownloadFileCommand, { file, provider: mockProvider }));

    // Assert
    screen.getByText('gsutil cp gs://test-bucket/path/to/example.txt example.txt');
  });

  it('renders a spinner while loading command', () => {
    // Arrange
    asMockedFn(useFileDownloadCommand).mockReturnValue({
      status: 'Loading',
      state: null,
    });

    // Act
    const { container } = render(h(DownloadFileCommand, { file, provider: mockProvider }));

    // Assert
    expect(container.querySelector('svg[data-icon="loadingSpinner"]')).toBeTruthy();
  });
});
