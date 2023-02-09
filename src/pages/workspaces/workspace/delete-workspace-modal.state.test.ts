import { act, renderHook } from '@testing-library/react-hooks'
import { Ajax } from 'src/libs/ajax'
import { DeepPartial } from 'src/libs/type-utils/deep-partial'
import { AzureWorkspaceInfo, GoogleWorkspaceInfo } from 'src/libs/workspace-utils'
import { useDeleteWorkspaceState } from 'src/pages/workspaces/workspace/delete-workspace-modal.state'
import { asMockedFn } from 'src/testing/test-utils'


type AjaxExports = typeof import('src/libs/ajax')
jest.mock('src/libs/ajax', (): AjaxExports => {
  return {
    ...jest.requireActual('src/libs/ajax'),
    Ajax: jest.fn()
  }
})

type AjaxContract = ReturnType<typeof Ajax>;
type AjaxAppsContract = AjaxContract['Apps']
type AjaxWorkspaceManagerContract = AjaxContract['WorkspaceManagerResources']
type AjaxWorkspacesContract = AjaxContract['Workspaces']

describe('useDeleteWorkspace', () => {
  const googleWorkspace = {
    accessLevel: 'writer',
    canShare: true,
    canCompute: true,
    workspace: {
      cloudPlatform: 'Gcp'
    } as GoogleWorkspaceInfo
  }
  const azureWorkspace = {
    accessLevel: 'writer',
    canShare: true,
    canCompute: true,
    workspace: {} as AzureWorkspaceInfo
  }
  const mockOnDismiss = jest.fn(() => {
  })
  const mockOnSuccess = jest.fn(() => {
  })

  it('can initialize state for a google workspace', async () => {
    // Arrange
    const name = 'example_workspace_name'
    const namespace = 'example_namespace'
    const workspaceId = 'example_workspace_id'
    const mockApps: Partial<AjaxAppsContract> = {
      listWithoutProject: jest.fn()
    }
    asMockedFn((mockApps as AjaxAppsContract).listWithoutProject).mockResolvedValue([])

    const mockGetAcl = jest.fn().mockResolvedValue([])
    const mockGetBucketUsage = jest.fn().mockResolvedValue([])
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
    } = renderHook(() => useDeleteWorkspaceState(googleWorkspace, namespace, name, workspaceId, mockOnDismiss, mockOnSuccess))
    await waitForNextUpdate()

    // Assert
    expect(result.current.hasApps()).toBe(false)
    expect(result.current.isDeleteDisabledFromResources).toBe(false)
    expect(mockApps.listWithoutProject).toBeCalledTimes(1)
    expect(mockGetAcl).toBeCalledTimes(1)
    expect(mockGetBucketUsage).toBeCalledTimes(1)
  })

  it('can initialize state for an azure workspace', async () => {
    // Arrange
    const name = 'example_workspace_name'
    const namespace = 'example_namespace'
    const workspaceId = 'example_workspace_id'

    const mockListAppsV2: Partial<AjaxAppsContract> = {
      listAppsV2: jest.fn()
    }
    asMockedFn((mockListAppsV2 as AjaxAppsContract).listAppsV2).mockResolvedValue([])

    const mockWsmControlledResources: Partial<AjaxWorkspaceManagerContract> = {
      controlledResources: jest.fn()
    }
    asMockedFn((mockWsmControlledResources as AjaxWorkspaceManagerContract).controlledResources).mockResolvedValue({
      resources: []
    })

    const mockAjax: Partial<AjaxContract> = {
      Apps: mockListAppsV2 as AjaxAppsContract,
      WorkspaceManagerResources: mockWsmControlledResources as AjaxWorkspaceManagerContract
    }
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract)

    // Act
    const {
      result,
      waitForNextUpdate
    } = renderHook(() => useDeleteWorkspaceState(azureWorkspace, namespace, name, workspaceId, mockOnDismiss, mockOnSuccess))
    await waitForNextUpdate()

    // Assert
    expect(mockListAppsV2.listAppsV2).toBeCalledTimes(1)
    expect(result.current.hasApps()).toBe(false)
    expect(result.current.isDeleteDisabledFromResources).toBe(false)
  })

  it('can delete an azure workspace', async () => {
    // Arrange
    const name = 'example_workspace_name'
    const namespace = 'example_namespace'
    const workspaceId = 'example_workspace_id'

    const mockDelete = jest.fn().mockResolvedValue([])
    const mockWorkspaces: DeepPartial<AjaxWorkspacesContract> = {
      workspace: () => ({
        delete: mockDelete
      })
    }
    const mockListAppsV2: Partial<AjaxAppsContract> = {
      listAppsV2: jest.fn()
    }
    asMockedFn((mockListAppsV2 as AjaxAppsContract).listAppsV2).mockResolvedValue([])

    const mockWsmControlledResources: Partial<AjaxWorkspaceManagerContract> = {
      controlledResources: jest.fn()
    }
    asMockedFn((mockWsmControlledResources as AjaxWorkspaceManagerContract).controlledResources).mockResolvedValue({
      resources: []
    })
    const mockAjax: Partial<AjaxContract> = {
      Workspaces: mockWorkspaces as AjaxWorkspacesContract,
      Apps: mockListAppsV2 as AjaxAppsContract,
      WorkspaceManagerResources: mockWsmControlledResources as AjaxWorkspaceManagerContract
    }
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract)

    // Act
    const {
      result,
      waitForNextUpdate
    } = renderHook(() => useDeleteWorkspaceState(azureWorkspace, namespace, name, workspaceId, mockOnDismiss, mockOnSuccess))
    await waitForNextUpdate()
    await act(() => result.current.deleteWorkspace())

    // Assert
    expect(result.current.deleting).toBe(true)
    expect(mockOnDismiss).toHaveBeenCalledTimes(1)
    expect(mockOnSuccess).toHaveBeenCalledTimes(1)
  })
})
