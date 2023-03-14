import { Ajax } from 'src/libs/ajax'
import { AnalysisProvider } from 'src/libs/ajax/analysis-providers/AnalysisProvider'
import { WorkspaceInfo } from 'src/libs/workspace-utils'
import { runtimeToolLabels } from 'src/pages/workspaces/workspace/analysis/utils/tool-utils'
import { asMockedFn } from 'src/testing/test-utils'


type AjaxExports = typeof import('src/libs/ajax')
jest.mock('src/libs/ajax', (): AjaxExports => {
  return {
    ...jest.requireActual('src/libs/ajax'),
    Ajax: jest.fn()
  }
})

type AjaxContract = ReturnType<typeof Ajax>;
type AjaxBucketsContract = AjaxContract['Buckets']
type AjaxBucketsAnalysisContract = ReturnType<AjaxContract['Buckets']['analysis']>
type AjaxAzureStorageContract = AjaxContract['AzureStorage']
type AjaxAzureStorageBlobContract = ReturnType<AjaxAzureStorageContract['blob']>

describe('AnalysisProvider - listAnalyses', () => {
  it('handles GCP workspace', async () => {
    // Arrange
    const mockBuckets: Partial<AjaxBucketsContract> = {
      listAnalyses: jest.fn()
    }
    asMockedFn((mockBuckets as AjaxBucketsContract).listAnalyses).mockResolvedValue([])

    const mockAjax: Partial<AjaxContract> = {
      Buckets: mockBuckets as AjaxBucketsContract
    }
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract)

    const workspaceInfo: Partial<WorkspaceInfo> = {
      googleProject: 'GoogleProject123',
      bucketName: 'Bucket123',
      cloudPlatform: 'Gcp'
    }

    // Act
    const results = await AnalysisProvider.listAnalyses(workspaceInfo as WorkspaceInfo)

    // Assert
    expect(results).toEqual([])
    expect(mockBuckets.listAnalyses).toBeCalledTimes(1)
    expect(mockBuckets.listAnalyses).toBeCalledWith('GoogleProject123', 'Bucket123')
  })

  it('handles Azure workspace', async () => {
    // Arrange
    const mockAzureStorage: Partial<AjaxAzureStorageContract> = {
      listNotebooks: jest.fn()
    }
    asMockedFn((mockAzureStorage as AjaxAzureStorageContract).listNotebooks).mockResolvedValue([])

    const mockAjax: Partial<AjaxContract> = {
      AzureStorage: mockAzureStorage as AjaxAzureStorageContract
    }
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract)

    const workspaceInfo: Partial<WorkspaceInfo> = {
      workspaceId: 'Workspace123'
    }

    // Act
    const results = await AnalysisProvider.listAnalyses(workspaceInfo as WorkspaceInfo)

    // Assert
    expect(results).toEqual([])
    expect(mockAzureStorage.listNotebooks).toBeCalledTimes(1)
    expect(mockAzureStorage.listNotebooks).toBeCalledWith('Workspace123')
  })
})

describe('AnalysisProvider - copyAnalysis', () => {
  it('handles GCP workspace', async () => {
    // Arrange
    const mockBuckets: Partial<AjaxBucketsContract> = {
      analysis: jest.fn()
    }
    const watchCopy = jest.fn()
    asMockedFn((mockBuckets as AjaxBucketsContract).analysis).mockImplementation(() => {
      const mockAnalysisContract: Partial<AjaxBucketsAnalysisContract> = {
        copy: watchCopy
      }
      const analysisContract = mockAnalysisContract as AjaxBucketsAnalysisContract
      asMockedFn(analysisContract.copy).mockResolvedValue(undefined)
      return analysisContract
    })

    const mockAjax: Partial<AjaxContract> = {
      Buckets: mockBuckets as AjaxBucketsContract
    }
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract)

    const workspaceInfo: Partial<WorkspaceInfo> = {
      googleProject: 'GoogleProject123',
      bucketName: 'Bucket123',
      cloudPlatform: 'Gcp'
    }
    const targetWorkspace: Partial<WorkspaceInfo> = {
      bucketName: 'TargetBucket456'
    }

    // Act
    const result = await AnalysisProvider.copyAnalysis(
        workspaceInfo as WorkspaceInfo,
        'PrintName123.jpt',
        runtimeToolLabels.Jupyter,
        targetWorkspace as WorkspaceInfo,
        'NewName123'
    )

    // Assert
    expect(result).toEqual(undefined)
    expect(mockBuckets.analysis).toBeCalledTimes(1)
    expect(mockBuckets.analysis).toBeCalledWith('GoogleProject123', 'Bucket123', 'PrintName123.jpt', runtimeToolLabels.Jupyter)
    expect(watchCopy).toBeCalledTimes(1)
    expect(watchCopy).toBeCalledWith('NewName123.jpt', 'TargetBucket456', false)
  })

  it('handles Azure workspace', async () => {
    // Arrange
    const mockAzureStorage: Partial<AjaxAzureStorageContract> = {
      blob: jest.fn()
    }
    const watchCopy = jest.fn()
    asMockedFn((mockAzureStorage as AjaxAzureStorageContract).blob).mockImplementation(() => {
      const mockBlobContract: Partial<AjaxAzureStorageBlobContract> = {
        copy: watchCopy
      }
      const blobContract = mockBlobContract as AjaxAzureStorageBlobContract
      asMockedFn(blobContract.copy).mockResolvedValue(undefined)
      return blobContract
    })

    const mockAjax: Partial<AjaxContract> = {
      AzureStorage: mockAzureStorage as AjaxAzureStorageContract
    }
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract)

    const workspaceInfo: Partial<WorkspaceInfo> = {
      workspaceId: 'Workspace123',
      bucketName: 'Bucket123'
    }
    const targetWorkspace: Partial<WorkspaceInfo> = {
      workspaceId: 'Workspace456'
    }

    // Act
    const result = await AnalysisProvider.copyAnalysis(
        workspaceInfo as WorkspaceInfo,
        'PrintName123.jpt',
        runtimeToolLabels.Jupyter,
        targetWorkspace as WorkspaceInfo,
        'NewName123'
    )

    // Assert
    expect(result).toEqual(undefined)
    expect(mockAzureStorage.blob).toBeCalledTimes(1)
    expect(mockAzureStorage.blob).toBeCalledWith('Workspace123', 'PrintName123.jpt')
    expect(watchCopy).toBeCalledTimes(1)
    expect(watchCopy).toBeCalledWith('NewName123', 'Workspace456')
  })
})
