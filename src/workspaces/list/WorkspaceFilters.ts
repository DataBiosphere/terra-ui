import _ from 'lodash/fp';
import { ReactNode, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { CloudPlatform } from 'src/billing-core/models';
import { Select } from 'src/components/common';
import { DelayedSearchInput } from 'src/components/input';
import { Ajax } from 'src/libs/ajax';
import Events from 'src/libs/events';
import * as Nav from 'src/libs/nav';
import { useInstance } from 'src/libs/react-utils';
import * as Utils from 'src/libs/utils';
import { WorkspaceTagSelect } from 'src/workspaces/common/WorkspaceTagSelect';
import { CategorizedWorkspaces } from 'src/workspaces/list/CategorizedWorkspaces';
import {
  cloudProviderLabels,
  cloudProviderTypes,
  workspaceAccessLevels,
  WorkspaceWrapper as Workspace,
} from 'src/workspaces/utils';

const styles = {
  filter: { marginRight: '1rem', flex: '1 1 0', minWidth: 'max-content' },
};

const EMPTY_LIST = [];
interface WorkspaceFiltersProps {
  workspaces: Workspace[];
}

export const WorkspaceFilters = (props: WorkspaceFiltersProps): ReactNode => {
  const { workspaces } = props;
  const { query } = Nav.useRoute();
  const filters = getWorkspaceFiltersFromQuery(query);

  let keywordLastEvented = useInstance(() => filters.keywordFilter);
  const [lastKeywordSearched, setLastKeywordSearched] = useState(keywordLastEvented);

  return div({ style: { display: 'flex', margin: '1rem 0' } }, [
    div({ style: { ...styles.filter, flexGrow: 1.5 } }, [
      h(DelayedSearchInput, {
        placeholder: 'Search by name or project',
        'aria-label': 'Search workspaces by name or project',
        onChange: (newFilter) => {
          // Store in a state variable to make unit testing possible (as opposed to onBlur comparing the current
          // value to what exists in filters.nameFilter).
          setLastKeywordSearched(newFilter);
          Nav.updateSearch({ ...query, filter: newFilter || undefined });
        },
        onBlur: (_) => {
          if (keywordLastEvented !== lastKeywordSearched) {
            keywordLastEvented = lastKeywordSearched;
            Ajax().Metrics.captureEvent(Events.workspaceListFilter, { filter: 'keyword', option: keywordLastEvented });
          }
        },
        value: filters.keywordFilter,
      }),
    ]),
    div({ style: styles.filter }, [
      h(WorkspaceTagSelect, {
        isClearable: true,
        isMulti: true,
        formatCreateLabel: _.identity,
        value: _.map((tag) => ({ label: tag, value: tag }), filters.tags),
        placeholder: 'Tags',
        'aria-label': 'Filter by tags',
        onChange: (data) => {
          const option = _.map('value', data);
          Ajax().Metrics.captureEvent(Events.workspaceListFilter, { filter: 'tags', option });
          Nav.updateSearch({ ...query, tagsFilter: option });
        },
      }),
    ]),
    div({ style: styles.filter }, [
      h(Select<string, true>, {
        isClearable: true,
        isMulti: true,
        isSearchable: false,
        placeholder: 'Access levels',
        'aria-label': 'Filter by access levels',
        value: filters.accessLevels,
        onChange: (data) => {
          const option = _.map('value', data);
          Ajax().Metrics.captureEvent(Events.workspaceListFilter, { filter: 'access', option });
          Nav.updateSearch({ ...query, accessLevelsFilter: option });
        },
        options: [...workspaceAccessLevels], // need to re-create the list otherwise the readonly type of workspaceAccessLevels conflicts with the type of options
        getOptionLabel: ({ value }) => Utils.normalizeLabel(value),
      }),
    ]),
    div({ style: styles.filter }, [
      h(Select<string | undefined, false>, {
        isClearable: true,
        isMulti: false,
        placeholder: 'Billing project',
        'aria-label': 'Filter by billing project',
        value: filters.projects,
        hideSelectedOptions: true,
        onChange: (data) => {
          const option = data?.value || undefined;
          Ajax().Metrics.captureEvent(Events.workspaceListFilter, { filter: 'billingProject', option });
          Nav.updateSearch({ ...query, projectsFilter: option });
        },
        options: _.flow(_.map('workspace.namespace'), _.uniq, _.sortBy(_.identity))(workspaces),
      }),
    ]),
    div({ style: { ...styles.filter, marginRight: 0 } }, [
      h(Select<string | undefined>, {
        isClearable: true,
        isMulti: false,
        placeholder: 'Cloud platform',
        'aria-label': 'Filter by cloud platform',
        value: filters.cloudPlatform,
        hideSelectedOptions: true,
        onChange: (data) => {
          const option = data?.value || undefined;
          Ajax().Metrics.captureEvent(Events.workspaceListFilter, { filter: 'cloudPlatform', option });
          Nav.updateSearch({ ...query, cloudPlatform: option });
        },
        options: _.sortBy((cloudProvider) => cloudProviderLabels[cloudProvider], _.keys(cloudProviderTypes)),
        getOptionLabel: ({ value }) => (value ? cloudProviderLabels[value] : undefined),
      }),
    ]),
  ]);
};

export interface WorkspaceFilterValues {
  keywordFilter: string;
  accessLevels: string[];
  projects?: string;
  cloudPlatform?: CloudPlatform;
  tab: keyof CategorizedWorkspaces;
  tags: string[];
}

export const getWorkspaceFiltersFromQuery = (query: any): WorkspaceFilterValues => ({
  keywordFilter: query.filter || '',
  accessLevels: query.accessLevelsFilter || EMPTY_LIST,
  projects: query.projectsFilter || undefined,
  cloudPlatform: query.cloudPlatform || undefined,
  tab: query.tab || 'myWorkspaces',
  tags: query.tagsFilter || EMPTY_LIST,
});
