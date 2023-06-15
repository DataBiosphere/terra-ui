import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/analysis/_testData/testData';
import { AnalysisDuplicator, AnalysisDuplicatorProps } from 'src/analysis/modals/AnalysisDuplicator';
import { AnalysisFile, getFileFromPath, useAnalysisFiles } from 'src/analysis/useAnalysisFiles';
import { AbsolutePath, getExtension } from 'src/analysis/utils/file-utils';
import { runtimeToolLabels } from 'src/analysis/utils/tool-utils';
import { AzureStorage, AzureStorageContract } from 'src/libs/ajax/AzureStorage';
import { GoogleStorage, GoogleStorageContract } from 'src/libs/ajax/GoogleStorage';
import { errorWatcher } from 'src/libs/error.mock';
import { asMockedFn } from 'src/testing/test-utils';

type ModalMockExports = typeof import('src/components/Modal.mock');
jest.mock('src/components/Modal', () => {
  const mockModal = jest.requireActual<ModalMockExports>('src/components/Modal.mock');
  return mockModal.mockModalModule();
});

jest.mock('src/libs/notifications', () => ({
  notify: jest.fn(),
}));

jest.mock('src/libs/ajax/GoogleStorage');
jest.mock('src/libs/ajax/AzureStorage');

type UseAnalysisFilesExport = typeof import('src/analysis/useAnalysisFiles');
jest.mock('src/pages/workspaces/workspace/analysis/useAnalysisFiles', (): UseAnalysisFilesExport => {
  const originalModule = jest.requireActual('src/pages/workspaces/workspace/analysis/useAnalysisFiles');
  return {
    ...originalModule,
    useAnalysisFiles: jest.fn(),
  };
});

type MockErrorExports = typeof import('src/libs/error.mock');
jest.mock('src/libs/error', () => {
  const errorModule = jest.requireActual('src/libs/error');
  const mockErrorModule = jest.requireActual<MockErrorExports>('src/libs/error.mock');
  return {
    ...errorModule,
    withErrorReportingInModal: mockErrorModule.mockWithErrorReportingInModal,
  };
});

const onDismiss = jest.fn();
const onSuccess = jest.fn();

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
    const copy = jest.fn();

    const analysisMock: Partial<GoogleStorageContract['analysis']> = jest.fn(() => ({
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
    const rename = jest.fn();
    const analysisMock: Partial<GoogleStorageContract['analysis']> = jest.fn(() => ({
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
    const copy = jest.fn();
    const analysisMock: Partial<AzureStorageContract['blob']> = jest.fn(() => ({
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
    const rename = jest.fn();
    const analysisMock: Partial<AzureStorageContract['blob']> = jest.fn(() => ({
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
    const renameMock = jest.fn().mockRejectedValue(new Error(testExceptionMessage));
    const analysisMock: Partial<GoogleStorageContract['analysis']> = jest.fn(() => ({
      rename: renameMock,
    }));
    const googleStorageMock: Partial<GoogleStorageContract> = {
      listAnalyses: () => Promise.resolve(fileList),
      analysis: analysisMock as GoogleStorageContract['analysis'],
    };
    const onDismiss = jest.fn();

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
