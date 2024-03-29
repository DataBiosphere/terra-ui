import _ from 'lodash/fp';
import { Fragment, ReactNode, useContext } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { cond } from 'src/libs/utils';
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

  return cond(
    [loadingWorkspaces, () => h(Fragment, ['Loading...'])],
    [
      _.isEmpty(workspaces.myWorkspaces) && filters.tab === 'myWorkspaces',
      () =>
        NoWorkspacesMessage({
          onClick: () => setUserActions({ creatingNewWorkspace: true }),
        }),
    ],
    () => div({ style: { fontStyle: 'italic' } }, ['No matching workspaces'])
  );
};
