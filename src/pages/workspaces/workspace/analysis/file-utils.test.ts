import '@testing-library/jest-dom'

import { render } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { div, h } from 'react-hyperscript-helpers'
import { AzureStorage, AzureStorageContract } from 'src/libs/ajax/AzureStorage'
import { GoogleStorage, GoogleStorageContract } from 'src/libs/ajax/GoogleStorage'
import { workspaceStore } from 'src/libs/state'
import { asMockedFn } from 'src/libs/testing/test-utils'
import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/pages/workspaces/workspace/analysis/_testData/testData'
import {
  AbsolutePath,
  AnalysisFile,
  getDisplayName,
  getExtension,
  getFileName,
  useAnalysisFiles
} from 'src/pages/workspaces/workspace/analysis/file-utils'
import { cloudProviders } from 'src/pages/workspaces/workspace/analysis/runtime-utils'
import { getToolFromFileExtension, ToolLabel } from 'src/pages/workspaces/workspace/analysis/tool-utils'
import {
  CloudProviderType,
  cloudProviderTypes
} from 'src/pages/workspaces/workspace/workspace-utils'


jest.mock('src/components/workspace-utils', () => {
  const originalModule = jest.requireActual('src/components/workspace-utils')
  return {
    ...originalModule
  }
})

jest.mock('src/libs/ajax/GoogleStorage')
jest.mock('src/libs/ajax/AzureStorage')

//TODO: test commons
const getTestFile = (abs: AbsolutePath, cloudProvider: CloudProviderType = cloudProviderTypes[cloudProviders.gcp.label]): AnalysisFile => ({
  name: abs,
  ext: getExtension(abs),
  displayName: getDisplayName(abs),
  fileName: getFileName(abs),
  tool: getToolFromFileExtension(getExtension(abs)) as ToolLabel,
  lastModified: new Date().getTime(),
  cloudProvider
})

export const HookWrapperComponent = () => {
  useAnalysisFiles()
  return div()
}

describe('file-utils', () => {
  beforeEach(() => {
    workspaceStore.reset()
    const googleStorageMock: Partial<GoogleStorageContract> = ({
      listAnalyses: jest.fn(() => Promise.resolve([]))
    })
    asMockedFn(GoogleStorage).mockImplementation(() => googleStorageMock as GoogleStorageContract)

    const azureStorageMock: Partial<AzureStorageContract> = ({
      listNotebooks: jest.fn(() => Promise.resolve([]))
    })
    asMockedFn(AzureStorage).mockImplementation(() => azureStorageMock as AzureStorageContract)
  })

  it('loads files from the correct cloud provider storage with a google workspace', async () => {
    const fileList: AnalysisFile[] = [getTestFile('test/file1.ipynb' as AbsolutePath), getTestFile('test/file2.ipynb' as AbsolutePath)]

    const calledMock = jest.fn(() => Promise.resolve(fileList))
    const googleStorageMock: Partial<GoogleStorageContract> = ({
      listAnalyses: calledMock
    })
    asMockedFn(GoogleStorage).mockImplementation(() => googleStorageMock as GoogleStorageContract)

    const azureStorageMock: Partial<AzureStorageContract> = ({
      listNotebooks: () => Promise.resolve(fileList)
    })
    asMockedFn(AzureStorage).mockImplementation(() => azureStorageMock as AzureStorageContract)

    // Act
    await act(async () => {
      workspaceStore.set(defaultGoogleWorkspace)
      await render(h(HookWrapperComponent, {}))
    })

    // expect(analyses).toBe(fileList)
    expect(calledMock).toHaveBeenCalledWith(defaultGoogleWorkspace.workspace.googleProject, defaultGoogleWorkspace.workspace.bucketName)
  })

  it('loads files from the correct cloud provider storage with an azure workspace', async () => {
    const fileList = [getTestFile('test/file1.ipynb' as AbsolutePath), getTestFile('test/file2.ipynb' as AbsolutePath)]

    const calledMock = jest.fn(() => Promise.resolve(fileList))
    const googleStorageMock: Partial<GoogleStorageContract> = ({
      listAnalyses: () => Promise.resolve(fileList)
    })
    asMockedFn(GoogleStorage).mockImplementation(() => googleStorageMock as GoogleStorageContract)

    const azureStorageMock: Partial<AzureStorageContract> = ({
      listNotebooks: calledMock
    })
    asMockedFn(AzureStorage).mockImplementation(() => azureStorageMock as AzureStorageContract)

    // await/async needed to make linter happy
    await act(async () => {
      workspaceStore.set(defaultAzureWorkspace)
      await render(h(HookWrapperComponent, {}))
    })

    expect(calledMock).toHaveBeenCalledWith(defaultAzureWorkspace.workspace.workspaceId)
  })
})
