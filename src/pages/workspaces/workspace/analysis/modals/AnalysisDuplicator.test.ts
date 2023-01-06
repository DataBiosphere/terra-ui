import '@testing-library/jest-dom'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { h } from 'react-hyperscript-helpers'
import { AzureStorage, AzureStorageContract } from 'src/libs/ajax/AzureStorage'
import {
  GoogleStorage,
  GoogleStorageContract
} from 'src/libs/ajax/GoogleStorage'
import { errorWatcher } from 'src/libs/error.mock'
import { CloudProviderType, cloudProviderTypes } from 'src/libs/workspace-utils'
import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/pages/workspaces/workspace/analysis/_testData/testData'
import {
  AbsolutePath, AnalysisFile, getDisplayName, getExtension, getFileName, useAnalysisFiles
} from 'src/pages/workspaces/workspace/analysis/file-utils'
import {
  AnalysisDuplicator,
  AnalysisDuplicatorProps
} from 'src/pages/workspaces/workspace/analysis/modals/AnalysisDuplicator'
import {
  getToolFromFileExtension, ToolLabel, toolLabels
} from 'src/pages/workspaces/workspace/analysis/tool-utils'
import { asMockedFn } from 'src/testing/test-utils'


type ModalMockExports = typeof import('src/components/Modal.mock')
jest.mock('src/components/Modal', () => {
  const mockModal = jest.requireActual<ModalMockExports>('src/components/Modal.mock')
  return mockModal.mockModalModule()
})

jest.mock('src/libs/notifications', () => ({
  notify: jest.fn((...args) => {
    console.debug('######################### notify')/* eslint-disable-line */
    console.debug({ method: 'notify', args: [...args] })/* eslint-disable-line */
  })
}))

jest.mock('src/libs/ajax/GoogleStorage')
jest.mock('src/libs/ajax/AzureStorage')

jest.mock('src/pages/workspaces/workspace/analysis/file-utils', () => {
  const originalModule = jest.requireActual('src/pages/workspaces/workspace/analysis/file-utils')
  return {
    ...originalModule,
    useAnalysisFiles: jest.fn()
  }
})

type MockErrorExports = typeof import('src/libs/error.mock')
jest.mock('src/libs/error', () => {
  const errorModule = jest.requireActual('src/libs/error')
  const mockErrorModule = jest.requireActual<MockErrorExports>('src/libs/error.mock')
  return {
    ...errorModule,
    withErrorReportingInModal: mockErrorModule.mockWithErrorReportingInModal
  }
})

const getTestFile = (abs: AbsolutePath, cloudProvider: CloudProviderType = cloudProviderTypes.GCP): AnalysisFile => ({
  name: abs,
  ext: getExtension(abs),
  displayName: getDisplayName(abs),
  fileName: getFileName(abs),
  tool: getToolFromFileExtension(getExtension(abs)) as ToolLabel,
  lastModified: new Date().getTime(),
  cloudProvider
})

const baseTestFile: AnalysisFile = getTestFile('test/file0.ipynb' as AbsolutePath)

const onDismiss = jest.fn()
const onSuccess = jest.fn()

const defaultModalProps: AnalysisDuplicatorProps = {
  destroyOld: false,
  fromLauncher: false,
  printName: baseTestFile.fileName,
  toolLabel: toolLabels.Jupyter,
  workspaceInfo: defaultGoogleWorkspace.workspace,
  onDismiss, onSuccess
}

describe('AnalysisDuplicator', () => {
  beforeEach(() => {
    // Arrange
    asMockedFn(useAnalysisFiles).mockImplementation(() => ({
      refresh: () => Promise.resolve(),
      loadedState: { state: [], status: 'Ready' },
      create: () => Promise.resolve(), //TODO
      pendingCreate: { status: 'Ready', state: true }
    }))
  })

  it('renders correctly by default with destroyOld false', () => {
    // Act
    render(h(AnalysisDuplicator, defaultModalProps))

    // Assert
    screen.getByText(`Copy "${baseTestFile.fileName}"`)
  })

  it('renders correctly by default with destroyOld true', () => {
    // Act
    render(h(AnalysisDuplicator, {
      ...defaultModalProps,
      destroyOld: true
    }))

    // Assert
    screen.getByText(`Rename "${baseTestFile.fileName}"`)
  })

  it.each(
    [
      { inputText: ' ', errorMsg: 'Name can\'t be blank' },
      { inputText: 'invalid$', errorMsg: 'Name can\'t contain these characters:' },
      { inputText: 'file1', errorMsg: 'Name already exists' }
    ]
  )('rejects existing and invalid names', async ({ inputText, errorMsg }) => {
    // Arrange
    const fileList = [getTestFile('test/file1.ipynb' as AbsolutePath), getTestFile('test/file2.ipynb' as AbsolutePath)]
    asMockedFn(useAnalysisFiles).mockImplementation(() => ({
      loadedState: { state: fileList, status: 'Ready' },
      refresh: () => Promise.resolve(),
      create: () => Promise.resolve(), //TODO: Investigate test
      pendingCreate: { status: 'Ready', state: true }
    }))

    // Act
    render(h(AnalysisDuplicator, defaultModalProps))

    // Assert
    const input = screen.getByLabelText(/New Name/)
    await userEvent.type(input, inputText)

    expect(screen.getAllByText(errorMsg).length).toBe(2)
    const button = screen.getByText('Copy Analysis')
    expect(button).toHaveAttribute('disabled')
  })

  it('copies for a google workspace correctly', async () => {
    // Arrange
    const fileList = [getTestFile('test/file1.ipynb' as AbsolutePath), getTestFile('test/file2.ipynb' as AbsolutePath)]
    const copy = jest.fn()

    const analysisMock: Partial<GoogleStorageContract['analysis']> = jest.fn(() => ({
      copy
    }))

    const googleStorageMock: Partial<GoogleStorageContract> = ({
      listAnalyses: () => Promise.resolve(fileList),
      analysis: analysisMock as GoogleStorageContract['analysis']
    })

    asMockedFn(GoogleStorage).mockImplementation(() => googleStorageMock as GoogleStorageContract)


    // Act
    render(h(AnalysisDuplicator, defaultModalProps))

    // Assert
    const inputText = 'newName'
    const input = screen.getByLabelText(/New Name/)
    await userEvent.type(input, inputText)
    const button = screen.getByText('Copy Analysis')
    await userEvent.click(button)

    expect(analysisMock).toHaveBeenCalledWith(defaultGoogleWorkspace.workspace.googleProject, defaultGoogleWorkspace.workspace.bucketName, defaultModalProps.printName, defaultModalProps.toolLabel)
    expect(copy).toHaveBeenCalledWith(`${inputText}.${getExtension(defaultModalProps.printName)}`, defaultGoogleWorkspace.workspace.bucketName, true)
  })

  it('renames for a google workspace correctly', async () => {
    // Arrange
    const rename = jest.fn()
    const analysisMock: Partial<GoogleStorageContract['analysis']> = jest.fn(() => ({
      rename
    }))
    const googleStorageMock: Partial<GoogleStorageContract> = ({
      analysis: analysisMock as GoogleStorageContract['analysis']
    })
    asMockedFn(GoogleStorage).mockImplementation(() => googleStorageMock as GoogleStorageContract)

    // Act
    render(h(AnalysisDuplicator, { ...defaultModalProps, destroyOld: true }))

    // Assert
    const inputText = 'newName'
    const input = await screen.findByLabelText(/New Name/)
    await userEvent.type(input, inputText)
    const button = screen.getByText('Rename Analysis')
    await userEvent.click(button)

    expect(analysisMock).toHaveBeenCalledWith(defaultGoogleWorkspace.workspace.googleProject, defaultGoogleWorkspace.workspace.bucketName, defaultModalProps.printName, defaultModalProps.toolLabel)
    expect(rename).toHaveBeenCalledWith(inputText)
  })

  it('copies for an azure workspace correctly', async () => {
    // Arrange
    const copy = jest.fn()
    const analysisMock: Partial<AzureStorageContract['blob']> = jest.fn(() => ({
      copy
    }))

    const azureStorageMock: Partial<AzureStorageContract> = ({
      blob: analysisMock as AzureStorageContract['blob']
    })
    asMockedFn(AzureStorage).mockImplementation(() => azureStorageMock as AzureStorageContract)

    // Act
    render(h(AnalysisDuplicator, { ...defaultModalProps, workspaceInfo: defaultAzureWorkspace.workspace }))

    // Assert
    const input = screen.getByLabelText(/New Name/)
    const inputText = 'newName'
    await userEvent.type(input, inputText)
    const button = screen.getByText('Copy Analysis')
    await userEvent.click(button)

    expect(analysisMock).toHaveBeenCalledWith(defaultAzureWorkspace.workspace.workspaceId, defaultModalProps.printName)
    expect(copy).toHaveBeenCalledWith(inputText)
  })

  it('renames for an azure workspace correctly', async () => {
    // Arrange
    const rename = jest.fn()
    const analysisMock: Partial<AzureStorageContract['blob']> = jest.fn(() => ({
      rename
    }))

    const azureStorageMock: Partial<AzureStorageContract> = ({
      blob: analysisMock as AzureStorageContract['blob']
    })
    asMockedFn(AzureStorage).mockImplementation(() => azureStorageMock as AzureStorageContract)

    // Act
    render(h(AnalysisDuplicator, { ...defaultModalProps, workspaceInfo: defaultAzureWorkspace.workspace, destroyOld: true }))

    // Assert
    const inputText = 'newName'
    const input = screen.getByLabelText(/New Name/)
    await userEvent.type(input, inputText)
    const button = screen.getByText('Rename Analysis')
    await userEvent.click(button)

    expect(analysisMock).toHaveBeenCalledWith(defaultAzureWorkspace.workspace.workspaceId, defaultModalProps.printName)
    expect(rename).toHaveBeenCalledWith(inputText)
  })

  it('handles an error in ajax calls correctly', async () => {
    // Arrange
    const testExceptionMessage = 'test exception msg'
    const fileList = [getTestFile('test/file1.ipynb' as AbsolutePath), getTestFile('test/file2.ipynb' as AbsolutePath)]
    const renameMock = jest.fn().mockRejectedValue(new Error(testExceptionMessage))
    const analysisMock: Partial<GoogleStorageContract['analysis']> = jest.fn(() => ({
      rename: renameMock
    }))
    const googleStorageMock: Partial<GoogleStorageContract> = ({
      listAnalyses: () => Promise.resolve(fileList),
      analysis: analysisMock as GoogleStorageContract['analysis']
    })
    const onDismiss = jest.fn()

    asMockedFn(GoogleStorage).mockImplementation(() => googleStorageMock as GoogleStorageContract)

    // Act
    render(h(AnalysisDuplicator, { ...defaultModalProps, destroyOld: true, onDismiss }))

    const input = await screen.getByLabelText(/New Name/)
    const inputText = 'newName'
    await userEvent.type(input, inputText)
    const button = await screen.getByText('Rename Analysis')
    await userEvent.click(button)

    // Assert
    expect(analysisMock).toHaveBeenCalledWith(defaultGoogleWorkspace.workspace.googleProject, defaultGoogleWorkspace.workspace.bucketName, defaultModalProps.printName, defaultModalProps.toolLabel)
    expect(renameMock).toHaveBeenCalledWith(inputText)
    expect(onDismiss).toHaveBeenCalled()
    expect(errorWatcher).toHaveBeenCalledTimes(1)
    expect(errorWatcher).toHaveBeenCalledWith('Error renaming analysis', expect.anything())
  })
})
