import { useEffect, useRef, useState } from 'react';
import { Ajax } from 'src/libs/ajax';
import { ListAppResponse } from 'src/libs/ajax/leonardo/models/app-models';
import { withErrorIgnoring, withErrorReporting } from 'src/libs/error';
import { isAzureWorkspace, isGoogleWorkspace } from 'src/libs/workspace-utils';
import { InitializedWorkspaceWrapper as Workspace } from 'src/pages/workspaces/hooks/useWorkspace';

export interface AppDetails {
  apps?: ListAppResponse[];
  refreshApps: (maybeStale?: boolean) => Promise<void>;
}

export const useAppPolling = (name: string, namespace: string, workspace?: Workspace): AppDetails => {
  const [controller, setController] = useState(new window.AbortController());
  const abort = () => {
    controller.abort();
    setController(new window.AbortController());
  };
  const signal = controller.signal;
  const timeout = useRef<NodeJS.Timeout>();
  const [apps, setApps] = useState<ListAppResponse[]>();

  const reschedule = (ms) => {
    clearTimeout(timeout.current);
    timeout.current = setTimeout(refreshAppsSilently, ms);
  };
  const loadApps = async (maybeStale?: boolean): Promise<void> => {
    try {
      const newGoogleApps =
        workspace?.workspaceInitialized && isGoogleWorkspace(workspace)
          ? await Ajax(signal).Apps.list(workspace.workspace.googleProject, {
              role: 'creator',
              saturnWorkspaceName: workspace.workspace.name,
            })
          : [];
      const newAzureApps =
        workspace?.workspaceInitialized && isAzureWorkspace(workspace)
          ? await Ajax(signal).Apps.listAppsV2(workspace.workspace.workspaceId)
          : [];
      const combinedNewApps = [...newGoogleApps, ...newAzureApps];

      setApps(combinedNewApps);
      Object.values(combinedNewApps).forEach((app) => {
        reschedule(maybeStale || (app && ['PROVISIONING', 'PREDELETING'].includes(app.status)) ? 10000 : 120000);
      });
    } catch (error) {
      reschedule(30000);
      throw error;
    }
  };
  const refreshApps = withErrorReporting('Error loading apps', loadApps) as (maybeStale?: boolean) => Promise<void>;
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
  return { apps, refreshApps };
};