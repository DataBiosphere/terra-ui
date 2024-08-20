import { icon, TooltipTrigger, useStore } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { Fragment, useEffect, useRef, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { AutoSizer } from 'react-virtualized';
import * as breadcrumbs from 'src/components/breadcrumbs';
import { Link } from 'src/components/common';
import { centeredSpinner } from 'src/components/icons';
import { DelayedSearchInput } from 'src/components/input';
import { GridTable, HeaderCell, Resizable } from 'src/components/table';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import { forwardRefWithName, useCancellation, useOnMount } from 'src/libs/react-utils';
import { snapshotStore } from 'src/libs/state';
import { wrapWorkflows } from 'src/pages/workflows/workflow/WorkflowWrapper';

type MethodRepoMethod = {
  methodName: string;
  methodNamespace: string;
  methodVersion: number;
};

type Config = {
  createDate: string;
  entityType: string;
  name: string;
  namespace: string;
  payloadObject: {
    deleted: boolean;
    inputs: {};
    methodConfigVersion: number;
    methodRepoMethod: MethodRepoMethod;
    name: string;
    namespace: string;
    outputs: {};
    prerequisites: {};
    rootEntityType: string;
  };
  snapshotId: number;
  url: string;
};

const getFilteredConfigs = ({ allConfigs, filterWord }) => {
  const lowerCaseFilter = filterWord.toLocaleLowerCase();
  const keys = ['name', 'namespace', 'snapshotId'];
  return allConfigs?.filter((config) =>
    keys.some((key) => config[key].toString().toLowerCase().includes(lowerCaseFilter))
  );
};

const Filter = ({ searchFilter, setSearchFilter }) => {
  return h(DelayedSearchInput, {
    style: { marginLeft: '1rem', marginTop: '1rem', width: 205 },
    value: searchFilter,
    onChange: setSearchFilter,
    'aria-label': 'Search configurations',
    placeholder: 'Search Configurations',
  });
};

export const BaseWorkflowConfigs = () => {
  const signal = useCancellation();
  const { namespace, name, snapshotId } = useStore(snapshotStore);
  const [allConfigs, setAllConfigs] = useState<Config[]>([]);
  const [snapshotConfigs, setSnapshotConfigs] = useState();
  const [configTableColumnWidths, setConfigTableColumnWidths] = useState({});
  const [searchFilter, setSearchFilter] = useState('');
  const resizeColumn = (currentWidth, delta, columnKey) => {
    setConfigTableColumnWidths(_.set(columnKey, currentWidth + delta));
  };
  const withConfigTableName = (columnName) => `${columnName}`;
  const configTableRef = useRef<{ recomputeColumnSizes: () => void }>(null);

  useOnMount(() => {
    const loadConfigs = async () => {
      const [allConfigs, snapshotConfigs] = await Promise.all([
        Ajax(signal).Methods.method(namespace, name, snapshotId).allConfigs(),
        Ajax(signal).Methods.method(namespace, name, snapshotId).configs(),
      ]);

      setAllConfigs(allConfigs);
      setSnapshotConfigs(snapshotConfigs);
    };

    loadConfigs();
  });

  const filteredConfigs = getFilteredConfigs({ allConfigs, filterWord: searchFilter });
  useEffect(() => {
    configTableRef.current?.recomputeColumnSizes();
  }, [configTableColumnWidths]);

  return h(Fragment, {}, [
    h(Filter, { searchFilter, setSearchFilter }),
    div({ style: { flex: 1, padding: '1rem' }, role: 'tabpanel' }, [
      !allConfigs
        ? centeredSpinner()
        : h(AutoSizer, { disableHeight: true }, [
            ({ width }) =>
              h(GridTable, {
                ref: configTableRef,
                width,
                height: (1 + allConfigs.length) * 48,
                'aria-label': 'workflow configuration',
                rowCount: filteredConfigs?.length,
                numFixedColumns: 1,
                columns: [
                  {
                    width: 50,
                    headerRenderer: () => div({ className: 'sr-only' }, ['Warnings']),
                    cellRenderer: ({ rowIndex }) => {
                      const config = allConfigs[rowIndex];

                      return (
                        !_.find(_.isEqual(config), snapshotConfigs) &&
                        h(
                          TooltipTrigger,
                          {
                            content: `This configuration is not fully compatible with snapshot ${snapshotId}`,
                          },
                          [icon('warning-standard', { style: { color: colors.warning() } })]
                        )
                      );
                    },
                    size: { basis: 45, grow: 0, shrink: 0 },
                  },
                  {
                    field: 'configurations',
                    width: configTableColumnWidths[withConfigTableName('configurations')] || 600,
                    headerRenderer: () => {
                      const columnWidth = configTableColumnWidths[withConfigTableName('configurations')] || 600;
                      return h(
                        Resizable,
                        {
                          width: columnWidth,
                          onWidthChange: (delta) =>
                            resizeColumn(columnWidth, delta, withConfigTableName('configurations')),
                        },
                        [h(HeaderCell, ['Configuration'])]
                      );
                    },
                    cellRenderer: ({ rowIndex }) => {
                      const { namespace, name, snapshotId } = filteredConfigs[rowIndex];
                      return h(Link, [`${namespace}/${name} Snapshot ID: ${snapshotId}`]);
                    },
                  },
                  {
                    field: 'workflow_snapshot',
                    width: configTableColumnWidths[withConfigTableName('workflow_snapshot')] || 600,
                    headerRenderer: () => {
                      const columnWidth = configTableColumnWidths[withConfigTableName('workflow_snapshot')] || 600;
                      return h(
                        Resizable,
                        {
                          width: columnWidth,
                          onWidthChange: (delta) =>
                            resizeColumn(columnWidth, delta, withConfigTableName('workflow_snapshot')),
                        },
                        [h(HeaderCell, ['Workflow Snapshot'])]
                      );
                    },
                    cellRenderer: ({ rowIndex }) => {
                      const {
                        payloadObject: {
                          methodRepoMethod: { methodVersion },
                        },
                      } = allConfigs[rowIndex];

                      return methodVersion;
                    },
                  },
                ],
              }),
          ]),
    ]),
  ]);
};

export const WorkflowConfigs = _.flow(
  forwardRefWithName('WorkflowConfig'),
  wrapWorkflows({
    breadcrumbs: () => breadcrumbs.commonPaths.workflowList(),
    title: 'Workflows',
    activeTab: 'configs',
  })
)(() => {
  return h(BaseWorkflowConfigs);
});

export const navPaths = [
  {
    name: 'workflow-configs',
    path: '/workflows/:namespace/:name/:snapshotId/configs',
    component: (props) => h(WorkflowConfigs, { ...props, tabName: 'configs' }),
    title: ({ name }) => `${name} - Configurations`,
  },
];
