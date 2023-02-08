import { renderHook } from '@testing-library/react-hooks'
import { Ajax } from 'src/libs/ajax'
import { AzureWorkspaceInfo } from 'src/libs/workspace-utils'
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


// Cases
// it should initialize state for a google workspace
// it should initialize state for an azure workspace
// it should delete a workspace and invoke the appropriate hooks on success
// it should delete a workspace and report an error on failure

describe('useDeleteWorkspace', () => {
  it('can initialize state for an azure workspace', async () => {
    // Arrange
    const onDismiss = jest.fn(() => {})
    const onSuccess = jest.fn(() => {})
    const workspace = {
      accessLevel: 'writer',
      canShare: true,
      canCompute: true,
      workspace: {

      } as AzureWorkspaceInfo
    }
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
    const { result, waitForNextUpdate } = renderHook(() => useDeleteWorkspaceState(workspace, namespace, name, workspaceId, onDismiss, onSuccess))
    await waitForNextUpdate()

    // Assert
    expect(mockListAppsV2.listAppsV2).toBeCalledTimes(1)
    expect(result.current.hasApps()).toBe(false)
    expect(result.current.isDeleteDisabledFromResources).toBe(false)
  })
})
