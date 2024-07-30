import _ from 'lodash/fp';
import * as qs from 'qs';
import { useState } from 'react';
import React from 'react';
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
import { getTerraUser } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { MethodDefinition } from 'src/pages/workflows/workflow-utils';

/**
 * Represents a list of method definitions grouped into 3
 * categories: My Workflows, Public Workflows, and
 * Featured Workflows.
 */
interface GroupedWorkflows {
  mine: MethodDefinition[];
  featured: MethodDefinition[];
  public: MethodDefinition[];
}

interface NewQueryParams {
  newTab?: string;
  newFilter?: string;
}

interface WorkflowTableHeaderProps {
  sort;
  field: string;
  onSort;
  children: string;
}

/**
 * @param {WorkflowTableHeaderProps} props
 * @param props.sort - the current sort properties of the table
 * @param {string} props.field - the field identifier of the header's column
 * (should match the sort field if this column is being sorted)
 * @param props.onSort - the function to be called with the new sort properties
 * if the header's column is selected for sorting
 * @param {string} props.children - the text to display in the header cell
 */
const WorkflowTableHeader = (props: WorkflowTableHeaderProps) => {
  const { sort, field, onSort, children: text } = props;

  return (
    <Sortable sort={sort} field={field} onSort={onSort}>
      <HeaderCell>{text}</HeaderCell>
    </Sortable>
  );
};

// TODO: add error handling, consider wrapping query updates in useEffect
const WorkflowList = ({ queryParams: { tab, filter = '', ...query } }) => {
  const signal: AbortSignal = useCancellation();
  const [workflows, setWorkflows] = useState<GroupedWorkflows>();

  // Valid direction values are 'asc' and 'desc' (based on expected
  // function signatures from the Sortable component used in this
  // component)
  const [sort, setSort] = useState({ field: 'name', direction: 'asc' });

  const getTabQueryName = (newTab: string | undefined): string | undefined => (newTab === 'mine' ? undefined : newTab);

  const getUpdatedQuery = ({ newTab = tab, newFilter = filter }: NewQueryParams): string => {
    // Note: setting undefined so that falsy values don't show up at all
    return qs.stringify(
      { ...query, tab: getTabQueryName(newTab), filter: newFilter || undefined },
      { addQueryPrefix: true }
    );
  };

  const updateQuery = (newParams: NewQueryParams): void => {
    const newSearch: string = getUpdatedQuery(newParams);

    if (newSearch !== Nav.history.location.search) {
      Nav.history.replace({ search: newSearch });
    }
  };

  const tabName: string = tab || 'mine';
  const tabs = { mine: 'My Workflows', public: 'Public Workflows', featured: 'Featured Workflows' };

  useOnMount(() => {
    const isMine = ({ public: isPublic, managers }: MethodDefinition): boolean =>
      !isPublic || _.includes(getTerraUser().email, managers);

    const loadWorkflows = async () => {
      const [allWorkflows, featuredList] = await Promise.all([
        Ajax(signal).Methods.definitions(),
        Ajax(signal).FirecloudBucket.getFeaturedMethods(),
      ]);

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

  return (
    <FooterWrapper>
      <TopBar title='Workflows'>
        <DelayedSearchInput
          style={{ marginLeft: '2rem', width: 500 }}
          placeholder='SEARCH WORKFLOWS'
          aria-label='Search workflows'
          onChange={(val) => updateQuery({ newFilter: val })}
          value={filter}
        />
      </TopBar>
      <TabBar
        aria-label='workflows menu'
        activeTab={tabName}
        tabNames={Object.keys(tabs)}
        displayNames={tabs}
        getHref={(currentTab) => `${Nav.getLink('workflows')}${getUpdatedQuery({ newTab: currentTab })}`}
        getOnClick={(currentTab) => (e) => {
          e.preventDefault();
          updateQuery({ newTab: currentTab });
        }}
      />
      <div role='main' style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }}>
          {workflows && (
            <AutoSizer>
              {({ width, height }) => (
                <FlexTable
                  aria-label={tabs[tabName]}
                  width={width}
                  height={height}
                  sort={sort}
                  rowCount={sortedWorkflows.length}
                  columns={getColumns(sort, setSort, sortedWorkflows)}
                />
              )}
            </AutoSizer>
          )}
        </div>
      </div>
    </FooterWrapper>
  );
};

const getColumns = (sort, setSort, sortedWorkflows) => [
  {
    field: 'name',
    headerRenderer: () => (
      <WorkflowTableHeader sort={sort} field='name' onSort={setSort}>
        Workflow
      </WorkflowTableHeader>
    ),
    cellRenderer: ({ rowIndex }) => {
      const { namespace, name } = sortedWorkflows[rowIndex];

      return (
        <TooltipCell tooltip={`${namespace}/${name}`}>
          <div style={{ fontSize: 12 }}>{namespace}</div>
          <Link style={{ fontWeight: 600 }} href={Nav.getLink('workflow-dashboard', { namespace, name })}>
            {name}
          </Link>
        </TooltipCell>
      );
    },
    size: { basis: 300 },
  },
  {
    field: 'synopsis',
    headerRenderer: () => (
      <WorkflowTableHeader sort={sort} field='synopsis' onSort={setSort}>
        Synopsis
      </WorkflowTableHeader>
    ),
    cellRenderer: ({ rowIndex }) => {
      const { synopsis } = sortedWorkflows[rowIndex];

      return <TooltipCell>{synopsis}</TooltipCell>;
    },
    size: { basis: 475 },
  },
  {
    field: 'managers',
    headerRenderer: () => (
      <WorkflowTableHeader sort={sort} field='managers' onSort={setSort}>
        Owners
      </WorkflowTableHeader>
    ),
    cellRenderer: ({ rowIndex }) => {
      const { managers } = sortedWorkflows[rowIndex];

      return <TooltipCell>{managers?.join(', ')}</TooltipCell>;
    },
    size: { basis: 225 },
  },
  {
    field: 'numSnapshots',
    headerRenderer: () => (
      <WorkflowTableHeader sort={sort} field='numSnapshots' onSort={setSort}>
        Snapshots
      </WorkflowTableHeader>
    ),
    cellRenderer: ({ rowIndex }) => {
      const { numSnapshots } = sortedWorkflows[rowIndex];

      return <div style={{ textAlign: 'end', flex: 1 }}>{numSnapshots}</div>;
    },
    size: { basis: 108, grow: 0, shrink: 0 },
  },
  {
    field: 'numConfigurations',
    headerRenderer: () => (
      <WorkflowTableHeader sort={sort} field='numConfigurations' onSort={setSort}>
        Configurations
      </WorkflowTableHeader>
    ),
    cellRenderer: ({ rowIndex }) => {
      const { numConfigurations } = sortedWorkflows[rowIndex];

      return <div style={{ textAlign: 'end', flex: 1 }}>{numConfigurations}</div>;
    },
    size: { basis: 145, grow: 0, shrink: 0 },
  },
];

export const navPaths = [
  {
    name: 'workflows',
    path: '/workflows',
    component: WorkflowList,
    title: 'Workflows',
  },
];
