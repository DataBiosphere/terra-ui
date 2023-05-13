import { act, renderHook } from '@testing-library/react-hooks';
import { Ajax } from 'src/libs/ajax';
import { reportError } from 'src/libs/error';
import { DeepPartial } from 'src/libs/type-utils/deep-partial';
import { AzureWorkspaceInfo, BaseWorkspace, GoogleWorkspaceInfo } from 'src/libs/workspace-utils';
import { generateTestApp } from 'src/pages/workspaces/workspace/analysis/_testData/testData';
import {
  useDeleteWorkspaceState,
  WorkspaceResourceDeletionPollRate,
} from 'src/pages/workspaces/workspace/useDeleteWorkspaceState';
import { asMockedFn } from 'src/testing/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type AjaxExports = typeof import('src/libs/ajax');
vi.mock('src/libs/ajax', async (): Promise<AjaxExports> => {
  return {
    ...(await vi.importActual('src/libs/ajax')),
    Ajax: vi.fn(),
  };
});

type ErrorExports = typeof import('src/libs/error');
vi.mock(
  'src/libs/error',
  async (): Promise<ErrorExports> => ({
    ...(await vi.importActual('src/libs/error')),
    reportError: vi.fn(),
  })
);

type AjaxContract = ReturnType<typeof Ajax>;
type AjaxAppsContract = AjaxContract['Apps'];
type AjaxRuntimesContract = AjaxContract['Runtimes'];
type AjaxWorkspacesContract = AjaxContract['Workspaces'];

describe('useDeleteWorkspace', () => {
  const googleWorkspace = {
    accessLevel: 'writer',
    canShare: true,
    canCompute: true,
    workspace: {
      name: 'example',
      namespace: 'example',
      cloudPlatform: 'Gcp',
      workspaceId: 'googleWorkspaceId',
    } as GoogleWorkspaceInfo,
  } as BaseWorkspace;
  const azureWorkspace = {
    accessLevel: 'writer',
    canShare: true,
    canCompute: true,
    workspace: {
      name: 'example',
      namespace: 'example',
      cloudPlatform: 'Azure',
      workspaceId: 'azureWorkspaceId',
    } as AzureWorkspaceInfo,
  } as BaseWorkspace;
  const mockOnDismiss = vi.fn(() => {});
  const mockOnSuccess = vi.fn(() => {});

  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('can initialize state for a google workspace with running apps', async () => {
    // Arrange
    const mockApps: Partial<AjaxAppsContract> = {
      listWithoutProject: vi.fn(),
    };
    asMockedFn((mockApps as AjaxAppsContract).listWithoutProject).mockResolvedValue([
      generateTestApp({
        appName: 'app1',
        status: 'RUNNING',
      }),
    ]);

    const mockGetAcl = vi.fn().mockResolvedValue({ acl: { 'example1@example.com': {} } });
    const mockGetBucketUsage = vi.fn().mockResolvedValue({ usageInBytes: 1234 });
    const mockWorkspaces: DeepPartial<AjaxWorkspacesContract> = {
      workspace: () => ({
        getAcl: mockGetAcl,
        bucketUsage: mockGetBucketUsage,
      }),
    };

    const mockAjax: Partial<AjaxContract> = {
      Apps: mockApps as AjaxAppsContract,
      Workspaces: mockWorkspaces as AjaxWorkspacesContract,
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    // Act
    const { result, waitForNextUpdate } = renderHook(() =>
      useDeleteWorkspaceState({ workspace: googleWorkspace, onDismiss: mockOnDismiss, onSuccess: mockOnSuccess })
    );
    await waitForNextUpdate();

    // Assert
    expect(result.current.hasApps()).toBe(true);
    expect(result.current.isDeleteDisabledFromResources).toBe(false);
    expect(result.current.collaboratorEmails).toEqual(['example1@example.com']);
    expect(result.current.workspaceBucketUsageInBytes).toBe(1234);
    expect(mockApps.listWithoutProject).toHaveBeenCalledTimes(1);
    expect(mockApps.listWithoutProject).toHaveBeenCalledWith({
      role: 'creator',
      saturnWorkspaceName: googleWorkspace.workspace.name,
    });
    expect(mockGetAcl).toHaveBeenCalledTimes(1);
    expect(mockGetBucketUsage).toHaveBeenCalledTimes(1);
  });

  it('can initialize state for an azure workspace', async () => {
    // Arrange
    const mockListAppsV2: Partial<AjaxAppsContract> = {
      listAppsV2: vi.fn(),
    };
    asMockedFn((mockListAppsV2 as AjaxAppsContract).listAppsV2).mockResolvedValue([
      generateTestApp({
        appName: 'example',
        status: 'PROVISIONING',
      }),
    ]);
    const mockListRuntimesV2: Partial<AjaxRuntimesContract> = {
      listV2WithWorkspace: vi.fn(),
    };
    asMockedFn((mockListRuntimesV2 as AjaxRuntimesContract).listV2WithWorkspace).mockResolvedValue([]);

    const mockGetAcl = vi.fn().mockResolvedValue({ acl: { 'example1@example.com': {} } });
    const mockWorkspaces: DeepPartial<AjaxWorkspacesContract> = {
      workspace: () => ({
        getAcl: mockGetAcl,
      }),
    };
    const mockAjax: Partial<AjaxContract> = {
      Apps: mockListAppsV2 as AjaxAppsContract,
      Runtimes: mockListRuntimesV2 as AjaxRuntimesContract,
      Workspaces: mockWorkspaces as AjaxWorkspacesContract,
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    // Act
    const { result, waitForNextUpdate } = renderHook(() =>
      useDeleteWorkspaceState({ workspace: azureWorkspace, onDismiss: mockOnDismiss, onSuccess: mockOnSuccess })
    );
    await waitForNextUpdate();

    // Assert
    expect(result.current.hasApps()).toBe(true);
    expect(result.current.hasRuntimes()).toBe(false);
    expect(result.current.isDeleteDisabledFromResources).toBe(true);
    expect(mockListAppsV2.listAppsV2).toHaveBeenCalledTimes(1);
    expect(mockListAppsV2.listAppsV2).toHaveBeenCalledWith(azureWorkspace.workspace.workspaceId);
  });

  it('can delete an azure workspace', async () => {
    // Arrange
    const mockDelete = vi.fn().mockResolvedValue([]);
    const mockGetAcl = vi.fn().mockResolvedValue({ acl: { 'example1@example.com': {} } });
    const mockWorkspaces: DeepPartial<AjaxWorkspacesContract> = {
      workspace: () => ({
        delete: mockDelete,
        getAcl: mockGetAcl,
      }),
    };
    const mockListAppsV2: Partial<AjaxAppsContract> = {
      listAppsV2: vi.fn(),
    };
    asMockedFn((mockListAppsV2 as AjaxAppsContract).listAppsV2).mockResolvedValue([]);

    const mockListRuntimesV2: Partial<AjaxRuntimesContract> = {
      listV2WithWorkspace: vi.fn(),
    };
    asMockedFn((mockListRuntimesV2 as AjaxRuntimesContract).listV2WithWorkspace).mockResolvedValue([]);

    const mockAjax: Partial<AjaxContract> = {
      Workspaces: mockWorkspaces as AjaxWorkspacesContract,
      Apps: mockListAppsV2 as AjaxAppsContract,
      Runtimes: mockListRuntimesV2 as AjaxRuntimesContract,
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    // Act
    const { result, waitForNextUpdate } = renderHook(() =>
      useDeleteWorkspaceState({ workspace: azureWorkspace, onDismiss: mockOnDismiss, onSuccess: mockOnSuccess })
    );
    await waitForNextUpdate();
    await act(() => result.current.deleteWorkspace());

    // Assert
    expect(result.current.deleting).toBe(true);
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it('can delete a google workspace', async () => {
    // Arrange
    const mockDelete = vi.fn().mockResolvedValue([]);
    const mockApps: Partial<AjaxAppsContract> = {
      listWithoutProject: vi.fn(),
    };
    asMockedFn((mockApps as AjaxAppsContract).listWithoutProject).mockResolvedValue([]);

    const mockGetAcl = vi.fn().mockResolvedValue([]);
    const mockGetBucketUsage = vi.fn().mockResolvedValue([]);
    const mockWorkspaces: DeepPartial<AjaxWorkspacesContract> = {
      workspace: () => ({
        getAcl: mockGetAcl,
        bucketUsage: mockGetBucketUsage,
        delete: mockDelete,
      }),
    };

    const mockAjax: Partial<AjaxContract> = {
      Apps: mockApps as AjaxAppsContract,
      Workspaces: mockWorkspaces as AjaxWorkspacesContract,
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    // Act
    const { result, waitForNextUpdate } = renderHook(() =>
      useDeleteWorkspaceState({ workspace: googleWorkspace, onDismiss: mockOnDismiss, onSuccess: mockOnSuccess })
    );
    await waitForNextUpdate();
    await act(() => result.current.deleteWorkspace());

    // Assert
    expect(result.current.deleting).toBe(true);
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it('can handle errors when deletion fails', async () => {
    // Arrange
    const mockApps: Partial<AjaxAppsContract> = {
      listWithoutProject: vi.fn(),
    };
    asMockedFn((mockApps as AjaxAppsContract).listWithoutProject).mockResolvedValue([]);

    const mockGetAcl = vi.fn().mockResolvedValue([]);
    const mockGetBucketUsage = vi.fn().mockResolvedValue([]);
    const mockDelete = vi.fn().mockRejectedValue(new Error('testing'));
    const mockWorkspaces: DeepPartial<AjaxWorkspacesContract> = {
      workspace: () => ({
        getAcl: mockGetAcl,
        bucketUsage: mockGetBucketUsage,
        delete: mockDelete,
      }),
    };

    const mockAjax: Partial<AjaxContract> = {
      Apps: mockApps as AjaxAppsContract,
      Workspaces: mockWorkspaces as AjaxWorkspacesContract,
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    // Act
    const { result, waitForNextUpdate } = renderHook(() =>
      useDeleteWorkspaceState({ workspace: googleWorkspace, onDismiss: mockOnDismiss, onSuccess: mockOnSuccess })
    );
    await waitForNextUpdate();

    await act(() => result.current.deleteWorkspace());

    // Assert
    expect(result.current.deleting).toBe(false);
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(reportError).toHaveBeenCalledTimes(1);
  });

  it('should not allow deletion of undeletable azure apps', async () => {
    // Arrange
    const mockDelete = vi.fn().mockResolvedValue([]);
    const mockGetAcl = vi.fn().mockResolvedValue({ acl: { 'example1@example.com': {} } });
    const mockWorkspaces: DeepPartial<AjaxWorkspacesContract> = {
      workspace: () => ({
        delete: mockDelete,
        getAcl: mockGetAcl,
      }),
    };
    const mockListAppsV2: Partial<AjaxAppsContract> = {
      listAppsV2: vi.fn(),
      deleteAllAppsV2: vi.fn(),
    };
    asMockedFn((mockListAppsV2 as AjaxAppsContract).listAppsV2).mockResolvedValue([
      generateTestApp({
        appName: 'app1',
        status: 'PROVISIONING',
      }),
    ]);
    const mockListRuntimesV2: Partial<AjaxRuntimesContract> = {
      listV2WithWorkspace: vi.fn(),
    };
    asMockedFn((mockListRuntimesV2 as AjaxRuntimesContract).listV2WithWorkspace).mockResolvedValue([]);

    const mockAjax: Partial<AjaxContract> = {
      Workspaces: mockWorkspaces as AjaxWorkspacesContract,
      Apps: mockListAppsV2 as AjaxAppsContract,
      Runtimes: mockListRuntimesV2 as AjaxRuntimesContract,
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    // Act
    const { result, waitForNextUpdate } = renderHook(() =>
      useDeleteWorkspaceState({ workspace: azureWorkspace, onDismiss: mockOnDismiss, onSuccess: mockOnSuccess })
    );
    await waitForNextUpdate();

    await act(() => result.current.deleteWorkspaceResources());

    // Assert
    expect(result.current.deleting).toBe(false);
    expect(result.current.deletingResources).toBe(false);
    expect(mockListAppsV2.deleteAllAppsV2).toHaveBeenCalledTimes(0);
    expect(mockDelete).toHaveBeenCalledTimes(0);
  });

  it('polls after dispatching a call to delete workspace resources', async () => {
    // Arrange
    const mockDelete = vi.fn().mockResolvedValue([]);
    const mockGetAcl = vi.fn().mockResolvedValue({ acl: { 'example1@example.com': {} } });
    const mockWorkspaces: DeepPartial<AjaxWorkspacesContract> = {
      workspace: () => ({
        delete: mockDelete,
        getAcl: mockGetAcl,
      }),
    };

    const mockListAppsFn = vi.fn();
    const mockDeleteAllApps = vi.fn();
    const mockListAppsV2: Partial<AjaxAppsContract> = {
      listAppsV2: mockListAppsFn,
      deleteAllAppsV2: mockDeleteAllApps,
    };
    mockListAppsFn
      .mockResolvedValueOnce([
        {
          appName: 'app1',
          status: 'running',
        },
      ])
      .mockResolvedValueOnce([]);

    const mockDeleteAllRuntimes = vi.fn();
    const mockRuntimesV2: DeepPartial<AjaxRuntimesContract> = {
      listV2WithWorkspace: vi.fn(),
      deleteAll: mockDeleteAllRuntimes,
    };
    asMockedFn((mockRuntimesV2 as AjaxRuntimesContract).listV2WithWorkspace).mockResolvedValue([]);

    const mockAjax: Partial<AjaxContract> = {
      Workspaces: mockWorkspaces as AjaxWorkspacesContract,
      Apps: mockListAppsV2 as AjaxAppsContract,
      Runtimes: mockRuntimesV2 as AjaxRuntimesContract,
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    // Act
    const { result, waitForNextUpdate } = renderHook(() =>
      useDeleteWorkspaceState({ workspace: azureWorkspace, onDismiss: mockOnDismiss, onSuccess: mockOnSuccess })
    );
    await waitForNextUpdate();
    await act(() => result.current.deleteWorkspaceResources());

    // Assert
    expect(result.current.deleting).toBe(false);
    expect(result.current.deletingResources).toBe(true);
    expect(mockDelete).toHaveBeenCalledTimes(0);
    expect(mockDeleteAllRuntimes).toHaveBeenCalledTimes(1);
    expect(mockDeleteAllRuntimes).toHaveBeenCalledWith(azureWorkspace.workspace.workspaceId, true);
    expect(mockDeleteAllApps).toHaveBeenCalledTimes(1);
    expect(mockDeleteAllApps).toHaveBeenCalledWith(azureWorkspace.workspace.workspaceId, true);

    // Act
    vi.advanceTimersByTime(WorkspaceResourceDeletionPollRate);
    await waitForNextUpdate();

    expect(result.current.deletingResources).toBe(false);
    expect(result.current.hasApps()).toBe(false);
  });

  it('should report an error when initial call to delete resources fails', async () => {
    // Arrange
    const mockDelete = vi.fn().mockResolvedValue([]);
    const mockGetAcl = vi.fn().mockResolvedValue({ acl: { 'example1@example.com': {} } });
    const mockWorkspaces: DeepPartial<AjaxWorkspacesContract> = {
      workspace: () => ({
        delete: mockDelete,
        getAcl: mockGetAcl,
      }),
    };

    const mockListAppsFn = vi.fn();
    const mockListAppsV2: Partial<AjaxAppsContract> = {
      listAppsV2: mockListAppsFn,
      deleteAllAppsV2: vi.fn(),
    };
    mockListAppsFn
      .mockResolvedValueOnce([
        {
          appName: 'app1',
          status: 'running',
        },
      ])
      .mockResolvedValueOnce([]);
    const mockRuntimeDeleteAll = vi.fn().mockRejectedValue('failed');
    const mockRuntimesV2: DeepPartial<AjaxRuntimesContract> = {
      listV2WithWorkspace: vi.fn(),
      deleteAll: mockRuntimeDeleteAll,
    };
    asMockedFn((mockRuntimesV2 as AjaxRuntimesContract).listV2WithWorkspace).mockResolvedValue([]);

    const mockAjax: Partial<AjaxContract> = {
      Workspaces: mockWorkspaces as AjaxWorkspacesContract,
      Apps: mockListAppsV2 as AjaxAppsContract,
      Runtimes: mockRuntimesV2 as AjaxRuntimesContract,
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    // Act
    const { result, waitForNextUpdate } = renderHook(() =>
      useDeleteWorkspaceState({
        workspace: azureWorkspace,
        onDismiss: mockOnDismiss,
        onSuccess: mockOnSuccess,
      })
    );
    await waitForNextUpdate();
    await act(() => result.current.deleteWorkspaceResources());

    expect(mockRuntimeDeleteAll).toHaveBeenCalledTimes(1);
    expect(reportError).toHaveBeenCalledTimes(1);
  });

  it('should handle errors during resource deletion polling', async () => {
    // Arrange
    const mockDelete = vi.fn().mockResolvedValue([]);
    const mockGetAcl = vi.fn().mockResolvedValue({ acl: { 'example1@example.com': {} } });
    const mockWorkspaces: DeepPartial<AjaxWorkspacesContract> = {
      workspace: () => ({
        delete: mockDelete,
        getAcl: mockGetAcl,
      }),
    };
    const mockListAppsFn = vi.fn();
    const mockListAppsV2: Partial<AjaxAppsContract> = {
      listAppsV2: mockListAppsFn,
      deleteAllAppsV2: vi.fn(),
    };
    mockListAppsFn
      .mockResolvedValueOnce([
        {
          appName: 'app1',
          status: 'running',
        },
      ])
      .mockRejectedValue('error');
    const mockRuntimesV2: DeepPartial<AjaxRuntimesContract> = {
      listV2WithWorkspace: vi.fn(),
      deleteAll: vi.fn,
    };
    asMockedFn((mockRuntimesV2 as AjaxRuntimesContract).listV2WithWorkspace).mockResolvedValue([]);

    const mockAjax: Partial<AjaxContract> = {
      Workspaces: mockWorkspaces as AjaxWorkspacesContract,
      Apps: mockListAppsV2 as AjaxAppsContract,
      Runtimes: mockRuntimesV2 as AjaxRuntimesContract,
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    // Act
    const { result, waitForNextUpdate } = renderHook(() =>
      useDeleteWorkspaceState({ workspace: azureWorkspace, onDismiss: mockOnDismiss, onSuccess: mockOnSuccess })
    );
    await waitForNextUpdate();
    await act(() => result.current.deleteWorkspaceResources());

    // Assert
    expect(result.current.deleting).toBe(false);
    expect(result.current.deletingResources).toBe(true);
    expect(mockDelete).toHaveBeenCalledTimes(0);

    // Act
    vi.advanceTimersByTime(WorkspaceResourceDeletionPollRate);
    await waitForNextUpdate();

    expect(result.current.deletingResources).toBe(false);
    expect(reportError).toHaveBeenCalledTimes(1);
  });
});
