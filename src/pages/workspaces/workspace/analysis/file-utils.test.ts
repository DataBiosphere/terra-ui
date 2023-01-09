import '@testing-library/jest-dom'

import { renderHook } from '@testing-library/react-hooks'
import { act } from 'react-dom/test-utils'
import { AzureStorage, AzureStorageContract } from 'src/libs/ajax/AzureStorage'
import { GoogleStorage, GoogleStorageContract } from 'src/libs/ajax/GoogleStorage'
import { workspaceStore } from 'src/libs/state'
import { ReadyState } from 'src/libs/type-utils/LoadedState'
import {
  CloudProviderType,
  cloudProviderTypes
} from 'src/libs/workspace-utils'
import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/pages/workspaces/workspace/analysis/_testData/testData'
import {
  AbsolutePath,
  AnalysisFile,
  getDisplayName,
  getExtension,
  getFileName,
  useAnalysisFiles
} from 'src/pages/workspaces/workspace/analysis/file-utils'
import { getToolFromFileExtension, ToolLabel, toolLabels } from 'src/pages/workspaces/workspace/analysis/tool-utils'
import { asMockedFn } from 'src/testing/test-utils'


jest.mock('src/libs/ajax/GoogleStorage')
jest.mock('src/libs/ajax/AzureStorage')
jest.mock('src/libs/error', () => ({
  ...jest.requireActual('src/libs/error'),
  reportError: jest.fn(),
}))

//TODO: test commons
const getTestFile = (abs: AbsolutePath, cloudProvider: CloudProviderType = cloudProviderTypes.GCP): AnalysisFile => ({
  name: abs,
  ext: getExtension(abs),
  displayName: getDisplayName(abs),
  fileName: getFileName(abs),
  tool: getToolFromFileExtension(getExtension(abs)) as ToolLabel,
  lastModified: new Date().getTime(),
  cloudProvider
})

describe('file-utils', () => {
  describe('useAnalysisFiles', () => {
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

    it('returns the correct files', async () => {
      // Arrange
      const fileList: AnalysisFile[] = [getTestFile('test/file1.ipynb' as AbsolutePath), getTestFile('test/file2.ipynb' as AbsolutePath)]

      const listAnalyses = jest.fn(() => Promise.resolve(fileList))
      const googleStorageMock: Partial<GoogleStorageContract> = ({
        listAnalyses
      })
      asMockedFn(GoogleStorage).mockImplementation(() => googleStorageMock as GoogleStorageContract)

      // Act
      workspaceStore.set(defaultGoogleWorkspace)
      const { result: hookReturnRef, waitForNextUpdate } = renderHook(() => useAnalysisFiles())
      await waitForNextUpdate()
      const state = hookReturnRef.current.loadedState

      // Assert
      const expectedState: ReadyState<AnalysisFile[]> = { status: 'Ready', state: fileList }
      expect(state).toEqual(expectedState)
    })

    it('loads files from the correct cloud provider storage with a google workspace', async () => {
      // Arrange
      const fileList: AnalysisFile[] = [getTestFile('test/file1.ipynb' as AbsolutePath), getTestFile('test/file2.ipynb' as AbsolutePath)]

      const listAnalyses = jest.fn(() => Promise.resolve(fileList))
      const googleStorageMock: Partial<GoogleStorageContract> = ({
        listAnalyses
      })
      asMockedFn(GoogleStorage).mockImplementation(() => googleStorageMock as GoogleStorageContract)

      // Act
      workspaceStore.set(defaultGoogleWorkspace)
      const { waitForNextUpdate } = renderHook(() => useAnalysisFiles())
      await waitForNextUpdate()

      // Assert
      expect(listAnalyses).toHaveBeenCalledWith(defaultGoogleWorkspace.workspace.googleProject, defaultGoogleWorkspace.workspace.bucketName)
    })

    it('loads files from the correct cloud provider storage with an azure workspace', async () => {
      // Arrange
      const fileList = [getTestFile('test/file1.ipynb' as AbsolutePath), getTestFile('test/file2.ipynb' as AbsolutePath)]

      const calledMock = jest.fn(() => Promise.resolve(fileList))
      const azureStorageMock: Partial<AzureStorageContract> = ({
        listNotebooks: calledMock
      })
      asMockedFn(AzureStorage).mockImplementation(() => azureStorageMock as AzureStorageContract)

      // Act
      workspaceStore.set(defaultAzureWorkspace)
      const { waitForNextUpdate } = renderHook(() => useAnalysisFiles())
      await waitForNextUpdate()

      // Assert
      expect(calledMock).toHaveBeenCalledWith(defaultAzureWorkspace.workspace.workspaceId)
    })

    it('creates a file with a GCP workspace', async () => {
      // Arrange
      const fileList: AnalysisFile[] = [getTestFile('test/file1.ipynb' as AbsolutePath), getTestFile('test/file2.ipynb' as AbsolutePath)]

      const listAnalyses = jest.fn(() => Promise.resolve(fileList))
      const create = jest.fn(() => Promise.resolve())
      const analysisMock: Partial<GoogleStorageContract['analysis']> = jest.fn(() => ({
        create
      }))
      const googleStorageMock: Partial<GoogleStorageContract> = ({
        listAnalyses,
        analysis: analysisMock as GoogleStorageContract['analysis']
      })
      asMockedFn(GoogleStorage).mockImplementation(() => googleStorageMock as GoogleStorageContract)

      workspaceStore.set(defaultGoogleWorkspace)
      const { result: hookReturnRef, waitForNextUpdate } = renderHook(() => useAnalysisFiles())
      await waitForNextUpdate()

      // Act
      act(async () => {
        await hookReturnRef.current.create('AnalysisFile', toolLabels.Jupyter, 'myContents')
      })

      // Assert
      expect(create).toHaveBeenCalledWith('myContents')
    })

    it('creates a file with an Azure workspace', async () => {
      // Arrange
      const fileList: AnalysisFile[] = [getTestFile('test/file1.ipynb' as AbsolutePath), getTestFile('test/file2.ipynb' as AbsolutePath)]

      const listNotebooks = jest.fn(() => Promise.resolve(fileList))
      const create = jest.fn(() => Promise.resolve())
      const blobMock: Partial<AzureStorageContract['blob']> = jest.fn(() => ({
        create
      }))
      const azureStorageMock: Partial<AzureStorageContract> = ({
        listNotebooks,
        blob: blobMock as AzureStorageContract['blob']
      })
      asMockedFn(AzureStorage).mockImplementation(() => azureStorageMock as AzureStorageContract)

      workspaceStore.set(defaultAzureWorkspace)
      const { result: hookReturnRef, waitForNextUpdate } = renderHook(() => useAnalysisFiles())
      await waitForNextUpdate()

      // Act
      act(async () => {
        await hookReturnRef.current.create('AnalysisFile', toolLabels.Jupyter, 'myContents')
      })

      // Assert
      expect(create).toHaveBeenCalledWith('myContents')
    })
  })
})
