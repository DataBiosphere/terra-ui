import '@testing-library/jest-dom'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react-dom/test-utils'
import { h } from 'react-hyperscript-helpers'
import { AzureStorage, AzureStorageContract } from 'src/libs/ajax/AzureStorage'
import { GoogleStorage, GoogleStorageContract } from 'src/libs/ajax/GoogleStorage'
import { asMockedFn } from 'src/libs/testing/test-utils'
import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/pages/workspaces/workspace/analysis/_testData/testData'
import {
  AbsolutePath, AnalysisFile, getDisplayName, getExtension, getFileName, useAnalysisFiles
} from 'src/pages/workspaces/workspace/analysis/file-utils'
import {
  AnalysisDuplicator,
  AnalysisDuplicatorProps
} from 'src/pages/workspaces/workspace/analysis/modals/AnalysisDuplicator'
import {
  getToolFromFileExtension, ToolLabel,
  toolLabelTypes,
  tools
} from 'src/pages/workspaces/workspace/analysis/tool-utils'
import { CloudProviderType, cloudProviderTypes } from 'src/pages/workspaces/workspace/workspace-utils'


jest.mock('src/components/Modal', () => {
  const { div, h } = jest.requireActual('react-hyperscript-helpers')
  const originalModule = jest.requireActual('src/components/Modal')
  return {
    ...originalModule,
    __esModule: true,
    default: props => div({ id: 'modal-root' }, [
      h(originalModule.default, { onAfterOpen: jest.fn(), ...props })
    ])
  }
})

jest.mock('src/libs/notifications', () => ({
  notify: (...args) => {
    console.debug('######################### notify')/* eslint-disable-line */
    console.debug({ method: 'notify', args: [...args] })/* eslint-disable-line */
  }
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
  toolLabel: toolLabelTypes[tools.Jupyter.label],
  workspaceInfo: defaultGoogleWorkspace.workspace,
  onDismiss, onSuccess
}

describe('AnalysisDuplicator', () => {
  beforeEach(() => {
    // Arrange
    const googleStorageMock: Partial<GoogleStorageContract> = ({
      listAnalyses: jest.fn(() => Promise.resolve([]))
    })
    asMockedFn(GoogleStorage).mockImplementation(() => googleStorageMock as GoogleStorageContract)

    const azureStorageMock: Partial<AzureStorageContract> = ({
      listNotebooks: jest.fn()
    })
    asMockedFn(AzureStorage).mockImplementation(() => azureStorageMock as AzureStorageContract)

    asMockedFn(useAnalysisFiles).mockImplementation(() => ({
      analyses: [],
      refresh: () => {},
      loading: false
    }))
  })

  it('renders correctly by default with destroyOld false', () => {
    render(h(AnalysisDuplicator, defaultModalProps))

    screen.getByText(`Copy "${baseTestFile.fileName}"`)
  })

  it('renders correctly by default with destroyOld true', () => {
    render(h(AnalysisDuplicator, {
      ...defaultModalProps,
      destroyOld: true
    }))

    screen.getByText(`Rename "${baseTestFile.fileName}"`)
  })

  it.each(
    [
      { inputText: ' ', errorMsg: 'Name can\'t be blank' },
      { inputText: 'invalid$', errorMsg: 'Name can\'t contain these characters:' },
      { inputText: 'file1', errorMsg: 'Name already exists' }
    ]
  )('rejects existing and invalid names', async ({ inputText, errorMsg }) => {
    const fileList = [getTestFile('test/file1.ipynb' as AbsolutePath), getTestFile('test/file2.ipynb' as AbsolutePath)]
    asMockedFn(useAnalysisFiles).mockImplementation(() => ({
      analyses: fileList,
      refresh: () => {},
      loading: false
    }))

    act(() => {
      render(h(AnalysisDuplicator, defaultModalProps))
    })

    const input = screen.getByLabelText(/New Name/)
    await userEvent.type(input, inputText)

    expect(screen.getAllByText(errorMsg).length).toBe(2)
    const button = screen.getByText('Copy Analysis')
    // @ts-expect-error
    expect(button).toHaveAttribute('disabled')
  })

  it('copies for a google workspace correctly', async () => {
    const fileList = [getTestFile('test/file1.ipynb' as AbsolutePath), getTestFile('test/file2.ipynb' as AbsolutePath)]
    const calledMock = jest.fn()
    const analysisMock = jest.fn(() => ({
      copy: calledMock
    }))
    const googleStorageMock: Partial<GoogleStorageContract> = ({
      listAnalyses: () => Promise.resolve(fileList),
      // @ts-expect-error
      analysis: analysisMock
    })
    asMockedFn(GoogleStorage).mockImplementation(() => googleStorageMock as GoogleStorageContract)

    render(h(AnalysisDuplicator, defaultModalProps))


    const inputText = 'newName'
    const input = screen.getByLabelText(/New Name/)
    await userEvent.type(input, inputText)
    const button = screen.getByText('Copy Analysis')
    await userEvent.click(button)

    expect(analysisMock).toHaveBeenCalledWith(defaultGoogleWorkspace.workspace.googleProject, defaultGoogleWorkspace.workspace.bucketName, defaultModalProps.printName, defaultModalProps.toolLabel)
    expect(calledMock).toHaveBeenCalledWith(`${inputText}.${getExtension(defaultModalProps.printName)}`, defaultGoogleWorkspace.workspace.bucketName, true)
  })

  it('renames for a google workspace correctly', async () => {
    const calledMock = jest.fn()
    const analysisMock = jest.fn(() => ({
      rename: calledMock
    }))
    const googleStorageMock: Partial<GoogleStorageContract> = ({
      // @ts-expect-error
      analysis: analysisMock
    })
    asMockedFn(GoogleStorage).mockImplementation(() => googleStorageMock as GoogleStorageContract)

    render(h(AnalysisDuplicator, { ...defaultModalProps, destroyOld: true }))

    const inputText = 'newName'
    const input = await screen.findByLabelText(/New Name/)
    await userEvent.type(input, inputText)
    const button = screen.getByText('Rename Analysis')
    await userEvent.click(button)

    expect(analysisMock).toHaveBeenCalledWith(defaultGoogleWorkspace.workspace.googleProject, defaultGoogleWorkspace.workspace.bucketName, defaultModalProps.printName, defaultModalProps.toolLabel)
    expect(calledMock).toHaveBeenCalledWith(inputText)
  })

  it('copies for an azure workspace correctly', async () => {
    const calledMock = jest.fn()
    const analysisMock = jest.fn(() => ({
      copy: calledMock
    }))

    const azureStorageMock: Partial<AzureStorageContract> = ({
      // @ts-expect-error
      blob: analysisMock
    })
    asMockedFn(AzureStorage).mockImplementation(() => azureStorageMock as AzureStorageContract)

    const inputText = 'newName'
    render(h(AnalysisDuplicator, { ...defaultModalProps, workspaceInfo: defaultAzureWorkspace.workspace }))

    const input = screen.getByLabelText(/New Name/)
    await userEvent.type(input, inputText)
    const button = screen.getByText('Copy Analysis')
    await userEvent.click(button)

    expect(analysisMock).toHaveBeenCalledWith(defaultAzureWorkspace.workspace.workspaceId, defaultModalProps.printName)
    expect(calledMock).toHaveBeenCalledWith(inputText)
  })

  it('renames for an azure workspace correctly', async () => {
    const calledMock = jest.fn()
    const analysisMock = jest.fn(() => ({
      rename: calledMock
    }))

    const azureStorageMock: Partial<AzureStorageContract> = ({
      // @ts-expect-error
      blob: analysisMock
    })
    asMockedFn(AzureStorage).mockImplementation(() => azureStorageMock as AzureStorageContract)

    render(h(AnalysisDuplicator, { ...defaultModalProps, workspaceInfo: defaultAzureWorkspace.workspace, destroyOld: true }))

    const inputText = 'newName'
    const input = screen.getByLabelText(/New Name/)
    await userEvent.type(input, inputText)
    const button = screen.getByText('Rename Analysis')
    await userEvent.click(button)

    expect(analysisMock).toHaveBeenCalledWith(defaultAzureWorkspace.workspace.workspaceId, defaultModalProps.printName)
    expect(calledMock).toHaveBeenCalledWith(inputText)
  })

  // TODO: testing curried error handling needs investigation...
  // it('handles an error in ajax calls correctly', async () => {
  //   const fileList = [getTestFile('test/file1.ipynb' as AbsolutePath), getTestFile('test/file2.ipynb' as AbsolutePath)]
  //   const testExceptionMessage = 'test exception msg'
  //   // const analysisMock = jest.fn(() => ({
  //   //   rename: () => {
  //   //     throw new Error(testExceptionMessage)
  //   //   }
  //   // }))
  //   const analysisMock = () => {
  //     throw new Error(testExceptionMessage)
  //   }
  //   const googleStorageMock: Partial<GoogleStorageContract> = ({
  //     listAnalyses: () => Promise.resolve(fileList)
  //   })
  //
  //   const onDismiss = jest.fn()
  //
  //   asMockedFn(GoogleStorage).mockImplementation(() => googleStorageMock as GoogleStorageContract)
  //
  //
  //   const azureStorageMock: Partial<AzureStorageContract> = ({
  //     listNotebooks: () => Promise.resolve(fileList),
  //     // @ts-expect-error
  //     blob: analysisMock
  //   })
  //   asMockedFn(AzureStorage).mockImplementation(() => azureStorageMock as AzureStorageContract)
  //
  //   const inputText = 'newName'
  //   await act(async () => {
  //     await render(h(AnalysisDuplicator, { ...defaultModalProps, workspace: defaultAzureWorkspace.workspace, destroyOld: true, onDismiss }))
  //     const input = await screen.getByLabelText(/New Name/)
  //     await userEvent.type(input, inputText)
  //     const button = await screen.getByText('Rename Analysis')
  //     try {
  //       userEvent.click(button)
  //     } catch {
  //
  //     }
  //   })
  //
  //   // expect(analysisMock).toHaveBeenCalledWith(defaultAzureWorkspace.workspace.workspaceId, defaultModalProps.printName)
  //   expect(onDismiss).toHaveBeenCalled()
  // })
})
