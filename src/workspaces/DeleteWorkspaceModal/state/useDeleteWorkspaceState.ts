import _ from 'lodash/fp';
import { useRef, useState } from 'react';
import { isResourceDeletable } from 'src/analysis/utils/resource-utils';
import { Ajax } from 'src/libs/ajax';
import { App } from 'src/libs/ajax/leonardo/models/app-models';
import { Runtime } from 'src/libs/ajax/leonardo/models/runtime-models';
import { reportError, withErrorReportingInModal } from 'src/libs/error';
import { useCancellation, useOnMount } from 'src/libs/react-utils';
import { getTerraUser, workspaceStore } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { BaseWorkspace, isAzureWorkspace, isGoogleWorkspace, WorkspaceInfo } from 'src/workspaces/utils';

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
}

export interface DeleteWorkspaceHookArgs {
  workspace: BaseWorkspace;
  onDismiss: () => void;
  onSuccess: () => void;
}

export const useDeleteWorkspaceState = (hookArgs: DeleteWorkspaceHookArgs): DeleteWorkspaceState => {
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
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

    const [deletableApps, nonDeletableApps] = _.partition((app) => isResourceDeletable(app), apps);
    const [deletableRuntimes, nonDeletableRuntimes] = _.partition(
      (runtime) => isResourceDeletable(runtime),
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
        const [{ acl }, bucketUsage] = await Promise.all([
          Ajax(signal).Workspaces.workspace(workspaceInfo.namespace, workspaceInfo.name).getAcl(),
          Ajax(signal)
            .Workspaces.workspace(workspaceInfo.namespace, workspaceInfo.name)
            .bucketUsage()
            .catch((_error) => undefined),
        ]);
        setCollaboratorEmails(_.without([getTerraUser().email!], _.keys(acl)));
        setWorkspaceBucketUsageInBytes(bucketUsage?.usageInBytes);
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

      await Ajax(signal).Workspaces.workspaceV2(workspaceInfo.namespace, workspaceInfo.name).delete();
      hookArgs.onDismiss();
      hookArgs.onSuccess();
      workspaceStore.reset();
    } catch (error) {
      setDeleting(false);
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
  };
};
