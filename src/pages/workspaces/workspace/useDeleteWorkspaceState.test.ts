import { act, renderHook } from '@testing-library/react-hooks'
import { Ajax } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
import { DeepPartial } from 'src/libs/type-utils/deep-partial'
import { AzureWorkspaceInfo, BaseWorkspace, GoogleWorkspaceInfo } from 'src/libs/workspace-utils'
import {
  useDeleteWorkspaceState,
  WorkspaceResourceDeletionPollRate
} from 'src/pages/workspaces/workspace/useDeleteWorkspaceState'
import { asMockedFn } from 'src/testing/test-utils'


type AjaxExports = typeof import('src/libs/ajax')
jest.mock('src/libs/ajax', (): AjaxExports => {
  return {
    ...jest.requireActual('src/libs/ajax'),
    Ajax: jest.fn()
  }
})

type ErrorExports = typeof import('src/libs/error')
jest.mock('src/libs/error', (): ErrorExports => ({
  ...jest.requireActual('src/libs/error'),
  reportError: jest.fn(),
}))

type AjaxContract = ReturnType<typeof Ajax>;
type AjaxAppsContract = AjaxContract['Apps']
type AjaxRuntimesContract = AjaxContract['Runtimes']
type AjaxWorkspacesContract = AjaxContract['Workspaces']

describe('useDeleteWorkspace', () => {
  const googleWorkspace = {
    accessLevel: 'writer',
    canShare: true,
    canCompute: true,
    workspace: {
      name: 'example',
      namespace: 'example',
      cloudPlatform: 'Gcp',
      workspaceId: 'googleWorkspaceId'
    } as GoogleWorkspaceInfo
  } as BaseWorkspace
  const azureWorkspace = {
    accessLevel: 'writer',
    canShare: true,
    canCompute: true,
    workspace: {
      name: 'example',
      namespace: 'example',
      cloudPlatform: 'Azure',
      workspaceId: 'azureWorkspaceId'
    } as AzureWorkspaceInfo
  } as BaseWorkspace
  const mockOnDismiss = jest.fn(() => {
  })
  const mockOnSuccess = jest.fn(() => {
  })

  beforeEach(() => {
    jest.useFakeTimers()
  })

  it('can initialize state for a google workspace with running apps', async () => {
    // Arrange
    const mockApps: Partial<AjaxAppsContract> = {
      listWithoutProject: jest.fn()
    }
    asMockedFn((mockApps as AjaxAppsContract).listWithoutProject).mockResolvedValue([{
      appName: 'app1',
      status: 'running'
    }])

    const mockGetAcl = jest.fn().mockResolvedValue({ acl: { 'example1@example.com': {} } })
    const mockGetBucketUsage = jest.fn().mockResolvedValue({ usageInBytes: 1234 })
    const mockWorkspaces: DeepPartial<AjaxWorkspacesContract> = {
      workspace: () => ({
        getAcl: mockGetAcl,
        bucketUsage: mockGetBucketUsage
      })
    }

    const mockAjax: Partial<AjaxContract> = {
      Apps: mockApps as AjaxAppsContract,
      Workspaces: mockWorkspaces as AjaxWorkspacesContract
    }
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract)

    // Act
    const {
      result,
      waitForNextUpdate
    } = renderHook(() => useDeleteWorkspaceState({ workspace: googleWorkspace, onDismiss: mockOnDismiss, onSuccess: mockOnSuccess }))
    await waitForNextUpdate()

    // Assert
    expect(result.current.hasApps()).toBe(true)
    expect(result.current.isDeleteDisabledFromResources).toBe(false)
    expect(result.current.collaboratorEmails).toEqual(['example1@example.com'])
    expect(result.current.workspaceBucketUsageInBytes).toBe(1234)
    expect(mockApps.listWithoutProject).toHaveBeenCalledTimes(1)
    expect(mockApps.listWithoutProject).toHaveBeenCalledWith({ role: 'creator', saturnWorkspaceName: googleWorkspace.workspace.name })
    expect(mockGetAcl).toHaveBeenCalledTimes(1)
    expect(mockGetBucketUsage).toHaveBeenCalledTimes(1)
  })

  it('can initialize state for an azure workspace', async () => {
    // Arrange
    const mockListAppsV2: Partial<AjaxAppsContract> = {
      listAppsV2: jest.fn()
    }
    asMockedFn((mockListAppsV2 as AjaxAppsContract).listAppsV2).mockResolvedValue([{
      appName: 'example',
      status: 'provisioning'
    }])
    const mockListRuntimesV2: Partial<AjaxRuntimesContract> = {
      listV2WithWorkspace: jest.fn()
    }
    asMockedFn((mockListRuntimesV2 as AjaxRuntimesContract).listV2WithWorkspace).mockResolvedValue([])

    const mockGetAcl = jest.fn().mockResolvedValue({ acl: { 'example1@example.com': {} } })
    const mockWorkspaces: DeepPartial<AjaxWorkspacesContract> = {
      workspace: () => ({
        getAcl: mockGetAcl
      })
    }
    const mockAjax: Partial<AjaxContract> = {
      Apps: mockListAppsV2 as AjaxAppsContract,
      Runtimes: mockListRuntimesV2 as AjaxRuntimesContract,
      Workspaces: mockWorkspaces as AjaxWorkspacesContract
    }
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract)

    // Act
    const {
      result,
      waitForNextUpdate
    } = renderHook(() => useDeleteWorkspaceState({ workspace: azureWorkspace, onDismiss: mockOnDismiss, onSuccess: mockOnSuccess }))
    await waitForNextUpdate()

    // Assert
    expect(result.current.hasApps()).toBe(true)
    expect(result.current.hasRuntimes()).toBe(false)
    expect(result.current.isDeleteDisabledFromResources).toBe(true)
    expect(mockListAppsV2.listAppsV2).toHaveBeenCalledTimes(1)
    expect(mockListAppsV2.listAppsV2).toHaveBeenCalledWith(azureWorkspace.workspace.workspaceId)
  })

  it('can delete an azure workspace', async () => {
    // Arrange
    const mockDelete = jest.fn().mockResolvedValue([])
    const mockGetAcl = jest.fn().mockResolvedValue({ acl: { 'example1@example.com': {} } })
    const mockWorkspaces: DeepPartial<AjaxWorkspacesContract> = {
      workspace: () => ({
        delete: mockDelete,
        getAcl: mockGetAcl
      })
    }
    const mockListAppsV2: Partial<AjaxAppsContract> = {
      listAppsV2: jest.fn()
    }
    asMockedFn((mockListAppsV2 as AjaxAppsContract).listAppsV2).mockResolvedValue([])

    const mockListRuntimesV2: Partial<AjaxRuntimesContract> = {
      listV2WithWorkspace: jest.fn()
    }
    asMockedFn((mockListRuntimesV2 as AjaxRuntimesContract).listV2WithWorkspace).mockResolvedValue([])

    const mockAjax: Partial<AjaxContract> = {
      Workspaces: mockWorkspaces as AjaxWorkspacesContract,
      Apps: mockListAppsV2 as AjaxAppsContract,
      Runtimes: mockListRuntimesV2 as AjaxRuntimesContract
    }
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract)

    // Act
    const {
      result,
      waitForNextUpdate
    } = renderHook(() => useDeleteWorkspaceState({ workspace: azureWorkspace, onDismiss: mockOnDismiss, onSuccess: mockOnSuccess }))
    await waitForNextUpdate()
    await act(() => result.current.deleteWorkspace())

    // Assert
    expect(result.current.deleting).toBe(true)
    expect(mockOnDismiss).toHaveBeenCalledTimes(1)
    expect(mockOnSuccess).toHaveBeenCalledTimes(1)
    expect(mockDelete).toHaveBeenCalledTimes(1)
  })

  it('can delete a google workspace', async () => {
    // Arrange
    const mockDelete = jest.fn().mockResolvedValue([])
    const mockApps: Partial<AjaxAppsContract> = {
      listWithoutProject: jest.fn()
    }
    asMockedFn((mockApps as AjaxAppsContract).listWithoutProject).mockResolvedValue([])

    const mockGetAcl = jest.fn().mockResolvedValue([])
    const mockGetBucketUsage = jest.fn().mockResolvedValue([])
    const mockWorkspaces: DeepPartial<AjaxWorkspacesContract> = {
      workspace: () => ({
        getAcl: mockGetAcl,
        bucketUsage: mockGetBucketUsage,
        delete: mockDelete
      })
    }

    const mockAjax: Partial<AjaxContract> = {
      Apps: mockApps as AjaxAppsContract,
      Workspaces: mockWorkspaces as AjaxWorkspacesContract
    }
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract)

    // Act
    const {
      result,
      waitForNextUpdate
    } = renderHook(() => useDeleteWorkspaceState({ workspace: googleWorkspace, onDismiss: mockOnDismiss, onSuccess: mockOnSuccess }))
    await waitForNextUpdate()
    await act(() => result.current.deleteWorkspace())

    // Assert
    expect(result.current.deleting).toBe(true)
    expect(mockDelete).toHaveBeenCalledTimes(1)
  })

  it('can handle errors when deletion fails', async () => {
    // Arrange
    const mockApps: Partial<AjaxAppsContract> = {
      listWithoutProject: jest.fn()
    }
    asMockedFn((mockApps as AjaxAppsContract).listWithoutProject).mockResolvedValue([])

    const mockGetAcl = jest.fn().mockResolvedValue([])
    const mockGetBucketUsage = jest.fn().mockResolvedValue([])
    const mockDelete = jest.fn().mockRejectedValue(new Error('testing'))
    const mockWorkspaces: DeepPartial<AjaxWorkspacesContract> = {
      workspace: () => ({
        getAcl: mockGetAcl,
        bucketUsage: mockGetBucketUsage,
        delete: mockDelete
      })
    }

    const mockAjax: Partial<AjaxContract> = {
      Apps: mockApps as AjaxAppsContract,
      Workspaces: mockWorkspaces as AjaxWorkspacesContract
    }
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract)

    // Act
    const {
      result,
      waitForNextUpdate
    } = renderHook(() => useDeleteWorkspaceState({ workspace: googleWorkspace, onDismiss: mockOnDismiss, onSuccess: mockOnSuccess }))
    await waitForNextUpdate()

    await act(() => result.current.deleteWorkspace())

    // Assert
    expect(result.current.deleting).toBe(false)
    expect(mockDelete).toHaveBeenCalledTimes(1)
    expect(reportError).toHaveBeenCalledTimes(1)
  })


  it('should not allow deletion of undeletable azure apps', async () => {
    // Arrange
    const mockDelete = jest.fn().mockResolvedValue([])
    const mockGetAcl = jest.fn().mockResolvedValue({ acl: { 'example1@example.com': {} } })
    const mockWorkspaces: DeepPartial<AjaxWorkspacesContract> = {
      workspace: () => ({
        delete: mockDelete,
        getAcl: mockGetAcl
      })
    }
    const mockListAppsV2: Partial<AjaxAppsContract> = {
      listAppsV2: jest.fn(),
      deleteAllAppsV2: jest.fn()
    }
    asMockedFn((mockListAppsV2 as AjaxAppsContract).listAppsV2).mockResolvedValue([
      {
        appName: 'app1',
        status: 'provisioning'
      }
    ])
    const mockListRuntimesV2: Partial<AjaxRuntimesContract> = {
      listV2WithWorkspace: jest.fn()
    }
    asMockedFn((mockListRuntimesV2 as AjaxRuntimesContract).listV2WithWorkspace).mockResolvedValue([])

    const mockAjax: Partial<AjaxContract> = {
      Workspaces: mockWorkspaces as AjaxWorkspacesContract,
      Apps: mockListAppsV2 as AjaxAppsContract,
      Runtimes: mockListRuntimesV2 as AjaxRuntimesContract,
    }
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract)

    // Act
    const {
      result,
      waitForNextUpdate
    } = renderHook(() => useDeleteWorkspaceState({ workspace: azureWorkspace, onDismiss: mockOnDismiss, onSuccess: mockOnSuccess }))
    await waitForNextUpdate()

    await act(() => result.current.deleteWorkspaceResources())

    // Assert
    expect(result.current.deleting).toBe(false)
    expect(result.current.deletingResources).toBe(false)
    expect(mockListAppsV2.deleteAllAppsV2).toHaveBeenCalledTimes(0)
    expect(mockDelete).toHaveBeenCalledTimes(0)
  })

  it('polls after dispatching a call to delete workspace resources', async () => {
    // Arrange
    const mockDelete = jest.fn().mockResolvedValue([])
    const mockGetAcl = jest.fn().mockResolvedValue({ acl: { 'example1@example.com': {} } })
    const mockWorkspaces: DeepPartial<AjaxWorkspacesContract> = {
      workspace: () => ({
        delete: mockDelete,
        getAcl: mockGetAcl
      })
    }

    const mockListAppsFn = jest.fn()
    const mockDeleteAllApps = jest.fn()
    const mockListAppsV2: Partial<AjaxAppsContract> = {
      listAppsV2: mockListAppsFn,
      deleteAllAppsV2: mockDeleteAllApps
    }
    mockListAppsFn.mockResolvedValueOnce([
      {
        appName: 'app1',
        status: 'running'
      }
    ]).mockResolvedValueOnce([])

    const mockDeleteAllRuntimes = jest.fn()
    const mockRuntimesV2: DeepPartial<AjaxRuntimesContract> = {
      listV2WithWorkspace: jest.fn(),
      runtimeV2: () => ({
        deleteAll: mockDeleteAllRuntimes
      })
    }
    asMockedFn((mockRuntimesV2 as AjaxRuntimesContract).listV2WithWorkspace).mockResolvedValue([])

    const mockAjax: Partial<AjaxContract> = {
      Workspaces: mockWorkspaces as AjaxWorkspacesContract,
      Apps: mockListAppsV2 as AjaxAppsContract,
      Runtimes: mockRuntimesV2 as AjaxRuntimesContract,
    }
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract)

    // Act
    const {
      result,
      waitForNextUpdate
    } = renderHook(() => useDeleteWorkspaceState({ workspace: azureWorkspace, onDismiss: mockOnDismiss, onSuccess: mockOnSuccess }))
    await waitForNextUpdate()
    await act(() => result.current.deleteWorkspaceResources())

    // Assert
    expect(result.current.deleting).toBe(false)
    expect(result.current.deletingResources).toBe(true)
    expect(mockDelete).toHaveBeenCalledTimes(0)
    expect(mockDeleteAllRuntimes).toHaveBeenCalledTimes(1)
    expect(mockDeleteAllRuntimes).toHaveBeenCalledWith(true)
    expect(mockDeleteAllApps).toHaveBeenCalledTimes(1)
    expect(mockDeleteAllApps).toHaveBeenCalledWith(azureWorkspace.workspace.workspaceId, true)

    // Act
    jest.advanceTimersByTime(WorkspaceResourceDeletionPollRate)
    await waitForNextUpdate()

    expect(result.current.deletingResources).toBe(false)
    expect(result.current.hasApps()).toBe(false)
  })

  it('should report an error when initial call to delete resources fails', async () => {
    // Arrange
    const mockDelete = jest.fn().mockResolvedValue([])
    const mockGetAcl = jest.fn().mockResolvedValue({ acl: { 'example1@example.com': {} } })
    const mockWorkspaces: DeepPartial<AjaxWorkspacesContract> = {
      workspace: () => ({
        delete: mockDelete,
        getAcl: mockGetAcl
      })
    }

    const mockListAppsFn = jest.fn()
    const mockListAppsV2: Partial<AjaxAppsContract> = {
      listAppsV2: mockListAppsFn,
      deleteAllAppsV2: jest.fn()
    }
    mockListAppsFn.mockResolvedValueOnce([
      {
        appName: 'app1',
        status: 'running'
      }
    ]).mockResolvedValueOnce([])
    const mockRuntimeDeleteAll = jest.fn().mockRejectedValue('failed')
    const mockRuntimesV2: DeepPartial<AjaxRuntimesContract> = {
      listV2WithWorkspace: jest.fn(),
      runtimeV2: () => ({
        deleteAll: mockRuntimeDeleteAll
      })
    }
    asMockedFn((mockRuntimesV2 as AjaxRuntimesContract).listV2WithWorkspace).mockResolvedValue([])

    const mockAjax: Partial<AjaxContract> = {
      Workspaces: mockWorkspaces as AjaxWorkspacesContract,
      Apps: mockListAppsV2 as AjaxAppsContract,
      Runtimes: mockRuntimesV2 as AjaxRuntimesContract,
    }
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract)

    // Act
    const {
      result,
      waitForNextUpdate
    } = renderHook(() => useDeleteWorkspaceState({
      workspace: azureWorkspace,
      onDismiss: mockOnDismiss,
      onSuccess: mockOnSuccess
    }))
    await waitForNextUpdate()
    await act(() => result.current.deleteWorkspaceResources())

    expect(mockRuntimeDeleteAll).toHaveBeenCalledTimes(1)
    expect(reportError).toHaveBeenCalledTimes(1)
  })


  it('should handle errors during resource deletion polling', async () => {
    // Arrange
    const mockDelete = jest.fn().mockResolvedValue([])
    const mockGetAcl = jest.fn().mockResolvedValue({ acl: { 'example1@example.com': {} } })
    const mockWorkspaces: DeepPartial<AjaxWorkspacesContract> = {
      workspace: () => ({
        delete: mockDelete,
        getAcl: mockGetAcl
      })
    }
    const mockListAppsFn = jest.fn()
    const mockListAppsV2: Partial<AjaxAppsContract> = {
      listAppsV2: mockListAppsFn,
      deleteAllAppsV2: jest.fn()
    }
    mockListAppsFn.mockResolvedValueOnce([
      {
        appName: 'app1',
        status: 'running'
      }
    ]).mockRejectedValue('error')
    const mockRuntimesV2: DeepPartial<AjaxRuntimesContract> = {
      listV2WithWorkspace: jest.fn(),
      runtimeV2: () => ({
        deleteAll: jest.fn
      })
    }
    asMockedFn((mockRuntimesV2 as AjaxRuntimesContract).listV2WithWorkspace).mockResolvedValue([])

    const mockAjax: Partial<AjaxContract> = {
      Workspaces: mockWorkspaces as AjaxWorkspacesContract,
      Apps: mockListAppsV2 as AjaxAppsContract,
      Runtimes: mockRuntimesV2 as AjaxRuntimesContract,
    }
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract)

    // Act
    const {
      result,
      waitForNextUpdate
    } = renderHook(() => useDeleteWorkspaceState({ workspace: azureWorkspace, onDismiss: mockOnDismiss, onSuccess: mockOnSuccess }))
    await waitForNextUpdate()
    await act(() => result.current.deleteWorkspaceResources())

    // Assert
    expect(result.current.deleting).toBe(false)
    expect(result.current.deletingResources).toBe(true)
    expect(mockDelete).toHaveBeenCalledTimes(0)

    // Act
    jest.advanceTimersByTime(WorkspaceResourceDeletionPollRate)
    await waitForNextUpdate()

    expect(result.current.deletingResources).toBe(false)
    expect(reportError).toHaveBeenCalledTimes(1)
  })
})
