import { act, renderHook } from '@testing-library/react-hooks'
import { Ajax } from 'src/libs/ajax'
import { reportError } from 'src/libs/error'
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

jest.mock('src/libs/error', () => ({
  ...jest.requireActual('src/libs/error'),
  reportError: jest.fn(),
}))

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
      name: 'example',
      namespace: 'example',
      cloudPlatform: 'Gcp'
    } as GoogleWorkspaceInfo
  }
  const azureWorkspace = {
    accessLevel: 'writer',
    canShare: true,
    canCompute: true,
    workspace: {
      name: 'example',
      namespace: 'example',
      cloudPlatform: 'azure'
    } as AzureWorkspaceInfo
  }
  const mockOnDismiss = jest.fn(() => {
  })
  const mockOnSuccess = jest.fn(() => {
  })

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {
    })
    jest.spyOn(console, 'log').mockImplementation(() => {
    })
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
    } = renderHook(() => useDeleteWorkspaceState(googleWorkspace, mockOnDismiss, mockOnSuccess))
    await waitForNextUpdate()

    // Assert
    expect(result.current.hasApps()).toBe(true)
    expect(result.current.isDeleteDisabledFromResources).toBe(false)
    expect(result.current.collaboratorEmails).toEqual(['example1@example.com'])
    expect(result.current.workspaceBucketUsageInBytes).toBe(1234)
  })

  it('can initialize state for an azure workspace', async () => {
    // Arrange
    const mockListAppsV2: Partial<AjaxAppsContract> = {
      listAppsV2: jest.fn()
    }
    asMockedFn((mockListAppsV2 as AjaxAppsContract).listAppsV2).mockResolvedValue([{
      appName: 'example',
      status: 'running'
    }])

    const mockWsmControlledResources: Partial<AjaxWorkspaceManagerContract> = {
      controlledResources: jest.fn()
    }
    asMockedFn((mockWsmControlledResources as AjaxWorkspaceManagerContract).controlledResources).mockResolvedValue({
      resources: [
        { metadata: { name: 'example' } },
        { metadata: { name: 'example' } }
      ]
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
    } = renderHook(() => useDeleteWorkspaceState(azureWorkspace, mockOnDismiss, mockOnSuccess))
    await waitForNextUpdate()

    // Assert
    expect(result.current.hasApps()).toBe(true)
    expect(result.current.isDeleteDisabledFromResources).toBe(true)
    expect(result.current.controlledResourcesExist).toBe(true)
  })

  it('can delete an azure workspace', async () => {
    // Arrange
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
    } = renderHook(() => useDeleteWorkspaceState(azureWorkspace, mockOnDismiss, mockOnSuccess))
    await waitForNextUpdate()
    await act(() => result.current.deleteWorkspace())

    // Assert
    expect(result.current.deleting).toBe(true)
    expect(mockOnDismiss).toHaveBeenCalledTimes(1)
    expect(mockOnSuccess).toHaveBeenCalledTimes(1)
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
    } = renderHook(() => useDeleteWorkspaceState(googleWorkspace, mockOnDismiss, mockOnSuccess))
    await waitForNextUpdate()
    await act(() => result.current.deleteWorkspace())

    // Assert
    expect(result.current.deleting).toBe(true)
  })

  it('can handle errors when deletion fails', async () => {
    // Arrange
    const mockDelete = () => Promise.reject(new Response('mock deletion error'))
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
    } = renderHook(() => useDeleteWorkspaceState(googleWorkspace, mockOnDismiss, mockOnSuccess))
    await waitForNextUpdate()
    await act(() => result.current.deleteWorkspace())

    // Assert
    expect(result.current.deleting).toBe(false)
    expect(reportError).toHaveBeenCalled()
  })
})
