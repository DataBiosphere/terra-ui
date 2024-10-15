import _ from 'lodash/fp';
import { useState } from 'react';
import { Workspaces } from 'src/libs/ajax/workspaces/Workspaces';
import { withErrorReporting } from 'src/libs/error';
import { useCancellation, useOnMount } from 'src/libs/react-utils';
import * as Utils from 'src/libs/utils';
import { WorkspaceWrapper as Workspace } from 'src/workspaces/utils';

export const useWorkspaceDetails = (workspaceName: { namespace: string; name: string }, fields: string[]) => {
  const { namespace, name } = workspaceName;

  const [workspace, setWorkspace] = useState<Workspace>();

  const [loading, setLoading] = useState(true);
  const signal = useCancellation();

  const refresh = _.flow(
    withErrorReporting('Error loading workspace details'),
    Utils.withBusyState(setLoading)
  )(async () => {
    const ws: Workspace = await Workspaces(signal).workspace(namespace, name).details(fields);
    setWorkspace(ws);
  });

  useOnMount(() => {
    refresh();
  });

  return { workspace, refresh, loading };
};
