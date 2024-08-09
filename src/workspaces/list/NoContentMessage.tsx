import React, { ReactNode, useContext } from 'react';
import { NoWorkspacesMessage } from 'src/workspaces/common/NoWorkspacesMessage';
import { CategorizedWorkspaces } from 'src/workspaces/list/CategorizedWorkspaces';
import { WorkspaceFilterValues } from 'src/workspaces/list/WorkspaceFilters';
import { WorkspaceUserActionsContext } from 'src/workspaces/list/WorkspaceUserActions';

interface NoContentMessageProps {
  loadingWorkspaces: boolean;
  workspaces: CategorizedWorkspaces;
  filters: WorkspaceFilterValues;
}

export const NoContentMessage = (props: NoContentMessageProps): ReactNode => {
  const { loadingWorkspaces, workspaces, filters } = props;
  const { setUserActions } = useContext(WorkspaceUserActionsContext);

  if (loadingWorkspaces) {
    return <> Loading... </>;
  }
  if (workspaces.myWorkspaces.length === 0 && filters.tab === 'myWorkspaces') {
    return <NoWorkspacesMessage onClick={() => setUserActions({ creatingNewWorkspace: true })} />;
  }
  return <div style={{ fontStyle: 'italic' }}> No matching workspaces</div>;
};
