import { DeepPartial } from '@terra-ui-packages/core-utils';
import { act } from '@testing-library/react';
import { generateTestApp } from 'src/analysis/_testData/testData';
import { Ajax } from 'src/libs/ajax';
import { reportError } from 'src/libs/error';
import { asMockedFn, renderHookInAct } from 'src/testing/test-utils';
import { useDeleteWorkspaceState } from 'src/workspaces/DeleteWorkspaceModal/state/useDeleteWorkspaceState';
import { AzureWorkspaceInfo, BaseWorkspace, GoogleWorkspaceInfo } from 'src/workspaces/utils';

type AjaxExports = typeof import('src/libs/ajax');
jest.mock('src/libs/ajax', (): AjaxExports => {
  return {
    ...jest.requireActual('src/libs/ajax'),
    Ajax: jest.fn(),
  };
});

type ErrorExports = typeof import('src/libs/error');
jest.mock(
  'src/libs/error',
  (): ErrorExports => ({
    ...jest.requireActual('src/libs/error'),
    reportError: jest.fn(),
  })
);

type AjaxContract = ReturnType<typeof Ajax>;
type AjaxAppsContract = AjaxContract['Apps'];
type AjaxRuntimesContract = AjaxContract['Runtimes'];
type AjaxWorkspacesContract = AjaxContract['Workspaces'];

describe('useDeleteWorkspaceState', () => {
  const googleWorkspace = {
    accessLevel: 'WRITER',
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
    accessLevel: 'WRITER',
    canShare: true,
    canCompute: true,
    workspace: {
      name: 'example',
      namespace: 'example',
      cloudPlatform: 'Azure',
      workspaceId: 'azureWorkspaceId',
    } as AzureWorkspaceInfo,
  } as BaseWorkspace;
  const mockOnDismiss = jest.fn(() => {});
  const mockOnSuccess = jest.fn(() => {});

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.useFakeTimers();
  });

  it('can initialize state for a google workspace with running apps', async () => {
    // Arrange
    const mockApps: Partial<AjaxAppsContract> = {
      listWithoutProject: jest.fn(),
    };
    asMockedFn((mockApps as AjaxAppsContract).listWithoutProject).mockResolvedValue([
      generateTestApp({
        appName: 'app1',
        status: 'RUNNING',
      }),
    ]);

    const mockGetAcl = jest.fn().mockResolvedValue({ acl: { 'example1@example.com': {} } });
    const mockGetBucketUsage = jest.fn().mockResolvedValue({ usageInBytes: 1234 });
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
    const { result } = await renderHookInAct(() =>
      useDeleteWorkspaceState({ workspace: googleWorkspace, onDismiss: mockOnDismiss, onSuccess: mockOnSuccess })
    );

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
      listAppsV2: jest.fn(),
    };
    asMockedFn((mockListAppsV2 as AjaxAppsContract).listAppsV2).mockResolvedValue([
      generateTestApp({
        appName: 'example',
        status: 'PROVISIONING',
      }),
    ]);
    const mockListRuntimesV2: Partial<AjaxRuntimesContract> = {
      listV2WithWorkspace: jest.fn(),
    };
    asMockedFn((mockListRuntimesV2 as AjaxRuntimesContract).listV2WithWorkspace).mockResolvedValue([]);

    const mockGetAcl = jest.fn().mockResolvedValue({ acl: { 'example1@example.com': {} } });
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
    const { result } = await renderHookInAct(() =>
      useDeleteWorkspaceState({ workspace: azureWorkspace, onDismiss: mockOnDismiss, onSuccess: mockOnSuccess })
    );

    // Assert
    expect(result.current.hasApps()).toBe(true);
    expect(result.current.hasRuntimes()).toBe(false);
    expect(result.current.isDeleteDisabledFromResources).toBe(true);
    expect(mockListAppsV2.listAppsV2).toHaveBeenCalledTimes(1);
    expect(mockListAppsV2.listAppsV2).toHaveBeenCalledWith(azureWorkspace.workspace.workspaceId);
  });

  it('can delete an azure workspace', async () => {
    // Arrange
    const mockDelete = jest.fn().mockResolvedValue([]);
    const mockGetAcl = jest.fn().mockResolvedValue({ acl: { 'example1@example.com': {} } });
    const mockWorkspaces: DeepPartial<AjaxWorkspacesContract> = {
      workspace: () => ({
        getAcl: mockGetAcl,
      }),
      workspaceV2: () => ({
        delete: mockDelete,
      }),
    };
    const mockListAppsV2: Partial<AjaxAppsContract> = {
      listAppsV2: jest.fn(),
    };
    asMockedFn((mockListAppsV2 as AjaxAppsContract).listAppsV2).mockResolvedValue([]);

    const mockListRuntimesV2: Partial<AjaxRuntimesContract> = {
      listV2WithWorkspace: jest.fn(),
    };
    asMockedFn((mockListRuntimesV2 as AjaxRuntimesContract).listV2WithWorkspace).mockResolvedValue([]);

    const mockAjax: Partial<AjaxContract> = {
      Workspaces: mockWorkspaces as AjaxWorkspacesContract,
      Apps: mockListAppsV2 as AjaxAppsContract,
      Runtimes: mockListRuntimesV2 as AjaxRuntimesContract,
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    // Act
    const { result } = await renderHookInAct(() =>
      useDeleteWorkspaceState({ workspace: azureWorkspace, onDismiss: mockOnDismiss, onSuccess: mockOnSuccess })
    );
    await act(() => result.current.deleteWorkspace());

    // Assert
    expect(result.current.deleting).toBe(true);
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it('can delete a google workspace', async () => {
    // Arrange
    const mockDelete = jest.fn().mockResolvedValue([]);
    const mockApps: Partial<AjaxAppsContract> = {
      listWithoutProject: jest.fn(),
    };
    asMockedFn((mockApps as AjaxAppsContract).listWithoutProject).mockResolvedValue([]);

    const mockGetAcl = jest.fn().mockResolvedValue([]);
    const mockGetBucketUsage = jest.fn().mockResolvedValue([]);
    const mockWorkspaces: DeepPartial<AjaxWorkspacesContract> = {
      workspace: () => ({
        getAcl: mockGetAcl,
        bucketUsage: mockGetBucketUsage,
      }),
      workspaceV2: () => ({
        delete: mockDelete,
      }),
    };

    const mockAjax: Partial<AjaxContract> = {
      Apps: mockApps as AjaxAppsContract,
      Workspaces: mockWorkspaces as AjaxWorkspacesContract,
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    // Act
    const { result } = await renderHookInAct(() =>
      useDeleteWorkspaceState({ workspace: googleWorkspace, onDismiss: mockOnDismiss, onSuccess: mockOnSuccess })
    );
    await act(() => result.current.deleteWorkspace());

    // Assert
    expect(result.current.deleting).toBe(true);
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it('can handle errors when deletion fails', async () => {
    // Arrange
    const mockApps: Partial<AjaxAppsContract> = {
      listWithoutProject: jest.fn(),
    };
    asMockedFn((mockApps as AjaxAppsContract).listWithoutProject).mockResolvedValue([]);

    const mockGetAcl = jest.fn().mockResolvedValue([]);
    const mockGetBucketUsage = jest.fn().mockResolvedValue([]);
    const mockDelete = jest.fn().mockRejectedValue(new Error('testing'));
    const mockWorkspaces: DeepPartial<AjaxWorkspacesContract> = {
      workspace: () => ({
        getAcl: mockGetAcl,
        bucketUsage: mockGetBucketUsage,
      }),
      workspaceV2: () => ({
        delete: mockDelete,
      }),
    };

    const mockAjax: Partial<AjaxContract> = {
      Apps: mockApps as AjaxAppsContract,
      Workspaces: mockWorkspaces as AjaxWorkspacesContract,
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    // Act
    const { result } = await renderHookInAct(() =>
      useDeleteWorkspaceState({ workspace: googleWorkspace, onDismiss: mockOnDismiss, onSuccess: mockOnSuccess })
    );

    await act(() => result.current.deleteWorkspace());

    // Assert
    expect(result.current.deleting).toBe(false);
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(reportError).toHaveBeenCalledTimes(1);
  });

  it('can delete a google workspace with no google project', async () => {
    // Arrange
    const mockApps: Partial<AjaxAppsContract> = {
      listWithoutProject: jest.fn(),
    };
    asMockedFn((mockApps as AjaxAppsContract).listWithoutProject).mockResolvedValue([]);

    const mockGetAcl = jest.fn().mockResolvedValue([]);
    const mockGetBucketUsage = jest.fn().mockRejectedValue(new Error('no project!'));
    const mockDelete = jest.fn().mockResolvedValue([]);
    const mockWorkspaces: DeepPartial<AjaxWorkspacesContract> = {
      workspace: () => ({
        getAcl: mockGetAcl,
        bucketUsage: mockGetBucketUsage,
      }),
      workspaceV2: () => ({
        delete: mockDelete,
      }),
    };

    const mockAjax: Partial<AjaxContract> = {
      Apps: mockApps as AjaxAppsContract,
      Workspaces: mockWorkspaces as AjaxWorkspacesContract,
    };
    asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

    // Act
    const { result } = await renderHookInAct(() =>
      useDeleteWorkspaceState({ workspace: googleWorkspace, onDismiss: mockOnDismiss, onSuccess: mockOnSuccess })
    );

    await act(() => result.current.deleteWorkspace());

    // Assert
    expect(result.current.deleting).toBe(true);
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });
});
