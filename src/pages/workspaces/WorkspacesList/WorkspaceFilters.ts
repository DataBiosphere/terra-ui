import _ from 'lodash/fp';
import { FC } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { Select } from 'src/components/common';
import { DelayedSearchInput } from 'src/components/input';
import { WorkspaceTagSelect } from 'src/components/workspace-utils';
import * as Nav from 'src/libs/nav';
import * as Utils from 'src/libs/utils';
import {
  cloudProviderLabels,
  cloudProviderTypes,
  workspaceAccessLevels,
  WorkspaceWrapper as Workspace,
} from 'src/libs/workspace-utils';

const styles = {
  filter: { marginRight: '1rem', flex: '1 1 0', minWidth: 'max-content' },
};

const EMPTY_LIST = [];
interface WorkspaceFiltersProps {
  workspaces: Workspace[];
}
// workspaces
export const WorkspaceFilters: FC<WorkspaceFiltersProps> = ({ workspaces }) => {
  const { query } = Nav.useRoute();
  const filter = query.filter || '';
  // Using the EMPTY_LIST constant as a default value instead of creating a new empty array on
  // each render avoids unnecessarily recomputing the memoized filteredWorkspaces value.
  const accessLevelsFilter = query.accessLevelsFilter || EMPTY_LIST;
  const projectsFilter = query.projectsFilter || undefined;
  const cloudPlatformFilter = query.cloudPlatform || undefined;
  const submissionsFilter = query.submissionsFilter || EMPTY_LIST;
  const tagsFilter = query.tagsFilter || EMPTY_LIST;

  return div({ style: { display: 'flex', margin: '1rem 0' } }, [
    div({ style: { ...styles.filter, flexGrow: 1.5 } }, [
      h(DelayedSearchInput, {
        placeholder: 'Search by keyword',
        'aria-label': 'Search workspaces by keyword',
        onChange: (newFilter) => Nav.updateSearch({ ...query, filter: newFilter || undefined }),
        value: filter,
      }),
    ]),
    div({ style: styles.filter }, [
      h(WorkspaceTagSelect, {
        isClearable: true,
        isMulti: true,
        formatCreateLabel: _.identity,
        value: _.map((tag) => ({ label: tag, value: tag }), tagsFilter),
        placeholder: 'Tags',
        'aria-label': 'Filter by tags',
        onChange: (data) => Nav.updateSearch({ ...query, tagsFilter: _.map('value', data) }),
      }),
    ]),
    div({ style: styles.filter }, [
      h(Select<string, true>, {
        isClearable: true,
        isMulti: true,
        isSearchable: false,
        placeholder: 'Access levels',
        'aria-label': 'Filter by access levels',
        value: accessLevelsFilter,
        onChange: (data) => Nav.updateSearch({ ...query, accessLevelsFilter: _.map('value', data) }),
        options: [...workspaceAccessLevels], // need to re-create the list otherwise the readonly type of workspaceAccessLevels conflicts with the type of options
        getOptionLabel: ({ value }) => Utils.normalizeLabel(value),
      }),
    ]),
    div({ style: styles.filter }, [
      h(Select<string, false>, {
        isClearable: true,
        isMulti: false,
        placeholder: 'Billing project',
        'aria-label': 'Filter by billing project',
        value: projectsFilter,
        hideSelectedOptions: true,
        onChange: (data) => Nav.updateSearch({ ...query, projectsFilter: data?.value || undefined }),
        options: _.flow(_.map('workspace.namespace'), _.uniq, _.sortBy(_.identity))(workspaces),
      }),
    ]),
    div({ style: styles.filter }, [
      h(Select<string, true>, {
        isClearable: true,
        isMulti: true,
        isSearchable: false,
        placeholder: 'Submission status',
        'aria-label': 'Filter by submission status',
        value: submissionsFilter,
        hideSelectedOptions: true,
        onChange: (data) => Nav.updateSearch({ ...query, submissionsFilter: _.map('value', data) }),
        options: ['running', 'success', 'failure'],
        getOptionLabel: ({ value }) => Utils.normalizeLabel(value),
      }),
    ]),
    div({ style: { ...styles.filter, marginRight: 0 } }, [
      h(Select<string>, {
        isClearable: true,
        isMulti: false,
        placeholder: 'Cloud platform',
        'aria-label': 'Filter by cloud platform',
        value: cloudPlatformFilter,
        hideSelectedOptions: true,
        onChange: (data) => Nav.updateSearch({ ...query, cloudPlatform: data?.value || undefined }),
        options: _.sortBy((cloudProvider) => cloudProviderLabels[cloudProvider], _.keys(cloudProviderTypes)),
        getOptionLabel: ({ value }) => cloudProviderLabels[value],
      }),
    ]),
  ]);
};
