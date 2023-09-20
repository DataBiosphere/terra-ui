import _ from 'lodash/fp';
import { useRef, useState } from 'react';
import { isResourceDeletable } from 'src/analysis/utils/resource-utils';
import { Ajax } from 'src/libs/ajax';
import { App } from 'src/libs/ajax/leonardo/models/app-models';
import { Runtime } from 'src/libs/ajax/leonardo/models/runtime-models';
import { reportError, withErrorReportingInModal } from 'src/libs/error';
import { useCancellation, useOnMount } from 'src/libs/react-utils';
import { getUser } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { BaseWorkspace, isAzureWorkspace, isGoogleWorkspace, WorkspaceInfo } from 'src/libs/workspace-utils';

export const WorkspaceResourceDeletionPollRate = 5000;

export interface WorkspaceResources {
  nonDeleteableApps: App[];
  deleteableApps: App[];
  apps: App[];
  deleteableRuntimes: Runtime[];
  nonDeleteableRuntimes: Runtime[];
  runtimes: Runtime[];
}

export interface DeleteWorkspaceState {
  workspaceResources: WorkspaceResources | undefined;
  loading: boolean;
  deleting: boolean;
  isDeleteDisabledFromResources: boolean;
  workspaceBucketUsageInBytes: number | undefined;
  collaboratorEmails: string[] | undefined;
  hasApps: () => boolean;
  hasRuntimes: () => boolean;
  deleteWorkspace: () => void;
  deleteWorkspaceResources: () => void;
  deletingResources: boolean;
}

export interface DeleteWorkspaceHookArgs {
  workspace: BaseWorkspace;
  onDismiss: () => void;
  onSuccess: () => void;
}

export const useDeleteWorkspaceState = (hookArgs: DeleteWorkspaceHookArgs): DeleteWorkspaceState => {
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingResources, setDeletingResources] = useState(false);
  const [workspaceResources, setWorkspaceResources] = useState<WorkspaceResources>();
  const [collaboratorEmails, setCollaboratorEmails] = useState<string[]>();
  const [workspaceBucketUsageInBytes, setWorkspaceBucketUsageInBytes] = useState<number>();

  const workspaceInfo: WorkspaceInfo = hookArgs.workspace.workspace;
  const signal = useCancellation();
  const checkAzureResourcesTimeout = useRef<number>();

  const fetchWorkspaceResources = async (workspace: BaseWorkspace): Promise<WorkspaceResources> => {
    const apps = isGoogleWorkspace(workspace)
      ? await Ajax(signal).Apps.listWithoutProject({
          role: 'creator',
          saturnWorkspaceName: workspaceInfo.name,
        })
      : await Ajax(signal).Apps.listAppsV2(workspaceInfo.workspaceId);

    // only v2 runtimes supported right now for azure
    const currentRuntimesList = isAzureWorkspace(workspace)
      ? await Ajax(signal).Runtimes.listV2WithWorkspace(workspaceInfo.workspaceId)
      : [];

    const [deletableApps, nonDeletableApps] = _.partition((app) => isResourceDeletable('app', app), apps);
    const [deletableRuntimes, nonDeletableRuntimes] = _.partition(
      (runtime) => isResourceDeletable('runtime', runtime),
      currentRuntimesList
    );
    return {
      nonDeleteableApps: nonDeletableApps,
      deleteableApps: deletableApps,
      apps,
      deleteableRuntimes: deletableRuntimes,
      nonDeleteableRuntimes: nonDeletableRuntimes,
      runtimes: currentRuntimesList,
    };
  };

  useOnMount(() => {
    const load = _.flow(
      withErrorReportingInModal('Error checking workspace resources', hookArgs.onDismiss),
      Utils.withBusyState(setLoading)
    )(async () => {
      const appsInfo = await fetchWorkspaceResources(hookArgs.workspace);
      setWorkspaceResources(appsInfo);

      if (isGoogleWorkspace(hookArgs.workspace)) {
        const [{ acl }, { usageInBytes }] = await Promise.all([
          Ajax(signal).Workspaces.workspace(workspaceInfo.namespace, workspaceInfo.name).getAcl(),
          Ajax(signal).Workspaces.workspace(workspaceInfo.namespace, workspaceInfo.name).bucketUsage(),
        ]);
        setCollaboratorEmails(_.without([getUser().email!], _.keys(acl)));
        setWorkspaceBucketUsageInBytes(usageInBytes);
      }
    });
    load();

    return () => clearTimeout(checkAzureResourcesTimeout.current);
  });

  const hasApps = () => {
    return workspaceResources !== undefined && !_.isEmpty(workspaceResources.apps);
  };

  const hasRuntimes = () => {
    return workspaceResources !== undefined && !_.isEmpty(workspaceResources.runtimes);
  };

  const isDeleteDisabledFromResources =
    workspaceResources !== undefined &&
    ((hasApps() && !_.isEmpty(workspaceResources.nonDeleteableApps)) ||
      (hasRuntimes() && !_.isEmpty(workspaceResources.nonDeleteableRuntimes)));

  const deleteWorkspace = async () => {
    if (isDeleteDisabledFromResources) {
      throw new Error('Workspace contains non-deletable resources');
    }

    try {
      setDeleting(true);
      if (isGoogleWorkspace(hookArgs.workspace) && workspaceResources) {
        await Promise.all(
          _.map(
            async (app) => await Ajax(signal).Apps.app(app.cloudContext.cloudResource, app.appName).delete(),
            workspaceResources.deleteableApps
          )
        );
      }

      await Ajax(signal).Workspaces.workspace(workspaceInfo.namespace, workspaceInfo.name).delete();
      hookArgs.onDismiss();
      hookArgs.onSuccess();
    } catch (error) {
      setDeleting(false);
      reportError('Error deleting workspace', error);
    }
  };

  const checkAzureResources = async () => {
    try {
      console.log('Checking azure resources...'); // eslint-disable-line no-console
      const appsInfo = await fetchWorkspaceResources(hookArgs.workspace);
      setWorkspaceResources(appsInfo);

      if (appsInfo.apps.length > 0 || appsInfo.runtimes.length > 0) {
        console.log('Resources still present, rescheduling check...'); // eslint-disable-line no-console
        checkAzureResourcesTimeout.current = window.setTimeout(
          () => checkAzureResources(),
          WorkspaceResourceDeletionPollRate
        );
      } else {
        console.log('Resources gone.'); // eslint-disable-line no-console
        setDeletingResources(false);
      }
    } catch (error) {
      setDeletingResources(false);
      reportError('Error checking workspace resources', error);
    }
  };

  const deleteWorkspaceResources = async () => {
    try {
      if (isGoogleWorkspace(hookArgs.workspace)) {
        throw new Error('Attempting to delete resources in an unsupported workspace');
      }

      if (workspaceResources && workspaceResources.nonDeleteableApps.length > 0) {
        throw new Error('Workspace contains non-deletable apps');
      }

      if (workspaceResources && workspaceResources.nonDeleteableRuntimes.length > 0) {
        throw new Error('Workspace contains non-deletable runtimes');
      }

      setDeletingResources(true);
      console.log(`Requesting app and runtime deletion for workspace ${workspaceInfo.workspaceId}`); // eslint-disable-line no-console
      await Ajax(signal).Apps.deleteAllAppsV2(workspaceInfo.workspaceId, true);
      await Ajax(signal).Runtimes.deleteAll(workspaceInfo.workspaceId, true);
      console.log('Resource deletions requested, starting poll.'); // eslint-disable-line no-console

      checkAzureResourcesTimeout.current = window.setTimeout(
        () => checkAzureResources(),
        WorkspaceResourceDeletionPollRate
      );
    } catch (error) {
      setDeletingResources(false);
      reportError('Error deleting workspace', error);
    }
  };

  return {
    workspaceResources,
    loading,
    deleting,
    isDeleteDisabledFromResources,
    workspaceBucketUsageInBytes,
    collaboratorEmails,
    hasApps,
    hasRuntimes,
    deleteWorkspace,
    deleteWorkspaceResources,
    deletingResources,
  };
};
