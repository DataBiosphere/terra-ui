import _ from 'lodash/fp';
import { ReactNode, useMemo } from 'react';
import { h, span } from 'react-hyperscript-helpers';
import { SimpleTabBar } from 'src/components/tabBars';
import * as Nav from 'src/libs/nav';
import { textMatch } from 'src/libs/utils';
import { getCloudProviderFromWorkspace, WorkspaceWrapper as Workspace } from 'src/libs/workspace-utils';

import { CatagorizedWorkspaces } from './CatagorizedWorkspaces';
import { NoContentMessage } from './NoWorkspacesMessage';
import { RenderedWorkspaces } from './RenderedWorkspaces';
import { workspaceSubmissionStatus } from './useWorkspacesWithSubmissionStats';
import { getWorkspaceFiltersFromQuery, WorkspaceFilterValues } from './WorkspaceFilters';

export interface WorkspaceTab {
  key: string;
  title: ReactNode;
  tableName: string;
}

interface WorkspacesListTabsProps {
  loadingSubmissionStats: boolean;
  loadingWorkspaces: boolean;
  workspaces: CatagorizedWorkspaces;
  refreshWorkspaces: () => void;
}

export const WorkspacesListTabs = (props: WorkspacesListTabsProps): ReactNode => {
  const { workspaces, loadingSubmissionStats, loadingWorkspaces } = props;
  const { query } = Nav.useRoute();
  const filters = getWorkspaceFiltersFromQuery(query);

  const filteredWorkspaces = useMemo(() => filterWorkspaces(workspaces, filters), [workspaces, filters]);

  const tabs: WorkspaceTab[] = _.map(
    (key: keyof CatagorizedWorkspaces) => ({
      key,
      title: span([_.upperCase(key), ` (${loadingWorkspaces ? '...' : workspaces[key].length})`]),
      tableName: _.lowerCase(key),
    }),
    ['myWorkspaces', 'newAndInteresting', 'featured', 'public']
  );

  return h(
    SimpleTabBar,
    {
      'aria-label': 'choose a workspace collection',
      value: filters.tab,
      onChange: (newTab) => {
        if (newTab === filters.tab) {
          props.refreshWorkspaces();
        } else {
          Nav.updateSearch({ ...query, tab: newTab === 'myWorkspaces' ? undefined : newTab });
        }
      },
      tabs,
    },
    [
      h(RenderedWorkspaces, {
        workspaces: filteredWorkspaces[filters.tab],
        label: _.lowerCase(filters.tab),
        loadingSubmissionStats,
        noContent: h(NoContentMessage, { workspaces, filters, loadingWorkspaces, loadingSubmissionStats }),
      }),
    ]
  );
};

const filterWorkspaces = (workspaces: CatagorizedWorkspaces, filters: WorkspaceFilterValues): CatagorizedWorkspaces => {
  const filterWorkspacesCategory = (workspaces: Workspace[], filters: WorkspaceFilterValues): Workspace[] => {
    const matches = (ws: Workspace): boolean => {
      const {
        workspace: { namespace, name, attributes },
      } = ws;
      const submissionStatus = workspaceSubmissionStatus(ws);
      return !!(
        textMatch(filters.nameFilter, `${namespace}/${name}`) &&
        (_.isEmpty(filters.accessLevels) || filters.accessLevels.includes(ws.accessLevel)) &&
        (_.isEmpty(filters.projects) || filters.projects === namespace) &&
        (_.isEmpty(filters.cloudPlatform) || getCloudProviderFromWorkspace(ws) === filters.cloudPlatform) &&
        (_.isEmpty(filters.submissions) || (submissionStatus && filters.submissions.includes(submissionStatus))) &&
        _.every((a) => _.includes(a, _.get(['tag:tags', 'items'], attributes)), filters.tags)
      );
    };
    return _.filter(matches, workspaces);
  };

  return {
    myWorkspaces: filterWorkspacesCategory(workspaces.myWorkspaces, filters),
    public: filterWorkspacesCategory(workspaces.public, filters),
    newAndInteresting: filterWorkspacesCategory(workspaces.newAndInteresting, filters),
    featured: filterWorkspacesCategory(workspaces.featured, filters),
  };
};
