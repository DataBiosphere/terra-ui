import _ from 'lodash/fp';
import * as qs from 'qs';
import React, { useState } from 'react';
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
 * Represents a list of method definitions grouped into two
 * categories — My Workflows and Public Workflows — corresponding
 * to the tabs above the workflows table.
 */
interface GroupedWorkflows {
  mine: MethodDefinition[];
  public: MethodDefinition[];
}

// This is based on the sort type from the FlexTable component
// When that component is converted to TypeScript, we should use its sort type
// instead
interface SortProperties {
  field: keyof MethodDefinition;
  direction: 'asc' | 'desc';
}

interface NewQueryParams {
  newTab?: string;
  newFilter?: string;
}

interface WorkflowTableHeaderProps {
  sort: SortProperties;
  field: string;
  onSort: React.Dispatch<React.SetStateAction<SortProperties>>;
  children: string;
}

/**
 * @param {WorkflowTableHeaderProps} props
 * @param {SortProperties} props.sort - the current sort properties of the table
 * @param {string} props.field - the field identifier of the header's column
 * (should match the sort field if this column is being sorted)
 * @param {React.Dispatch<React.SetStateAction<SortProperties>>} props.onSort -
 * called to update the sort properties if the header's column is selected for
 * sorting
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

interface WorkflowListProps {
  queryParams?: {
    tab?: string;
    filter?: string;
    [queryParam: string]: any;
  };
}

// TODO: add error handling, consider wrapping query updates in useEffect
export const WorkflowList = (props: WorkflowListProps) => {
  const { queryParams = {} } = props;
  const { tab = 'mine', filter = '', ...query } = queryParams;

  const signal: AbortSignal = useCancellation();
  const [workflows, setWorkflows] = useState<GroupedWorkflows>();

  // Valid direction values are 'asc' and 'desc' (based on expected
  // function signatures from the Sortable component used in this
  // component)
  const [sort, setSort] = useState<SortProperties>({ field: 'name', direction: 'asc' });

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
  const tabs = { mine: 'My Workflows', public: 'Public Workflows' };

  useOnMount(() => {
    const isMine = ({ public: isPublic, managers }: MethodDefinition): boolean =>
      !isPublic || _.includes(getTerraUser().email, managers);

    const loadWorkflows = async () => {
      const allWorkflows = await Ajax(signal).Methods.definitions();

      setWorkflows({
        mine: _.filter(isMine, allWorkflows),
        public: _.filter('public', allWorkflows),
      });
    };

    loadWorkflows();
  });

  const sortedWorkflows: MethodDefinition[] = _.flow<MethodDefinition[], MethodDefinition[], MethodDefinition[]>(
    _.filter(({ namespace, name }: MethodDefinition) => Utils.textMatch(filter, `${namespace}/${name}`)),
    _.orderBy(
      [({ [sort.field]: field }: MethodDefinition) => (field == null ? '' : _.lowerCase(field.toString()))],
      [sort.direction]
    )
  )(workflows?.[tabName]);

  return (
    <FooterWrapper>
      <TopBar title='Workflows' href=''>
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
      >
        {null /* nothing to display at the end of the tab bar */}
      </TabBar>
      <div role='main' style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }}>
          {workflows && (
            <AutoSizer>
              {({ width, height }) => (
                <FlexTable
                  aria-label={tabs[tabName]}
                  width={width}
                  height={height}
                  sort={sort as any /* necessary until FlexTable is converted to TS */}
                  rowCount={sortedWorkflows.length}
                  columns={getColumns(sort, setSort, sortedWorkflows)}
                  variant={null}
                  noContentMessage={null /* default message */}
                  tabIndex={-1}
                />
              )}
            </AutoSizer>
          )}
        </div>
      </div>
    </FooterWrapper>
  );
};

const getColumns = (
  sort: SortProperties,
  setSort: React.Dispatch<React.SetStateAction<SortProperties>>,
  sortedWorkflows: MethodDefinition[]
) => [
  // Note: 'field' values should be MethodDefinition property names for sorting
  // to work properly
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

      return <TooltipCell tooltip={null}>{synopsis}</TooltipCell>;
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

      return <TooltipCell tooltip={null}>{managers?.join(', ')}</TooltipCell>;
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
