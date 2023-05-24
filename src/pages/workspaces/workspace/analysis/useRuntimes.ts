import _ from 'lodash/fp';
import { useEffect, useState } from 'react';
import { h } from 'react-hyperscript-helpers';
import { Runtimes } from 'src/libs/ajax/leonardo/Runtimes';
import { withErrorReporting } from 'src/libs/error';
import { useCancellation, useStore, withDisplayName } from 'src/libs/react-utils';
import { runtimesStore } from 'src/libs/state';
import * as Utils from 'src/libs/utils';

export const useRuntimes = () => {
  const signal = useCancellation();
  const defaultListArgs = { role: 'creator', includeLabels: 'saturnWorkspaceNamespace,saturnWorkspaceName' };
  const [listArgs, setListArgs] = useState(defaultListArgs);
  const [loading, setLoading] = useState(false);
  const runtimes = useStore(runtimesStore);
  const refresh = _.flow(
    withErrorReporting('Error loading runtimes list'),
    Utils.withBusyState(setLoading)
  )(async () => {
    const runtimes = await Runtimes(signal).listV2(listArgs);
    runtimesStore.set(runtimes);
  });
  useEffect(() => {
    refresh();
  }, [listArgs, refresh]);
  return { runtimes, refresh, loading, setListArgs };
};

export const withRuntimes = (WrappedComponent) => {
  return withDisplayName('withWorkspaces', (props) => {
    const { runtimes, refresh, loading } = useRuntimes();
    return h(WrappedComponent, {
      ...props,
      runtimes,
      loadingWorkspaces: loading,
      refreshWorkspaces: refresh,
    });
  });
};
