import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { AzureStorage, AzureStorageContract } from 'src/libs/ajax/AzureStorage';
import { GoogleStorage, GoogleStorageContract } from 'src/libs/ajax/GoogleStorage';
import { errorWatcher } from 'src/libs/error.mock';
import {
  defaultAzureWorkspace,
  defaultGoogleWorkspace,
} from 'src/pages/workspaces/workspace/analysis/_testData/testData';
import {
  AnalysisDuplicator,
  AnalysisDuplicatorProps,
} from 'src/pages/workspaces/workspace/analysis/modals/AnalysisDuplicator';
import {
  AnalysisFile,
  getFileFromPath,
  useAnalysisFiles,
} from 'src/pages/workspaces/workspace/analysis/useAnalysisFiles';
import { AbsolutePath, getExtension } from 'src/pages/workspaces/workspace/analysis/utils/file-utils';
import { runtimeToolLabels } from 'src/pages/workspaces/workspace/analysis/utils/tool-utils';
import { asMockedFn } from 'src/testing/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type ModalMockExports = typeof import('src/components/Modal.mock');
vi.mock('src/components/Modal', async () => {
  const mockModal = await vi.importActual<ModalMockExports>('src/components/Modal.mock');
  return mockModal.mockModalModule();
});

vi.mock('src/libs/notifications', () => ({
  notify: vi.fn(),
}));

vi.mock('src/libs/ajax/GoogleStorage');
vi.mock('src/libs/ajax/AzureStorage');

type UseAnalysisFilesExport = typeof import('src/pages/workspaces/workspace/analysis/useAnalysisFiles');
vi.mock('src/pages/workspaces/workspace/analysis/useAnalysisFiles', async (): Promise<UseAnalysisFilesExport> => {
  return {
    ...(await vi.importActual('src/pages/workspaces/workspace/analysis/useAnalysisFiles')),
    useAnalysisFiles: vi.fn(),
  };
});

type MockErrorExports = typeof import('src/libs/error.mock');
vi.mock('src/libs/error', async () => {
  const errorModule = vi.importActual('src/libs/error');
  const mockErrorModule = await vi.importActual<MockErrorExports>('src/libs/error.mock');
  return {
    ...errorModule,
    withErrorReportingInModal: mockErrorModule.mockWithErrorReportingInModal,
  };
});

const onDismiss = vi.fn();
const onSuccess = vi.fn();

const baseTestFile: AnalysisFile = getFileFromPath('test/file0.ipynb' as AbsolutePath);

const defaultModalProps: AnalysisDuplicatorProps = {
  destroyOld: false,
  fromLauncher: false,
  printName: baseTestFile.fileName,
  toolLabel: runtimeToolLabels.Jupyter,
  workspaceInfo: defaultGoogleWorkspace.workspace,
  onDismiss,
  onSuccess,
};

describe('AnalysisDuplicator', () => {
  beforeEach(() => {
    // Arrange
    asMockedFn(useAnalysisFiles).mockImplementation(() => ({
      refreshFileStore: () => Promise.resolve(),
      loadedState: { state: [], status: 'Ready' },
      createAnalysis: () => Promise.resolve(),
      deleteAnalysis: () => Promise.resolve(),
      pendingCreate: { status: 'Ready', state: true },
      pendingDelete: { status: 'Ready', state: true },
    }));
  });

  it('renders correctly by default with destroyOld false', () => {
    // Act
    render(h(AnalysisDuplicator, defaultModalProps));

    // Assert
    screen.getByText(`Copy "${baseTestFile.fileName}"`);
  });

  it('renders correctly by default with destroyOld true', () => {
    // Act
    render(
      h(AnalysisDuplicator, {
        ...defaultModalProps,
        destroyOld: true,
      })
    );

    // Assert
    screen.getByText(`Rename "${baseTestFile.fileName}"`);
  });

  it.each([
    { inputText: ' ', errorMsg: "Name can't be blank" },
    { inputText: 'invalid$', errorMsg: "Name can't contain these characters:" },
    { inputText: 'file1', errorMsg: 'Name already exists' },
  ])('rejects existing and invalid names', async ({ inputText, errorMsg }) => {
    // Arrange
    const fileList = [
      getFileFromPath('test/file1.ipynb' as AbsolutePath),
      getFileFromPath('test/file2.ipynb' as AbsolutePath),
    ];
    asMockedFn(useAnalysisFiles).mockImplementation(() => ({
      loadedState: { state: fileList, status: 'Ready' },
      refreshFileStore: () => Promise.resolve(),
      createAnalysis: () => Promise.resolve(),
      deleteAnalysis: () => Promise.resolve(),
      pendingCreate: { status: 'Ready', state: true },
      pendingDelete: { status: 'Ready', state: true },
    }));

    // Act
    render(h(AnalysisDuplicator, defaultModalProps));

    // Assert
    const input = screen.getByLabelText(/New Name/);
    await userEvent.type(input, inputText);

    expect(screen.getAllByText(errorMsg).length).toBe(2);
    const button = screen.getByText('Copy Analysis');
    expect(button).toHaveAttribute('disabled');
  });

  it('copies for a google workspace correctly', async () => {
    // Arrange
    const fileList = [
      getFileFromPath('test/file1.ipynb' as AbsolutePath),
      getFileFromPath('test/file2.ipynb' as AbsolutePath),
    ];
    const copy = vi.fn();

    const analysisMock: Partial<GoogleStorageContract['analysis']> = vi.fn(() => ({
      copy,
    }));

    const googleStorageMock: Partial<GoogleStorageContract> = {
      listAnalyses: () => Promise.resolve(fileList),
      analysis: analysisMock as GoogleStorageContract['analysis'],
    };

    asMockedFn(GoogleStorage).mockImplementation(() => googleStorageMock as GoogleStorageContract);

    // Act
    render(h(AnalysisDuplicator, defaultModalProps));

    // Assert
    const inputText = 'newName';
    const input = screen.getByLabelText(/New Name/);
    await userEvent.type(input, inputText);
    const button = screen.getByText('Copy Analysis');
    await userEvent.click(button);

    expect(analysisMock).toHaveBeenCalledWith(
      defaultGoogleWorkspace.workspace.googleProject,
      defaultGoogleWorkspace.workspace.bucketName,
      defaultModalProps.printName,
      defaultModalProps.toolLabel
    );
    expect(copy).toHaveBeenCalledWith(
      `${inputText}.${getExtension(defaultModalProps.printName)}`,
      defaultGoogleWorkspace.workspace.bucketName,
      true
    );
  });

  it('renames for a google workspace correctly', async () => {
    // Arrange
    const rename = vi.fn();
    const analysisMock: Partial<GoogleStorageContract['analysis']> = vi.fn(() => ({
      rename,
    }));
    const googleStorageMock: Partial<GoogleStorageContract> = {
      analysis: analysisMock as GoogleStorageContract['analysis'],
    };
    asMockedFn(GoogleStorage).mockImplementation(() => googleStorageMock as GoogleStorageContract);

    // Act
    render(h(AnalysisDuplicator, { ...defaultModalProps, destroyOld: true }));

    // Assert
    const inputText = 'newName';
    const input = await screen.findByLabelText(/New Name/);
    await userEvent.type(input, inputText);
    const button = screen.getByText('Rename Analysis');
    await userEvent.click(button);

    expect(analysisMock).toHaveBeenCalledWith(
      defaultGoogleWorkspace.workspace.googleProject,
      defaultGoogleWorkspace.workspace.bucketName,
      defaultModalProps.printName,
      defaultModalProps.toolLabel
    );
    expect(rename).toHaveBeenCalledWith(inputText);
  });

  it('copies for an azure workspace correctly', async () => {
    // Arrange
    const copy = vi.fn();
    const analysisMock: Partial<AzureStorageContract['blob']> = vi.fn(() => ({
      copy,
    }));

    const azureStorageMock: Partial<AzureStorageContract> = {
      blob: analysisMock as AzureStorageContract['blob'],
    };
    asMockedFn(AzureStorage).mockImplementation(() => azureStorageMock as AzureStorageContract);

    // Act
    render(h(AnalysisDuplicator, { ...defaultModalProps, workspaceInfo: defaultAzureWorkspace.workspace }));

    // Assert
    const input = screen.getByLabelText(/New Name/);
    const inputText = 'newName';
    await userEvent.type(input, inputText);
    const button = screen.getByText('Copy Analysis');
    await userEvent.click(button);

    expect(analysisMock).toHaveBeenCalledWith(defaultAzureWorkspace.workspace.workspaceId, defaultModalProps.printName);
    expect(copy).toHaveBeenCalledWith(inputText);
  });

  it('renames for an azure workspace correctly', async () => {
    // Arrange
    const rename = vi.fn();
    const analysisMock: Partial<AzureStorageContract['blob']> = vi.fn(() => ({
      rename,
    }));

    const azureStorageMock: Partial<AzureStorageContract> = {
      blob: analysisMock as AzureStorageContract['blob'],
    };
    asMockedFn(AzureStorage).mockImplementation(() => azureStorageMock as AzureStorageContract);

    // Act
    render(
      h(AnalysisDuplicator, { ...defaultModalProps, workspaceInfo: defaultAzureWorkspace.workspace, destroyOld: true })
    );

    // Assert
    const inputText = 'newName';
    const input = screen.getByLabelText(/New Name/);
    await userEvent.type(input, inputText);
    const button = screen.getByText('Rename Analysis');
    await userEvent.click(button);

    expect(analysisMock).toHaveBeenCalledWith(defaultAzureWorkspace.workspace.workspaceId, defaultModalProps.printName);
    expect(rename).toHaveBeenCalledWith(inputText);
  });

  it('handles an error in ajax calls correctly', async () => {
    // Arrange
    const testExceptionMessage = 'test exception msg';
    const fileList = [
      getFileFromPath('test/file1.ipynb' as AbsolutePath),
      getFileFromPath('test/file2.ipynb' as AbsolutePath),
    ];
    const renameMock = vi.fn().mockRejectedValue(new Error(testExceptionMessage));
    const analysisMock: Partial<GoogleStorageContract['analysis']> = vi.fn(() => ({
      rename: renameMock,
    }));
    const googleStorageMock: Partial<GoogleStorageContract> = {
      listAnalyses: () => Promise.resolve(fileList),
      analysis: analysisMock as GoogleStorageContract['analysis'],
    };
    const onDismiss = vi.fn();

    asMockedFn(GoogleStorage).mockImplementation(() => googleStorageMock as GoogleStorageContract);

    // Act
    render(h(AnalysisDuplicator, { ...defaultModalProps, destroyOld: true, onDismiss }));

    const input = await screen.getByLabelText(/New Name/);
    const inputText = 'newName';
    await userEvent.type(input, inputText);
    const button = await screen.getByText('Rename Analysis');
    await userEvent.click(button);

    // Assert
    expect(analysisMock).toHaveBeenCalledWith(
      defaultGoogleWorkspace.workspace.googleProject,
      defaultGoogleWorkspace.workspace.bucketName,
      defaultModalProps.printName,
      defaultModalProps.toolLabel
    );
    expect(renameMock).toHaveBeenCalledWith(inputText);
    expect(onDismiss).toHaveBeenCalled();
    expect(errorWatcher).toHaveBeenCalledTimes(1);
    expect(errorWatcher).toHaveBeenCalledWith('Error renaming analysis', expect.anything());
  });
});
