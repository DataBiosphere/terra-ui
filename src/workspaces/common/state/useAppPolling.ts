import { useEffect, useRef, useState } from 'react';
import { Apps } from 'src/libs/ajax/leonardo/Apps';
import { ListAppItem } from 'src/libs/ajax/leonardo/models/app-models';
import { withErrorIgnoring, withErrorReporting } from 'src/libs/error';
import { InitializedWorkspaceWrapper as Workspace } from 'src/workspaces/common/state/useWorkspace';
import { isAzureWorkspace, isGoogleWorkspace } from 'src/workspaces/utils';

export interface AppDetails {
  apps?: ListAppItem[];
  refreshApps: (maybeStale?: boolean) => Promise<void>;
  lastRefresh: Date | null;
}

export const useAppPolling = (name: string, namespace: string, workspace?: Workspace): AppDetails => {
  const [controller, setController] = useState(new window.AbortController());
  const abort = () => {
    controller.abort();
    setController(new window.AbortController());
  };
  const signal = controller.signal;
  const timeout = useRef<NodeJS.Timeout>();
  const [apps, setApps] = useState<ListAppItem[]>();
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const reschedule = (ms) => {
    clearTimeout(timeout.current);
    timeout.current = setTimeout(refreshAppsSilently, ms);
  };
  const loadApps = async (maybeStale?: boolean): Promise<void> => {
    try {
      const newGoogleApps =
        workspace?.workspaceInitialized && isGoogleWorkspace(workspace)
          ? await Apps(signal).list(workspace.workspace.googleProject, {
              role: 'creator',
              saturnWorkspaceName: workspace.workspace.name,
            })
          : [];
      const newAzureApps =
        workspace?.workspaceInitialized && isAzureWorkspace(workspace)
          ? await Apps(signal).listAppsV2(workspace.workspace.workspaceId)
          : [];
      const combinedNewApps = [...newGoogleApps, ...newAzureApps];

      setApps(combinedNewApps);
      Object.values(combinedNewApps).forEach((app) => {
        reschedule(maybeStale || (app && ['PROVISIONING', 'PREDELETING'].includes(app.status)) ? 10000 : 120000);
      });
      setLastRefresh(new Date());
    } catch (error) {
      reschedule(30000);
      throw error;
    }
  };
  const refreshApps = withErrorReporting('Error loading apps')(loadApps);
  const refreshAppsSilently = withErrorIgnoring(loadApps);
  useEffect(() => {
    if (
      workspace?.workspaceInitialized &&
      workspace.workspace.name === name &&
      workspace.workspace.namespace === namespace
    ) {
      refreshApps();
    }
    return () => {
      abort();
      clearTimeout(timeout.current);
    };
    //  eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace]);
  return { apps, refreshApps, lastRefresh };
};
