import { useEffect } from 'react';
import { Ajax } from 'src/libs/ajax';
import { useLoadedData } from 'src/libs/ajax/loaded-data/useLoadedData';
import { useCancellation } from 'src/libs/react-utils';
import { exhaustiveGuard, renameKey } from 'src/libs/type-utils/type-helpers';
import { WorkspaceWrapper } from 'src/libs/workspace-utils';

export const useWorkspaceById = (workspaceId: string, fields?: string[]) => {
  const [workspace, loadWorkspace] = useLoadedData<WorkspaceWrapper>();

  const signal = useCancellation();
  useEffect(
    () => {
      loadWorkspace(() => Ajax(signal).Workspaces.getById(workspaceId, fields));
    },
    // Since fields is an array and will likely be defined inline (recreated on each render),
    // we can't use it directly in the dependencies list. Instead, using a joined list of the
    // fields provides the behavior we want, rerunning the effect when the fields change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loadWorkspace, signal, workspaceId, (fields || []).join(',')]
  );

  const { status } = workspace;
  switch (status) {
    case 'None':
      return { workspace: null, status: 'None' as const };
    case 'Loading':
      // useLoadedData keeps the previous state while loading new data.
      // When we're loading a different workspace, we don't want to return the previous workspace.
      return { workspace: null, status: 'Loading' as const };
    case 'Ready':
      return renameKey(workspace, 'state', 'workspace');
    case 'Error':
      return renameKey(workspace, 'state', 'workspace');
    default:
      return exhaustiveGuard(status);
  }
};
