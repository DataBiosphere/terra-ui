import '@testing-library/jest-dom';

import { act, renderHook } from '@testing-library/react-hooks';
import { AzureStorage, AzureStorageContract } from 'src/libs/ajax/AzureStorage';
import { GoogleStorage, GoogleStorageContract } from 'src/libs/ajax/GoogleStorage';
import { reportError } from 'src/libs/error';
import { workspaceStore } from 'src/libs/state';
import { ReadyState } from 'src/libs/type-utils/LoadedState';
import {
  defaultAzureWorkspace,
  defaultGoogleWorkspace,
} from 'src/pages/workspaces/workspace/analysis/_testData/testData';
import {
  AnalysisFile,
  getFileFromPath,
  useAnalysisFiles,
} from 'src/pages/workspaces/workspace/analysis/useAnalysisFiles';
import { AbsolutePath, getExtension, getFileName } from 'src/pages/workspaces/workspace/analysis/utils/file-utils';
import {
  getToolLabelFromFileExtension,
  runtimeToolLabels,
} from 'src/pages/workspaces/workspace/analysis/utils/tool-utils';
import { asMockedFn } from 'src/testing/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('src/libs/ajax/GoogleStorage');
vi.mock('src/libs/ajax/AzureStorage');

type ErrorExports = typeof import('src/libs/error');
vi.mock('src/libs/error', async () => {
  const originalModule = await vi.importActual<ErrorExports>('src/libs/error');
  return {
    ...originalModule,
    reportError: vi.fn(),
  };
});

vi.mock('src/libs/notifications', () => ({
  notify: vi.fn((...args) => {
    console.debug('######################### notify')/* eslint-disable-line */
    console.debug({ method: 'notify', args: [...args] })/* eslint-disable-line */
  }),
}));

describe('file-utils', () => {
  describe('useAnalysisFiles', () => {
    beforeEach(() => {
      workspaceStore.reset();
      const googleStorageMock: Partial<GoogleStorageContract> = {
        listAnalyses: vi.fn(() => Promise.resolve([])),
      };
      asMockedFn(GoogleStorage).mockImplementation(() => googleStorageMock as GoogleStorageContract);

      const azureStorageMock: Partial<AzureStorageContract> = {
        listNotebooks: vi.fn(() => Promise.resolve([])),
      };
      asMockedFn(AzureStorage).mockImplementation(() => azureStorageMock as AzureStorageContract);
    });

    it('returns the correct files', async () => {
      // Arrange
      const fileList: AnalysisFile[] = [
        getFileFromPath('test/file1.ipynb' as AbsolutePath),
        getFileFromPath('test/file2.ipynb' as AbsolutePath),
      ];

      const listAnalyses = vi.fn(() => Promise.resolve(fileList));
      const googleStorageMock: Partial<GoogleStorageContract> = {
        listAnalyses,
      };
      asMockedFn(GoogleStorage).mockImplementation(() => googleStorageMock as GoogleStorageContract);

      // Act
      workspaceStore.set(defaultGoogleWorkspace);
      const { result: hookReturnRef, waitForNextUpdate } = renderHook(() => useAnalysisFiles());
      await waitForNextUpdate();
      const state = hookReturnRef.current.loadedState;

      // Assert
      const expectedState: ReadyState<AnalysisFile[]> = { status: 'Ready', state: fileList };
      expect(state).toEqual(expectedState);
    });

    it('loads files from the correct cloud provider storage with a google workspace', async () => {
      // Arrange
      const fileList: AnalysisFile[] = [
        getFileFromPath('test/file1.ipynb' as AbsolutePath),
        getFileFromPath('test/file2.ipynb' as AbsolutePath),
      ];

      const listAnalyses = vi.fn(() => Promise.resolve(fileList));
      const googleStorageMock: Partial<GoogleStorageContract> = {
        listAnalyses,
      };
      asMockedFn(GoogleStorage).mockImplementation(() => googleStorageMock as GoogleStorageContract);

      // Act
      workspaceStore.set(defaultGoogleWorkspace);
      const { waitForNextUpdate } = renderHook(() => useAnalysisFiles());
      await waitForNextUpdate();

      // Assert
      expect(listAnalyses).toHaveBeenCalledWith(
        defaultGoogleWorkspace.workspace.googleProject,
        defaultGoogleWorkspace.workspace.bucketName
      );
    });

    it('loads files from the correct cloud provider storage with an azure workspace', async () => {
      // Arrange
      const fileList = [
        getFileFromPath('test/file1.ipynb' as AbsolutePath),
        getFileFromPath('test/file2.ipynb' as AbsolutePath),
      ];

      const calledMock = vi.fn(() => Promise.resolve(fileList));
      const azureStorageMock: Partial<AzureStorageContract> = {
        listNotebooks: calledMock,
      };
      asMockedFn(AzureStorage).mockImplementation(() => azureStorageMock as AzureStorageContract);

      // Act
      workspaceStore.set(defaultAzureWorkspace);
      const { waitForNextUpdate } = renderHook(() => useAnalysisFiles());
      await waitForNextUpdate();

      // Assert
      expect(calledMock).toHaveBeenCalledWith(defaultAzureWorkspace.workspace.workspaceId);
    });

    it('creates a file with a GCP workspace', async () => {
      // Arrange
      const fileList: AnalysisFile[] = [
        getFileFromPath('test/file1.ipynb' as AbsolutePath),
        getFileFromPath('test/file2.ipynb' as AbsolutePath),
      ];

      const listAnalyses = vi.fn(() => Promise.resolve(fileList));
      const create = vi.fn(() => Promise.resolve());
      const analysisMock: Partial<GoogleStorageContract['analysis']> = vi.fn(() => ({
        create,
      }));
      const googleStorageMock: Partial<GoogleStorageContract> = {
        listAnalyses,
        analysis: analysisMock as GoogleStorageContract['analysis'],
      };
      asMockedFn(GoogleStorage).mockImplementation(() => googleStorageMock as GoogleStorageContract);

      // Act
      workspaceStore.set(defaultGoogleWorkspace);
      const { result: hookReturnRef, waitForNextUpdate } = renderHook(() => useAnalysisFiles());
      await waitForNextUpdate();
      await act(() => hookReturnRef.current.createAnalysis('AnalysisFile', runtimeToolLabels.Jupyter, 'myContents'));

      // Assert
      expect(create).toHaveBeenCalledWith('myContents');
    });

    it('Fails to create a file with a GCP workspace', async () => {
      // Arrange
      const listAnalyses = vi.fn(() => Promise.resolve([]));
      const create = vi.fn(() => Promise.reject(new Error('myError')));
      const analysisMock: Partial<GoogleStorageContract['analysis']> = vi.fn(() => ({
        create,
        refresh: vi.fn(() => Promise.reject(new Error('ee'))),
      }));
      const googleStorageMock: Partial<GoogleStorageContract> = {
        listAnalyses,
        analysis: analysisMock as GoogleStorageContract['analysis'],
      };
      asMockedFn(GoogleStorage).mockImplementation(() => googleStorageMock as GoogleStorageContract);

      // Act
      workspaceStore.set(defaultGoogleWorkspace);
      const hookRender1 = renderHook(() => useAnalysisFiles());
      await hookRender1.waitForNextUpdate();
      const hookResult2 = hookRender1.result.current;
      await act(() => hookResult2.createAnalysis('AnalysisFile', runtimeToolLabels.Jupyter, 'myContents'));

      // Assert
      expect(create).toHaveBeenCalledWith('myContents');
      expect(reportError).toHaveBeenCalled();
    });

    it('creates a file with an Azure workspace', async () => {
      // Arrange
      const fileList: AnalysisFile[] = [
        getFileFromPath('test/file1.ipynb' as AbsolutePath),
        getFileFromPath('test/file2.ipynb' as AbsolutePath),
      ];

      const listNotebooks = vi.fn(() => Promise.resolve(fileList));
      const create = vi.fn(() => Promise.resolve());
      const blobMock: Partial<AzureStorageContract['blob']> = vi.fn(() => ({
        create,
      }));
      const azureStorageMock: Partial<AzureStorageContract> = {
        listNotebooks,
        blob: blobMock as AzureStorageContract['blob'],
      };
      asMockedFn(AzureStorage).mockImplementation(() => azureStorageMock as AzureStorageContract);
      workspaceStore.set(defaultAzureWorkspace);
      const { result: hookReturnRef, waitForNextUpdate } = renderHook(() => useAnalysisFiles());
      await waitForNextUpdate();
      // Act
      await act(() => hookReturnRef.current.createAnalysis('AnalysisFile', runtimeToolLabels.Jupyter, 'myContents'));

      // Assert
      expect(create).toHaveBeenCalledWith('myContents');
    });
  });

  it('Fails to create a file with an Azure workspace', async () => {
    // Arrange
    const listNotebooks = vi.fn(() => Promise.resolve([]));
    const create = vi.fn(() => Promise.reject(new Error('myError')));
    const blobMock: Partial<AzureStorageContract['blob']> = vi.fn(() => ({
      create,
    }));
    const googleStorageMock: Partial<AzureStorageContract> = {
      listNotebooks,
      blob: blobMock as AzureStorageContract['blob'],
    };
    asMockedFn(AzureStorage).mockImplementation(() => googleStorageMock as AzureStorageContract);

    // Act
    workspaceStore.set(defaultAzureWorkspace);
    const hookRender1 = renderHook(() => useAnalysisFiles());
    await hookRender1.waitForNextUpdate();
    const hookResult2 = hookRender1.result.current;
    await act(() => hookResult2.createAnalysis('AnalysisFile', runtimeToolLabels.Jupyter, 'myContents'));

    // Assert
    expect(create).toHaveBeenCalledWith('myContents');
    expect(reportError).toHaveBeenCalled();
  });

  // file deletion tests

  it('deletes a file with a GCP workspace', async () => {
    // Arrange
    const file1Path = 'test/file1.ipynb' as AbsolutePath;
    const fileList: AnalysisFile[] = [getFileFromPath(file1Path), getFileFromPath('test/file2.ipynb' as AbsolutePath)];

    const listAnalyses = vi.fn(() => Promise.resolve(fileList));
    const doDelete = vi.fn(() => Promise.resolve());
    const analysisMock: Partial<GoogleStorageContract['analysis']> = vi.fn(() => ({
      delete: doDelete,
    }));
    const googleStorageMock: Partial<GoogleStorageContract> = {
      listAnalyses,
      analysis: analysisMock as GoogleStorageContract['analysis'],
    };
    asMockedFn(GoogleStorage).mockImplementation(() => googleStorageMock as GoogleStorageContract);

    // Act
    workspaceStore.set(defaultGoogleWorkspace);
    const { result: hookReturnRef, waitForNextUpdate } = renderHook(() => useAnalysisFiles());
    await waitForNextUpdate();
    await act(() => hookReturnRef.current.deleteAnalysis(file1Path));

    // Assert
    expect(analysisMock).toHaveBeenCalledWith(
      defaultGoogleWorkspace.workspace.googleProject,
      defaultGoogleWorkspace.workspace.bucketName,
      getFileName(file1Path),
      getToolLabelFromFileExtension(getExtension(file1Path))
    );
    expect(doDelete).toHaveBeenCalled();
  });

  it('Fails to create a file with a GCP workspace', async () => {
    // Arrange
    const file1Path = 'test/file1.ipynb' as AbsolutePath;
    const listAnalyses = vi.fn(() => Promise.resolve([]));
    const doDelete = vi.fn(() => Promise.reject(new Error('myError')));
    const analysisMock: Partial<GoogleStorageContract['analysis']> = vi.fn(() => ({
      delete: doDelete,
      refresh: vi.fn(() => Promise.reject(new Error('ee'))),
    }));
    const googleStorageMock: Partial<GoogleStorageContract> = {
      listAnalyses,
      analysis: analysisMock as GoogleStorageContract['analysis'],
    };
    asMockedFn(GoogleStorage).mockImplementation(() => googleStorageMock as GoogleStorageContract);

    // Act
    workspaceStore.set(defaultGoogleWorkspace);
    const hookRender1 = renderHook(() => useAnalysisFiles());
    await hookRender1.waitForNextUpdate();
    const hookResult2 = hookRender1.result.current;
    await act(() => hookResult2.deleteAnalysis(file1Path));

    // Assert
    expect(analysisMock).toHaveBeenCalledWith(
      defaultGoogleWorkspace.workspace.googleProject,
      defaultGoogleWorkspace.workspace.bucketName,
      getFileName(file1Path),
      getToolLabelFromFileExtension(getExtension(file1Path))
    );
    expect(doDelete).toHaveBeenCalled();
    expect(reportError).toHaveBeenCalled();
  });

  it('creates a file with an Azure workspace', async () => {
    // Arrange
    const file1Path = 'test/file1.ipynb' as AbsolutePath;
    const fileList: AnalysisFile[] = [getFileFromPath(file1Path), getFileFromPath('test/file2.ipynb' as AbsolutePath)];

    const listNotebooks = vi.fn(() => Promise.resolve(fileList));
    const doDelete = vi.fn(() => Promise.resolve());
    const blobMock: Partial<AzureStorageContract['blob']> = vi.fn(() => ({
      delete: doDelete,
    }));
    const azureStorageMock: Partial<AzureStorageContract> = {
      listNotebooks,
      blob: blobMock as AzureStorageContract['blob'],
    };
    asMockedFn(AzureStorage).mockImplementation(() => azureStorageMock as AzureStorageContract);
    workspaceStore.set(defaultAzureWorkspace);
    const { result: hookReturnRef, waitForNextUpdate } = renderHook(() => useAnalysisFiles());
    await waitForNextUpdate();
    // Act
    await act(() => hookReturnRef.current.deleteAnalysis(file1Path));

    // Assert
    expect(blobMock).toHaveBeenCalledWith(defaultAzureWorkspace.workspace.workspaceId, getFileName(file1Path));
    expect(doDelete).toHaveBeenCalled();
  });

  it('Fails to create a file with an Azure workspace', async () => {
    // Arrange
    const file1Path = 'test/file1.ipynb' as AbsolutePath;
    const listNotebooks = vi.fn(() => Promise.resolve([]));
    const doDelete = vi.fn(() => Promise.reject(new Error('myError')));
    const blobMock: Partial<AzureStorageContract['blob']> = vi.fn(() => ({
      delete: doDelete,
    }));
    const azureStorageMock: Partial<AzureStorageContract> = {
      listNotebooks,
      blob: blobMock as AzureStorageContract['blob'],
    };
    asMockedFn(AzureStorage).mockImplementation(() => azureStorageMock as AzureStorageContract);

    // Act
    workspaceStore.set(defaultAzureWorkspace);
    const hookRender1 = renderHook(() => useAnalysisFiles());
    await hookRender1.waitForNextUpdate();
    const hookResult2 = hookRender1.result.current;
    await act(() => hookResult2.deleteAnalysis(file1Path));

    // Assert
    expect(blobMock).toHaveBeenCalledWith(defaultAzureWorkspace.workspace.workspaceId, getFileName(file1Path));
    expect(doDelete).toHaveBeenCalled();
    expect(reportError).toHaveBeenCalled();
  });
});
