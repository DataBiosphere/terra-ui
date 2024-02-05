import _ from 'lodash/fp';
import { useState } from 'react';
import { Ajax } from 'src/libs/ajax';
import { withErrorReporting } from 'src/libs/error';
import { useCancellation, useOnMount } from 'src/libs/react-utils';
import * as Utils from 'src/libs/utils';

export const useWorkspaceDetails = ({ namespace, name }, fields) => {
  const [workspace, setWorkspace] = useState();

  const [loading, setLoading] = useState(true);
  const signal = useCancellation();

  const refresh = _.flow(
    withErrorReporting('Error loading workspace details'),
    Utils.withBusyState(setLoading)
  )(async () => {
    const ws = await Ajax(signal).Workspaces.workspace(namespace, name).details(fields);
    setWorkspace(ws);
  });

  useOnMount(() => {
    refresh();
  }, []);

  return { workspace, refresh, loading };
};
