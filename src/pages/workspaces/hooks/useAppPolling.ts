import { useEffect, useRef, useState } from 'react';
import { Ajax } from 'src/libs/ajax';
import { ListAppResponse } from 'src/libs/ajax/leonardo/models/app-models';
import { withErrorIgnoring, withErrorReporting } from 'src/libs/error';
import { useCancellation } from 'src/libs/react-utils';
import { isAzureWorkspace, isGoogleWorkspace } from 'src/libs/workspace-utils';
import { InitializedWorkspaceWrapper as Workspace } from 'src/pages/workspaces/workspace/useWorkspace';

export interface AppDetails {
  apps?: ListAppResponse[];
  refreshApps: (maybeStale?: boolean) => Promise<void>;
}

export const useAppPolling = (workspace: Workspace): AppDetails => {
  const signal = useCancellation();
  const timeout = useRef<NodeJS.Timeout>();
  const [apps, setApps] = useState<ListAppResponse[]>();

  const reschedule = (ms) => {
    clearTimeout(timeout.current);
    timeout.current = setTimeout(refreshAppsSilently, ms);
  };
  const loadApps = async (maybeStale?: boolean): Promise<void> => {
    try {
      const newGoogleApps =
        !!workspace && isGoogleWorkspace(workspace)
          ? await Ajax(signal).Apps.list(workspace.workspace.googleProject, {
              role: 'creator',
              saturnWorkspaceName: workspace.workspace.name,
            })
          : [];
      const newAzureApps =
        !!workspace && isAzureWorkspace(workspace)
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
    refreshApps();
    return () => clearTimeout(timeout.current);
    //  eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace]);
  return { apps, refreshApps };
};
