import _ from 'lodash/fp';
import { Fragment, ReactNode, useContext } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { NoWorkspacesMessage } from 'src/components/workspace-utils';
import { cond } from 'src/libs/utils';
import { CategorizedWorkspaces } from 'src/workspaces/list/CategorizedWorkspaces';
import { WorkspaceFilterValues } from 'src/workspaces/list/WorkspaceFilters';
import { WorkspaceUserActionsContext } from 'src/workspaces/list/WorkspaceUserActions';

interface NoContentMessageProps {
  loadingWorkspaces: boolean;
  loadingSubmissionStats: boolean;
  workspaces: CategorizedWorkspaces;
  filters: WorkspaceFilterValues;
}

export const NoContentMessage = (props: NoContentMessageProps): ReactNode => {
  const { loadingWorkspaces, loadingSubmissionStats, workspaces, filters } = props;
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
    [!_.isEmpty(filters.submissions) && loadingSubmissionStats, () => h(Fragment, ['Loading submission statuses...'])],
    () => div({ style: { fontStyle: 'italic' } }, ['No matching workspaces'])
  );
};
