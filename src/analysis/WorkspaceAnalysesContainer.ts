import { ReactNode } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { AnalysesData } from 'src/analysis/Analyses';
import AnalysisNotificationManager from 'src/analysis/AnalysisNotificationManager';
import { ContextBar } from 'src/analysis/ContextBar';
import { useAppPolling } from 'src/workspaces/common/state/useAppPolling';
import { useCloudEnvironmentPolling } from 'src/workspaces/common/state/useCloudEnvironmentPolling';
import { StorageDetails } from 'src/workspaces/common/state/useWorkspace';
import { WorkspaceWrapper } from 'src/workspaces/utils';

export interface WorkspaceAnalysesContainerProps {
  children: (analysesData: AnalysesData) => ReactNode;
  storageDetails: StorageDetails;
  workspace: WorkspaceWrapper;
}

export const WorkspaceAnalysesContainer = (props: WorkspaceAnalysesContainerProps): ReactNode => {
  const { children, storageDetails, workspace } = props;
  const { namespace, name } = workspace.workspace;

  const { runtimes, refreshRuntimes, persistentDisks, appDataDisks, isLoadingCloudEnvironments } =
    useCloudEnvironmentPolling(name, namespace, workspace);
  const { apps, refreshApps, lastRefresh } = useAppPolling(name, namespace, workspace);

  return div({ style: { flex: 1, display: 'flex' } }, [
    div({ style: { flex: 1, display: 'flex', flexDirection: 'column' } }, [
      children({
        apps,
        appDataDisks,
        refreshApps,
        runtimes,
        persistentDisks,
        refreshRuntimes,
        isLoadingCloudEnvironments,
        lastRefresh,
      }),
    ]),
    workspace &&
      workspace?.workspace.state !== 'Deleting' &&
      workspace?.workspace.state !== 'DeleteFailed' &&
      h(ContextBar, {
        workspace,
        apps: apps || [],
        appDataDisks: appDataDisks || [],
        refreshApps,
        runtimes: runtimes || [],
        persistentDisks: persistentDisks || [],
        refreshRuntimes,
        isLoadingCloudEnvironments,
        storageDetails,
      }),
    h(AnalysisNotificationManager, { namespace, name, runtimes: runtimes || [], apps: apps || [] }),
  ]);
};
