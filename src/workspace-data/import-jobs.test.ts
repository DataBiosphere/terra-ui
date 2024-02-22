import { DeepPartial } from '@terra-ui-packages/core-utils';
import { act, renderHook } from '@testing-library/react';
import { Ajax } from 'src/libs/ajax';
import { asyncImportJobStore } from 'src/libs/state';
import { asMockedFn } from 'src/testing/test-utils';
import { AzureWorkspace, GoogleWorkspace } from 'src/workspaces/utils';

import { useImportJobs } from './import-jobs';

jest.mock('src/libs/ajax');
type AjaxExports = typeof import('src/libs/ajax');
type AjaxContract = ReturnType<AjaxExports['Ajax']>;

describe('useImportJobs', () => {
  describe('for Google workspaces', () => {
    // Arrange
    const workspace: GoogleWorkspace = {
      workspace: {
        authorizationDomain: [],
        cloudPlatform: 'Gcp',
        bucketName: 'test-bucket',
        googleProject: 'test-project',
        name: 'google-workspace',
        namespace: 'test-workspaces',
        workspaceId: 'testGoogleWorkspaceId',
        createdDate: '2023-02-15T19:17:15.711Z',
        createdBy: 'user@example.com',
        lastModified: '2023-03-15T19:17:15.711Z',
      },
      accessLevel: 'OWNER',
      canShare: true,
      canCompute: true,
      policies: [],
    };

    it('returns list of running jobs in workspace', () => {
      // Arrange
      asyncImportJobStore.set([
        { targetWorkspace: { namespace: 'test-workspaces', name: 'other-workspace' }, jobId: 'other-workspace-job' },
        { targetWorkspace: { namespace: 'test-workspaces', name: 'google-workspace' }, jobId: 'workspace-job-1' },
        { targetWorkspace: { namespace: 'test-workspaces', name: 'google-workspace' }, jobId: 'workspace-job-2' },
      ]);

      // Act
      const { result: hookReturnRef } = renderHook(() => useImportJobs(workspace));

      // Assert
      expect(hookReturnRef.current.runningJobs).toEqual(['workspace-job-1', 'workspace-job-2']);
    });

    it('returns a function that refreshes running jobs', async () => {
      // Arrange
      asyncImportJobStore.set([
        { targetWorkspace: { namespace: 'test-workspaces', name: 'google-workspace' }, jobId: 'job-1' },
        { targetWorkspace: { namespace: 'test-workspaces', name: 'google-workspace' }, jobId: 'job-2' },
      ]);

      const listImportJobs = jest.fn().mockResolvedValue([{ jobId: 'job-2' }, { jobId: 'job-3' }]);
      const mockAjax: DeepPartial<AjaxContract> = {
        Workspaces: {
          workspace: () => ({ listImportJobs }),
        },
      };
      asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

      const { result: hookReturnRef } = renderHook(() => useImportJobs(workspace));

      // Act
      await act(() => hookReturnRef.current.refresh());

      // Assert
      expect(listImportJobs).toHaveBeenCalledWith(true);
      expect(hookReturnRef.current.runningJobs).toEqual(['job-2', 'job-3']);
    });
  });

  describe('for Azure workspaces', () => {
    // Arrange
    const workspace: AzureWorkspace = {
      workspace: {
        authorizationDomain: [],
        cloudPlatform: 'Azure',
        name: 'azure-workspace',
        namespace: 'test-workspaces',
        workspaceId: 'fafbb550-62eb-4135-8b82-3ce4d53446af',
        createdDate: '2023-02-15T19:17:15.711Z',
        createdBy: 'user@example.com',
        lastModified: '2023-03-15T19:17:15.711Z',
      },
      azureContext: {
        managedResourceGroupId: 'test-mrg',
        subscriptionId: 'test-sub-id',
        tenantId: 'test-tenant-id',
      },
      accessLevel: 'OWNER',
      canShare: true,
      canCompute: true,
      policies: [],
    };

    it('returns list of jobs in workspace', () => {
      // Arrange
      asyncImportJobStore.set([
        { targetWorkspace: { namespace: 'test-workspaces', name: 'azure-workspace2' }, jobId: 'workspace-job' },
        { targetWorkspace: { namespace: 'test-workspaces', name: 'azure-workspace' }, jobId: 'workspace-job-2' },
      ]);

      // Act
      const { result: hookReturnRef } = renderHook(() => useImportJobs(workspace));

      // Assert
      expect(hookReturnRef.current.runningJobs).toEqual(['workspace-job-2']);
    });

    it('returns a no-op for refreshing jobs', async () => {
      // Arrange
      asyncImportJobStore.set([
        { targetWorkspace: { namespace: 'test-workspaces', name: 'azure-workspace' }, jobId: 'workspace-job' },
        { targetWorkspace: { namespace: 'test-workspaces', name: 'azure-workspace' }, jobId: 'workspace-job-2' },
      ]);

      const listImportJobs = jest.fn().mockResolvedValue([{ jobId: 'workspace-job' }, { jobId: 'workspace-job-2' }]);
      const mockAjax: DeepPartial<AjaxContract> = {
        Workspaces: {
          workspace: () => ({ listImportJobs }),
        },
      };
      asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

      const { result: hookReturnRef } = renderHook(() => useImportJobs(workspace));

      // Act
      await act(() => hookReturnRef.current.refresh());

      // Assert
      expect(listImportJobs).not.toHaveBeenCalled();
      expect(hookReturnRef.current.runningJobs).toEqual(['workspace-job', 'workspace-job-2']);
    });
  });
});
