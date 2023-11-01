import _ from 'lodash/fp';
import { useEffect, useRef, useState } from 'react';
import { getDiskAppType } from 'src/analysis/utils/app-utils';
import { getConvertedRuntimeStatus, getCurrentRuntime } from 'src/analysis/utils/runtime-utils';
import { Ajax } from 'src/libs/ajax';
import { PersistentDisk } from 'src/libs/ajax/leonardo/models/disk-models';
import { ListRuntimeItem } from 'src/libs/ajax/leonardo/models/runtime-models';
import { withErrorIgnoring, withErrorReporting } from 'src/libs/error';
import { useCancellation } from 'src/libs/react-utils';
import { InitializedWorkspaceWrapper as Workspace } from 'src/pages/workspaces/workspace/useWorkspace';

export interface CloudEnvironmentDetails {
  runtimes?: ListRuntimeItem[];
  refreshRuntimes: (maybeStale?: boolean) => Promise<void>;
  persistentDisks?: PersistentDisk[];
  appDataDisks?: PersistentDisk[];
}

export const useCloudEnvironmentPolling = (workspace: Workspace): CloudEnvironmentDetails => {
  const signal = useCancellation();
  const timeout = useRef<NodeJS.Timeout>();
  const [runtimes, setRuntimes] = useState<ListRuntimeItem[]>();
  const [persistentDisks, setPersistentDisks] = useState<PersistentDisk[]>();
  const [appDataDisks, setAppDataDisks] = useState<PersistentDisk[]>();

  const saturnWorkspaceNamespace = workspace?.workspace.namespace;
  const saturnWorkspaceName = workspace?.workspace.name;

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
      });

      // Disks.list API takes includeLabels to specify which labels to return in the response
      // Runtimes.listV2 API always returns all labels for a runtime
      const [newDisks, newRuntimes] = workspace
        ? await Promise.all([
            Ajax(signal)
              .Disks.disksV1()
              .list({
                ...cloudEnvFilters,
                includeLabels: 'saturnApplication,saturnWorkspaceName,saturnWorkspaceNamespace',
              }),
            Ajax(signal).Runtimes.listV2(cloudEnvFilters),
          ])
        : [[], []];

      setRuntimes(newRuntimes);
      setAppDataDisks(_.remove((disk) => _.isUndefined(getDiskAppType(disk)), newDisks));
      setPersistentDisks(_.filter((disk) => _.isUndefined(getDiskAppType(disk)), newDisks));
      const runtime = getCurrentRuntime(newRuntimes);
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
  const refreshRuntimes = withErrorReporting('Error loading cloud environments', load) as (
    maybeStale?: boolean
  ) => Promise<void>;
  const refreshRuntimesSilently = withErrorIgnoring(load);
  useEffect(() => {
    refreshRuntimes();
    return () => clearTimeout(timeout.current);
    //  eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace]);
  return { runtimes, refreshRuntimes, persistentDisks, appDataDisks };
};
