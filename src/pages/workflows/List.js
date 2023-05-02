import _ from 'lodash/fp';
import * as qs from 'qs';
import { useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { AutoSizer } from 'react-virtualized';
import { Link } from 'src/components/common';
import FooterWrapper from 'src/components/FooterWrapper';
import { DelayedSearchInput } from 'src/components/input';
import { TabBar } from 'src/components/tabBars';
import { FlexTable, HeaderCell, Sortable, TooltipCell } from 'src/components/table';
import TopBar from 'src/components/TopBar';
import { Ajax } from 'src/libs/ajax';
import * as Nav from 'src/libs/nav';
import { useCancellation, useOnMount } from 'src/libs/react-utils';
import { getUser } from 'src/libs/state';
import * as Utils from 'src/libs/utils';

// TODO: add error handling, consider wrapping query updates in useEffect
const WorkflowList = ({ queryParams: { tab, filter = '', ...query } }) => {
  const signal = useCancellation();
  const [sort, setSort] = useState({ field: 'name', direction: 'asc' });
  const [workflows, setWorkflows] = useState();

  const getTabQueryName = (newTab) => (newTab === 'mine' ? undefined : newTab);

  const getUpdatedQuery = ({ newTab = tab, newFilter = filter }) => {
    // Note: setting undefined so that falsy values don't show up at all
    return qs.stringify({ ...query, tab: getTabQueryName(newTab), filter: newFilter || undefined }, { addQueryPrefix: true });
  };

  const updateQuery = (newParams) => {
    const newSearch = getUpdatedQuery(newParams);

    if (newSearch !== Nav.history.location.search) {
      Nav.history.replace({ search: newSearch });
    }
  };

  const tabName = tab || 'mine';
  const tabs = { mine: 'My Workflows', public: 'Public Workflows', featured: 'Featured Workflows' };

  useOnMount(() => {
    const isMine = ({ public: isPublic, managers }) => !isPublic || _.includes(getUser().email, managers);

    const loadWorkflows = async () => {
      const [allWorkflows, featuredList] = await Promise.all([Ajax(signal).Methods.definitions(), Ajax(signal).FirecloudBucket.getFeaturedMethods()]);

      setWorkflows({
        mine: _.filter(isMine, allWorkflows),
        featured: _.flow(
          _.map((featuredWf) => _.find(featuredWf, allWorkflows)),
          _.compact
        )(featuredList),
        public: _.filter('public', allWorkflows),
      });
    };

    loadWorkflows();
  });

  const sortedWorkflows = _.flow(
    _.filter(({ namespace, name }) => Utils.textMatch(filter, `${namespace}/${name}`)),
    _.orderBy([({ [sort.field]: field }) => _.lowerCase(field)], [sort.direction])
  )(workflows?.[tabName]);

  return h(FooterWrapper, [
    h(TopBar, { title: 'Workflows' }, [
      h(DelayedSearchInput, {
        style: { marginLeft: '2rem', width: 500 },
        placeholder: 'SEARCH WORKFLOWS',
        'aria-label': 'Search workflows',
        onChange: (val) => updateQuery({ newFilter: val }),
        value: filter,
      }),
    ]),
    h(TabBar, {
      'aria-label': 'workflows menu',
      activeTab: tabName,
      tabNames: Object.keys(tabs),
      displayNames: tabs,
      getHref: (currentTab) => `${Nav.getLink('workflows')}${getUpdatedQuery({ newTab: currentTab })}`,
      getOnClick: (currentTab) => (e) => {
        e.preventDefault();
        updateQuery({ newTab: currentTab });
      },
    }),
    div({ role: 'main', style: { padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' } }, [
      div({ style: { flex: 1 } }, [
        workflows &&
          h(AutoSizer, [
            ({ width, height }) =>
              h(FlexTable, {
                'aria-label': tabs[tabName],
                width,
                height,
                sort,
                rowCount: sortedWorkflows.length,
                columns: [
                  {
                    field: 'name',
                    headerRenderer: () => h(Sortable, { sort, field: 'name', onSort: setSort }, [h(HeaderCell, ['Workflow'])]),
                    cellRenderer: ({ rowIndex }) => {
                      const { namespace, name } = sortedWorkflows[rowIndex];

                      return h(TooltipCell, { tooltip: `${namespace}/${name}` }, [
                        div({ style: { fontSize: 12 } }, [namespace]),
                        h(Link, { style: { fontWeight: 600 }, href: Nav.getLink('workflow-dashboard', { namespace, name }) }, [name]),
                      ]);
                    },
                    size: { basis: 300 },
                  },
                  {
                    field: 'synopsis',
                    headerRenderer: () => h(Sortable, { sort, field: 'synopsis', onSort: setSort }, [h(HeaderCell, ['Synopsis'])]),
                    cellRenderer: ({ rowIndex }) => {
                      const { synopsis } = sortedWorkflows[rowIndex];

                      return h(TooltipCell, [synopsis]);
                    },
                    size: { basis: 475 },
                  },
                  {
                    field: 'managers',
                    headerRenderer: () => h(Sortable, { sort, field: 'managers', onSort: setSort }, [h(HeaderCell, ['Owners'])]),
                    cellRenderer: ({ rowIndex }) => {
                      const { managers } = sortedWorkflows[rowIndex];

                      return h(TooltipCell, [managers?.join(', ')]);
                    },
                    size: { basis: 225 },
                  },
                  {
                    field: 'numSnapshots',
                    headerRenderer: () => h(Sortable, { sort, field: 'numSnapshots', onSort: setSort }, [h(HeaderCell, ['Snapshots'])]),
                    cellRenderer: ({ rowIndex }) => {
                      const { numSnapshots } = sortedWorkflows[rowIndex];

                      return div({ style: { textAlign: 'end', flex: 1 } }, [numSnapshots]);
                    },
                    size: { basis: 108, grow: 0, shrink: 0 },
                  },
                  {
                    field: 'numConfigurations',
                    headerRenderer: () => h(Sortable, { sort, field: 'numConfigurations', onSort: setSort }, [h(HeaderCell, ['Configurations'])]),
                    cellRenderer: ({ rowIndex }) => {
                      const { numConfigurations } = sortedWorkflows[rowIndex];

                      return div({ style: { textAlign: 'end', flex: 1 } }, [numConfigurations]);
                    },
                    size: { basis: 145, grow: 0, shrink: 0 },
                  },
                ],
              }),
          ]),
      ]),
    ]),
  ]);
};

export const navPaths = [
  {
    name: 'workflows',
    path: '/workflows',
    component: WorkflowList,
    title: 'Workflows',
  },
];
