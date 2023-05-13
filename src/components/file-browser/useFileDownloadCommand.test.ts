import { renderHook } from '@testing-library/react-hooks';
import FileBrowserProvider, { FileBrowserFile } from 'src/libs/ajax/file-browser-providers/FileBrowserProvider';
import { reportError } from 'src/libs/error';
import { controlledPromise } from 'src/testing/test-utils';
import { describe, expect, it, vi } from 'vitest';

import { useFileDownloadCommand } from './useFileDownloadCommand';

vi.mock('src/libs/error', () => ({
  ...vi.importActual('src/libs/error'),
  reportError: vi.fn(),
}));

describe('useFileDownloadCommand', () => {
  let getDownloadCommandForFileController;

  // Arrange
  const mockProvider = {
    getDownloadCommandForFile: vi.fn(() => {
      const [promise, controller] = controlledPromise<string>();
      getDownloadCommandForFileController = controller;
      return promise;
    }),
  } as Partial<FileBrowserProvider> as FileBrowserProvider;

  it('returns download command for file', async () => {
    // Arrange
    const file: FileBrowserFile = {
      path: 'path/to/example.txt',
      url: 'gs://test-bucket/path/to/example.txt',
      size: 1024 ** 2,
      createdAt: 1667408400000,
      updatedAt: 1667494800000,
    };

    // Act
    const { result: hookReturnRef, waitForNextUpdate } = renderHook(() =>
      useFileDownloadCommand({ file, provider: mockProvider })
    );
    getDownloadCommandForFileController.resolve('gsutil cp gs://test-bucket/path/to/example.txt .');
    await waitForNextUpdate();
    const result = hookReturnRef.current;

    // Assert
    expect(result).toEqual({ status: 'Ready', state: 'gsutil cp gs://test-bucket/path/to/example.txt .' });
  });

  it('handles errors', async () => {
    // Arrange
    const file: FileBrowserFile = {
      path: 'path/to/example.txt',
      url: 'gs://test-bucket/path/to/example.txt',
      size: 1024 ** 2,
      createdAt: 1667408400000,
      updatedAt: 1667494800000,
    };

    // Act
    const { result: hookReturnRef, waitForNextUpdate } = renderHook(() =>
      useFileDownloadCommand({ file, provider: mockProvider })
    );
    getDownloadCommandForFileController.reject(new Error('Something went wrong'));
    await waitForNextUpdate();
    const result = hookReturnRef.current;

    // Assert
    expect(reportError).toHaveBeenCalled();
    expect(result).toEqual({ status: 'Error', state: null, error: new Error('Something went wrong') });
  });
});
