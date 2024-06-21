import { h } from 'react-hyperscript-helpers';
import { withDisplayName } from 'src/libs/react-utils';
import { useWorkspaces } from 'src/workspaces/common/state/useWorkspaces';

export const withWorkspaces = (WrappedComponent) => {
  return withDisplayName('withWorkspaces', (props) => {
    const { workspaces, refresh, loading } = useWorkspaces();
    return h(WrappedComponent, {
      ...props,
      workspaces,
      loadingWorkspaces: loading,
      refreshWorkspaces: refresh,
    });
  });
};
