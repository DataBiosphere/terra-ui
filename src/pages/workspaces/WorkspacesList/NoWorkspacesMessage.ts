import _ from 'lodash/fp';
import { Fragment } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { NoWorkspacesMessage } from 'src/components/workspace-utils';
import { cond } from 'src/libs/utils';

import { CatagorizedWorkspaces } from './CatagorizedWorkspaces';
import { WorkspaceFilterValues } from './WorkspaceFilters';
import { updateWorkspaceActions } from './WorkspaceUserActions';

interface NoContentMessageProps {
  loadingWorkspaces: boolean;
  loadingSubmissionStats: boolean;
  workspaces: CatagorizedWorkspaces;
  filters: WorkspaceFilterValues;
}

export const NoContentMessage = (props: NoContentMessageProps): ReactNode => {
  const { loadingWorkspaces, loadingSubmissionStats, workspaces, filters } = props;
  return cond(
    [loadingWorkspaces, () => h(Fragment, ['Loading...'])],
    [
      _.isEmpty(workspaces.myWorkspaces) && filters.tab === 'myWorkspaces',
      () =>
        NoWorkspacesMessage({
          onClick: () => updateWorkspaceActions({ creatingNewWorkspace: true }),
        }),
    ],
    [!_.isEmpty(filters.submissions) && loadingSubmissionStats, () => h(Fragment, ['Loading submission statuses...'])],
    () => div({ style: { fontStyle: 'italic' } }, ['No matching workspaces'])
  );
};
