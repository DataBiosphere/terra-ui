import { act, renderHook } from '@testing-library/react';
import FileBrowserProvider, { FileBrowserFile } from 'src/libs/ajax/file-browser-providers/FileBrowserProvider';
import { reportError } from 'src/libs/error';
import { controlledPromise } from 'src/testing/test-utils';

import { useFileDownloadCommand } from './useFileDownloadCommand';

jest.mock('src/libs/error', () => ({
  ...jest.requireActual('src/libs/error'),
  reportError: jest.fn(),
}));

describe('useFileDownloadCommand', () => {
  let getDownloadCommandForFileController;

  // Arrange
  const mockProvider = {
    getDownloadCommandForFile: jest.fn(() => {
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
    const { result: hookReturnRef } = renderHook(() => useFileDownloadCommand({ file, provider: mockProvider }));
    await act(async () => {
      getDownloadCommandForFileController.resolve('gsutil cp gs://test-bucket/path/to/example.txt .');
    });
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
    const { result: hookReturnRef } = renderHook(() => useFileDownloadCommand({ file, provider: mockProvider }));
    await act(async () => {
      getDownloadCommandForFileController.reject(new Error('Something went wrong'));
    });
    const result = hookReturnRef.current;

    // Assert
    expect(reportError).toHaveBeenCalled();
    expect(result).toEqual({ status: 'Error', state: null, error: new Error('Something went wrong') });
  });
});
