import { render, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import FileBrowserProvider, { FileBrowserFile } from 'src/libs/ajax/file-browser-providers/FileBrowserProvider';
import { asMockedFn } from 'src/testing/test-utils';
import { describe, expect, it, vi } from 'vitest';

import { DownloadFileLink } from './DownloadFileLink';
import { useFileDownloadUrl } from './useFileDownloadUrl';

type UseFileDownloadUrlExports = typeof import('./useFileDownloadUrl');
vi.mock('./useFileDownloadUrl', async () => {
  const originalModule = await vi.importActual<UseFileDownloadUrlExports>('./useFileDownloadUrl');
  return {
    ...originalModule,
    useFileDownloadUrl: vi.fn(),
  };
});

describe('DownloadFileLink', () => {
  // Arrange
  const file: FileBrowserFile = {
    path: 'path/to/example.txt',
    url: 'gs://test-bucket/path/to/example.txt',
    size: 1024 ** 2,
    createdAt: 1667408400000,
    updatedAt: 1667494800000,
  };

  const mockProvider = {} as FileBrowserProvider;

  it('renders link to download URL', () => {
    // Arrange
    asMockedFn(useFileDownloadUrl).mockReturnValue({
      status: 'Ready',
      state: 'https://terra-ui-test.blob.core.windows.net/test-storage-container?token=sometoken',
    });

    // Act
    render(h(DownloadFileLink, { file, provider: mockProvider }));

    // Assert
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe(
      'https://terra-ui-test.blob.core.windows.net/test-storage-container?token=sometoken'
    );
    expect(link.getAttribute('download')).toBe('example.txt');
  });

  it('disables link when URL is not available', () => {
    // Arrange
    asMockedFn(useFileDownloadUrl).mockReturnValue({
      status: 'Loading',
      state: null,
    });

    // Act
    render(h(DownloadFileLink, { file, provider: mockProvider }));

    // Assert
    const link = screen.getByText('Download');
    expect(link.getAttribute('aria-disabled')).toBe('true');
  });

  it('renders a spinner while loading URL', () => {
    // Arrange
    asMockedFn(useFileDownloadUrl).mockReturnValue({
      status: 'Loading',
      state: null,
    });

    // Act
    render(h(DownloadFileLink, { file, provider: mockProvider }));

    // Assert
    const link = screen.getByText('Download');
    expect(link.querySelector('svg[data-icon="loadingSpinner"]')).toBeTruthy();
  });
});
