import _ from 'lodash/fp';
import { useEffect, useRef, useState } from 'react';
import { getDiskAppType } from 'src/analysis/utils/app-utils';
import { getConvertedRuntimeStatus, getCurrentRuntime } from 'src/analysis/utils/runtime-utils';
import { ListRuntimeItem } from 'src/libs/ajax/leonardo/models/runtime-models';
import { leoDiskProvider, PersistentDisk } from 'src/libs/ajax/leonardo/providers/LeoDiskProvider';
import { Runtimes } from 'src/libs/ajax/leonardo/Runtimes';
import { withErrorIgnoring, withErrorReporting } from 'src/libs/error';
import { InitializedWorkspaceWrapper as Workspace } from 'src/workspaces/common/state/useWorkspace';

export interface CloudEnvironmentDetails {
  runtimes?: ListRuntimeItem[];
  refreshRuntimes: (maybeStale?: boolean) => Promise<void>;
  persistentDisks?: PersistentDisk[];
  appDataDisks?: PersistentDisk[];
  // TODO use LoadedState instead
  isLoadingCloudEnvironments: boolean;
}

export const useCloudEnvironmentPolling = (
  name: string,
  namespace: string,
  workspace?: Workspace
): CloudEnvironmentDetails => {
  const controller = useRef(new window.AbortController());
  const abort = () => {
    controller.current.abort();
    controller.current = new window.AbortController();
  };
  const timeout = useRef<NodeJS.Timeout>();
  const [runtimes, setRuntimes] = useState<ListRuntimeItem[]>();
  const [isLoadingCloudEnvironments, setIsLoadingCloudEnvironments] = useState<boolean>(true);
  const [persistentDisks, setPersistentDisks] = useState<PersistentDisk[]>();
  const [appDataDisks, setAppDataDisks] = useState<PersistentDisk[]>();

  const saturnWorkspaceNamespace = workspace?.workspace?.namespace;
  const saturnWorkspaceName = workspace?.workspace?.name;

  const reschedule = (ms) => {
    clearTimeout(timeout.current);
    timeout.current = setTimeout(refreshRuntimesSilently, ms);
  };
  const load = async (maybeStale?: boolean): Promise<void> => {
    try {
      const cloudEnvFilters = _.pickBy((l) => !_.isUndefined(l), {
        role: 'creator',
        saturnWorkspaceName,
        saturnWorkspaceNamespace,
      }) as Record<string, string>; // we literally just filtered out the undefined values, but ts doesn't know this

      // Disks.list API takes includeLabels to specify which labels to return in the response
      // Runtimes.listV2 API always returns all labels for a runtime
      const [newDisks, newRuntimes] = await Promise.all([
        leoDiskProvider.list(
          {
            ...cloudEnvFilters,
            includeLabels: 'saturnApplication,saturnWorkspaceName,saturnWorkspaceNamespace',
          },
          { signal: controller.current.signal }
        ),
        Runtimes(controller.current.signal).listV2(cloudEnvFilters),
      ]);

      setRuntimes(newRuntimes);
      setAppDataDisks(_.remove((disk) => _.isUndefined(getDiskAppType(disk)), newDisks));
      setPersistentDisks(_.filter((disk) => _.isUndefined(getDiskAppType(disk)), newDisks));
      const runtime = getCurrentRuntime(newRuntimes);
      setIsLoadingCloudEnvironments(false);
      reschedule(
        maybeStale ||
          ['Creating', 'Starting', 'Stopping', 'Updating', 'LeoReconfiguring'].includes(
            getConvertedRuntimeStatus(runtime) ?? ''
          )
          ? 10000
          : 120000
      );
    } catch (error) {
      reschedule(30000);
      throw error;
    }
  };
  const refreshRuntimes = withErrorReporting('Error loading cloud environments')(load);
  const refreshRuntimesSilently = withErrorIgnoring(load);
  useEffect(() => {
    if (
      workspace?.workspaceInitialized &&
      workspace.workspace.name === name &&
      workspace.workspace.namespace === namespace
    ) {
      refreshRuntimes();
    }
    return () => {
      clearTimeout(timeout.current);
      abort();
    };
    //  eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, namespace, workspace]);
  return { runtimes, refreshRuntimes, persistentDisks, appDataDisks, isLoadingCloudEnvironments };
};
