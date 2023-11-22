import { useCallback } from 'react';
import { Ajax } from 'src/libs/ajax';
import { reportError } from 'src/libs/error';
import { notify } from 'src/libs/notifications';
import { useCancellation, useStore } from 'src/libs/react-utils';
import { AsyncImportJob, asyncImportJobStore } from 'src/libs/state';
import { isAzureWorkspace, WorkspaceWrapper } from 'src/libs/workspace-utils';

export type UseImportJobsResult = {
  runningJobs: string[];
  refresh: () => Promise<void>;
};

const isJobInWorkspace = (job: AsyncImportJob, workspace: WorkspaceWrapper): boolean => {
  return (
    job.targetWorkspace.namespace === workspace.workspace.namespace &&
    job.targetWorkspace.name === workspace.workspace.name
  );
};

export const useImportJobs = (workspace: WorkspaceWrapper): UseImportJobsResult => {
  const allRunningJobs = useStore(asyncImportJobStore);

  const signal = useCancellation();
  const refresh = useCallback(async () => {
    const {
      workspace: { namespace, name },
    } = workspace;
    try {
      // Azure workspaces know about running jobs from the asyncImportJobStore
      if (!isAzureWorkspace(workspace)) {
        const runningJobsInWorkspace: { jobId: string }[] = await Ajax(signal)
          .Workspaces.workspace(namespace, name)
          .listImportJobs(true);

        asyncImportJobStore.update((previousState) => {
          return [
            ...previousState.filter((job) => !isJobInWorkspace(job, workspace)),
            ...runningJobsInWorkspace.map(({ jobId }) => ({ jobId, targetWorkspace: { namespace, name } })),
          ];
        });
      }
    } catch (error) {
      reportError('Error loading running import jobs in this workspace', error);
    }
  }, [workspace, signal]);

  const runningJobsInWorkspace = allRunningJobs.filter((job) => isJobInWorkspace(job, workspace));
  return {
    runningJobs: runningJobsInWorkspace.map((job) => job.jobId),
    refresh,
  };
};

export const notifyDataImportProgress = (jobId: string, message?: string): void => {
  notify('info', 'Data import in progress.', {
    id: jobId,
    message,
  });
};
