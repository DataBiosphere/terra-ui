import _ from 'lodash/fp';
import { useCallback, useMemo, useRef, useState } from 'react';
import { div, h, h3, span } from 'react-hyperscript-helpers';
import { AutoSizer } from 'react-virtualized';
import { ClipboardButton } from 'src/components/ClipboardButton';
import { ButtonPrimary, Link, Select } from 'src/components/common';
import { icon } from 'src/components/icons';
import { collapseStatus } from 'src/components/job-common';
import Modal from 'src/components/Modal';
import { FlexTable, paginator, Sortable, tableHeight, TextCell } from 'src/components/table';
import colors from 'src/libs/colors';
import * as Nav from 'src/libs/nav';
import { notify } from 'src/libs/notifications';
import { useCancellation, useOnMount } from 'src/libs/react-utils';
import { AppProxyUrlStatus } from 'src/libs/state';
import { customFormatDuration, differenceFromNowInSeconds } from 'src/libs/utils';
import { statusType } from 'src/workflows-app/components/job-common';
import {
  fetchMetadata,
  makeStatusLine,
  parseMethodString,
  WorkflowMetadata,
} from 'src/workflows-app/utils/submission-utils';

import { loadAppUrls } from '../utils/app-utils';

type Run = {
  duration: number;
  engine_id: string | undefined;
  last_modified_timestamp: Date;
  last_polled_timestamp: Date;
  record_id: string;
  run_id: string;
  run_set_id: string;
  state: string;
  submission_date: Date;
  workflow_outputs: string;
  workflow_params: string;
  workflow_url: string;
  error_messages: string | undefined;
};

type FilterableWorkflowTableProps = {
  runsData: Run[];
  runsFullyUpdated: boolean;
  namespace: string;
  submissionId: string;
  workspaceName: string;
  workspaceId: string;
  setShowLog: (showLog: boolean) => boolean;
  setLogsModalTitle: (modalTitle: string) => boolean;
  setLogsArray: (logsArray: string[]) => boolean;
  setTaskDataTitle: (dataTitle: string) => boolean;
  setTaskDataJson: (data: string[]) => boolean;
  setShowTaskData: (showData: boolean) => boolean;
};

const FilterableWorkflowTable = ({
  runsData,
  runsFullyUpdated,
  namespace,
  submissionId,
  workspaceName,
  workspaceId,
  setShowLog,
  setLogsModalTitle,
  setLogsArray,
  setTaskDataTitle,
  setTaskDataJson,
  setShowTaskData,
}: FilterableWorkflowTableProps) => {
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [filterOption, setFilterOption] = useState<string>();
  const [pageNumber, setPageNumber] = useState(1);
  const [sort, setSort] = useState({ field: 'duration', direction: 'desc' });
  const [viewErrorsId, setViewErrorsId] = useState<number>();

  const errorStates = ['SYSTEM_ERROR', 'EXECUTOR_ERROR'];
  const signal = useCancellation();
  const stateRefreshTimer = useRef();
  const [workflows, setWorkflows] = useState(new Map());
  // const [paginatedPreviousRuns, setPaginatedPreviousRuns] = useState<Run[]>();
  // const [sortedPreviousRuns, setSortedPreviousRuns] = useState<Run[]>();

  const showLogModal = useCallback(
    (modalTitle: string, logsArray: []) => {
      setShowLog(true);
      setLogsModalTitle(modalTitle);
      setLogsArray(logsArray);
    },
    [setLogsArray, setLogsModalTitle, setShowLog]
  );

  const showTaskDataModal = useCallback(
    (taskDataTitle: string, taskJson: []) => {
      setTaskDataTitle(taskDataTitle);
      setTaskDataJson(taskJson);
      setShowTaskData(true);
    },
    [setShowTaskData, setTaskDataJson, setTaskDataTitle]
  );

  const getFilteredRuns = (filterOption: string, runsData: Run[]): Run[] => {
    const filteredRuns: Run[] = [];

    for (const run of runsData) {
      switch (filterOption) {
        case 'Error':
          if (errorStates.includes(run.state)) {
            filteredRuns.push(run);
          }
          break;
        case 'Succeeded':
          if (run.state === 'COMPLETE') {
            filteredRuns.push(run);
          }
          break;
        default:
          filteredRuns.push(run);
      }
    }

    return filteredRuns;
  };

  const sortRuns = (field: string, direction: string, runs: Run[]): Run[] => {
    const runsSorted: Run[] = [];

    if (runs !== undefined) {
      for (const run of runs) {
        runsSorted.push(run);
      }
    }

    runsSorted.sort((run1, run2) => {
      if (direction === 'asc') {
        if (run1[field] > run2[field]) {
          return 1;
        }
        if (run2[field] > run1[field]) {
          return -1;
        }
      } else {
        if (run1[field] < run2[field]) {
          return 1;
        }
        if (run2[field] < run1[field]) {
          return -1;
        }
      }

      return 0;
    });

    return runsSorted;
  };

  // const sortedPreviousRuns = useMemo(() => {
  //   const filteredPreviousRuns: Run[] = filterOption ? getFilteredRuns(filterOption, runsData) : runsData;
  //   return sortRuns(sort.field, sort.direction, filteredPreviousRuns);
  // }, [filterOption, getFilteredRuns, runsData, sort.direction, sort.field]);

  // const paginatedPreviousRuns = useMemo(() => {
  //   const firstPageIndex: number = (pageNumber - 1) * itemsPerPage;
  //   const lastPageIndex: number = firstPageIndex + itemsPerPage;
  //   return sortedPreviousRuns.slice(firstPageIndex, lastPageIndex);
  // }, [itemsPerPage, pageNumber, sortedPreviousRuns]);

  // useLayoutEffect(() => {
  //   const filteredPreviousRuns: Run[] = filterOption ? getFilteredRuns(filterOption, runsData) : runsData;
  //   const firstPageIndex: number = (pageNumber - 1) * itemsPerPage;
  //   const lastPageIndex: number = firstPageIndex + itemsPerPage;
  //   setSortedPreviousRuns(sortRuns(sort.field, sort.direction, filteredPreviousRuns));
  //   setPaginatedPreviousRuns(sortedPreviousRuns.slice(firstPageIndex, lastPageIndex));
  // }, [
  //   filterOption,
  //   getFilteredRuns,
  //   runsData,
  //   pageNumber,
  //   itemsPerPage,
  //   sort.field,
  //   sort.direction,
  //   sortedPreviousRuns,
  // ]);

  enum FilterOptions {
    Error = 'Error',
    NoFilter = 'No filter',
    Succeeded = 'Succeeded',
  }

  const filteredPreviousRuns: Run[] = filterOption ? getFilteredRuns(filterOption, runsData) : runsData;
  const filterOptions: FilterOptions[] = [FilterOptions.Error, FilterOptions.NoFilter, FilterOptions.Succeeded];
  const firstPageIndex: number = (pageNumber - 1) * itemsPerPage;
  const lastPageIndex: number = firstPageIndex + itemsPerPage;
  const sortedPreviousRuns: Run[] = sortRuns(sort.field, sort.direction, filteredPreviousRuns);
  const paginatedPreviousRuns: Run[] = sortedPreviousRuns.slice(firstPageIndex, lastPageIndex);
  // console.log('UPDATED');
  const rowWidth = 100;
  const rowHeight = 50;

  const state = (
    state: string,
    submissionDate: Date
  ): { id: string; label: (state: string) => string; icon: (style: any) => any } => {
    switch (state) {
      case 'SYSTEM_ERROR':
      case 'EXECUTOR_ERROR':
        return statusType.failed;
      case 'COMPLETE':
        return statusType.succeeded;
      case 'INITIALIZING':
        return statusType.initializing;
      case 'QUEUED':
        return statusType.queued;
      case 'RUNNING':
        return statusType.running;
      case 'PAUSED':
        return statusType.paused;
      case 'CANCELED':
        return statusType.canceled;
      case 'CANCELING':
        return statusType.canceling;
      default:
        // 10 seconds should be enough for Cromwell to summarize the new workflow and get a status other
        // than UNKNOWN. In the meantime, handle this as an edge case in the UI:
        return differenceFromNowInSeconds(submissionDate) < 10 ? statusType.initializing : statusType.unknown;
    }
  };

  // Duped from RunDetails.js
  const includeKey = useMemo(
    () => [
      'backendStatus',
      'executionStatus',
      'shardIndex',
      'jobId',
      'start',
      'end',
      'stderr',
      'stdout',
      'tes_stdout',
      'tes_stderr',
      'attempt',
      'subWorkflowId', // needed for task type column
    ],
    []
  );
  const excludeKey = useMemo(() => [], []);

  const loadWorkflows = useCallback(
    async (workflowId: string) => {
      try {
        const { cromwellProxyUrlState } = await loadAppUrls(workspaceId, 'cromwellProxyUrlState');
        if (cromwellProxyUrlState.status === AppProxyUrlStatus.Ready) {
          const metadata = await fetchMetadata(cromwellProxyUrlState.state, workflowId, signal, includeKey, excludeKey);
          // console.log(metadata);
          workflows.set(workflowId, metadata);
          const newWorkflows = new Map(workflows);
          setWorkflows(newWorkflows);
          if (!_.isEmpty(metadata?.calls)) {
            if (_.includes(collapseStatus(metadata.status), [statusType.running, statusType.submitted])) {
              // @ts-expect-error
              stateRefreshTimer.current = setTimeout(() => {
                loadWorkflows(workflowId);
              }, 60000);
            }
          }
        }
      } catch (error) {
        notify('error', 'Error loading run details', {
          detail: error instanceof Response ? await error.text() : error,
        });
      }
    },
    [workspaceId, signal, includeKey, excludeKey, workflows]
  );

  const getKeys = (keyValuePairs: {}) => {
    for (const key of Object.getOwnPropertyNames(keyValuePairs)) {
      keyValuePairs[key];
      delete Object.assign(keyValuePairs, {
        [parseMethodString(key).variable]: keyValuePairs[key],
      })[key];
    }
  };

  /*
   * Data fetchers
   */
  useOnMount(() => {
    // console.log(paginatedPreviousRuns);
    const load = async () => {
      for (const run of paginatedPreviousRuns) {
        if (run.engine_id !== undefined) {
          await loadWorkflows(run.engine_id);
        }
      }
    };
    load();
    return () => {
      clearTimeout(stateRefreshTimer.current);
    };
  });

  // useEffect(() => {
  // const filteredPreviousRuns: Run[] = filterOption ? getFilteredRuns(filterOption, runsData) : runsData;
  // const firstPageIndex: number = (pageNumber - 1) * itemsPerPage;
  // const lastPageIndex: number = firstPageIndex + itemsPerPage;
  // const sortedPreviousRuns: Run[] = sortRuns(sort.field, sort.direction, filteredPreviousRuns);
  // paginatedPreviousRuns = sortedPreviousRuns.slice(firstPageIndex, lastPageIndex);
  // }, [runsData]);

  return div(
    {
      style: {
        backgroundColor: 'rgb(235, 236, 238)',
        display: 'flex',
        flex: '1 1 auto',
        flexDirection: 'column',
        padding: '1rem 3rem',
      },
    },
    [
      div(
        {
          style: {
            marginTop: '1em',
            minHeight: '10em',
            marginBottom: '5em',
          },
        },
        [
          runsFullyUpdated
            ? div([
                icon('check', { size: 15, style: { color: colors.success() } }),
                ' Workflow statuses are all up to date.',
              ])
            : div([
                icon('warning-standard', { size: 15, style: { color: colors.warning() } }),
                ' Some workflow statuses are not up to date. Refreshing the page may update more statuses.',
              ]),
          div([h3(['Filter by: '])]),
          h(Select, {
            isDisabled: false,
            'aria-label': 'Filter selection',
            isClearable: false,
            value: filterOption,
            placeholder: 'None selected',
            // @ts-expect-error
            onChange: ({ value }) => {
              setFilterOption(value);
            },
            styles: { container: (old) => ({ ...old, display: 'inline-block', width: 200, marginBottom: '1.5rem' }) },
            options: filterOptions,
          }),
          div(
            {
              style: {
                float: 'right',
              },
            },
            [
              h(
                Link,
                {
                  href: Nav.getLink('workspace-files', { name: workspaceName, namespace }),
                  target: '_blank',
                },
                [icon('folder-open', { size: 18 }), 'Submission Execution Directory']
              ),
            ]
          ),
          div(
            {
              style: {
                height: tableHeight({
                  actualRows: paginatedPreviousRuns.length,
                  maxRows: 12.5,
                  heightPerRow: 50,
                }),
              },
            },
            [
              h(AutoSizer, [
                ({ width, height }) =>
                  h(FlexTable, {
                    'aria-label': 'previous runs',
                    width,
                    height,
                    // @ts-expect-error
                    sort,
                    rowCount: paginatedPreviousRuns.length,
                    noContentMessage: 'Nothing here yet! Your previously run workflows will be displayed here.',
                    hoverHighlight: true,
                    rowHeight,
                    rowWidth,
                    columns: [
                      {
                        size: { basis: 350 },
                        field: 'record_id',
                        headerRenderer: () => h(Sortable, { sort, field: 'record_id', onSort: setSort }, ['Sample ID']),
                        cellRenderer: ({ rowIndex }) => {
                          const engineId = paginatedPreviousRuns[rowIndex].engine_id;

                          // Engine id may be undefined if CBAS failed to submit to Cromwell
                          if (engineId === undefined) return h(TextCell, [paginatedPreviousRuns[rowIndex].record_id]);

                          return div({ style: { width: '100%', textAlign: 'left' } }, [
                            h(
                              Link,
                              {
                                href: Nav.getLink('workspace-workflows-app-run-details', {
                                  namespace,
                                  name: workspaceName,
                                  submissionId,
                                  workflowId: engineId,
                                }),
                                style: { fontWeight: 'bold' },
                              },
                              [paginatedPreviousRuns[rowIndex].record_id]
                            ),
                          ]);
                        },
                      },
                      {
                        size: { basis: 600, grow: 0 },
                        field: 'state',
                        headerRenderer: () => h(Sortable, { sort, field: 'state', onSort: setSort }, ['Status']),
                        cellRenderer: ({ rowIndex }) => {
                          const status = state(
                            paginatedPreviousRuns[rowIndex].state,
                            paginatedPreviousRuns[rowIndex].submission_date
                          );
                          if (errorStates.includes(paginatedPreviousRuns[rowIndex].state)) {
                            return div({ style: { width: '100%', textAlign: 'center' } }, [
                              h(
                                Link,
                                {
                                  key: 'error link',
                                  style: { fontWeight: 'bold' },
                                  onClick: () => setViewErrorsId(rowIndex),
                                },
                                [
                                  makeStatusLine(
                                    (style) => status.icon(style),
                                    status.label(paginatedPreviousRuns[rowIndex].state),
                                    {
                                      textAlign: 'center',
                                    }
                                  ),
                                ]
                              ),
                            ]);
                          }
                          return h(TextCell, { style: { fontWeight: 'bold' } }, [
                            makeStatusLine(
                              (style) => status.icon(style),
                              status.label(paginatedPreviousRuns[rowIndex].state),
                              {
                                textAlign: 'center',
                              }
                            ),
                          ]);
                        },
                      },
                      {
                        size: { basis: 500, grow: 0 },
                        field: 'duration',
                        headerRenderer: () => h(Sortable, { sort, field: 'duration', onSort: setSort }, ['Duration']),
                        cellRenderer: ({ rowIndex }) => {
                          return h(TextCell, [customFormatDuration(paginatedPreviousRuns[rowIndex].duration)]);
                        },
                      },
                      {
                        size: { basis: 400, grow: 0 },
                        field: 'workflowId',
                        headerRenderer: () =>
                          h(Sortable, { sort, field: 'workflowId', onSort: setSort }, ['Workflow ID']),
                        cellRenderer: ({ rowIndex }) => {
                          const engineId = paginatedPreviousRuns[rowIndex].engine_id;
                          if (engineId !== undefined) {
                            return h(TextCell, [
                              span({ style: { marginRight: '0.5rem' } }, [engineId]),
                              span({}, [h(ClipboardButton, { text: engineId, 'aria-label': 'Copy workflow id' })]),
                            ]);
                          }
                        },
                      },
                      {
                        size: { basis: 400, grow: 0 },
                        field: 'taskData',
                        headerRenderer: () => 'Workflow Data',
                        cellRenderer: ({ rowIndex }) => {
                          const workflow: WorkflowMetadata = workflows.get(
                            paginatedPreviousRuns[rowIndex].engine_id as string
                          ) as WorkflowMetadata;
                          return h(TextCell, [
                            h(
                              Link,
                              {
                                onClick: () => {
                                  const logUri = workflow.workflowLog;
                                  showLogModal('Workflow Execution Log', [
                                    {
                                      logUri,
                                      logTitle: 'Workflow Execution Log',
                                      logKey: 'execution_log',
                                      logFilename: 'workflow.log',
                                    },
                                  ]);
                                },
                              },
                              ['Logs\t']
                            ),
                            h(
                              Link,
                              {
                                onClick: () => {
                                  getKeys(workflow.inputs);
                                  showTaskDataModal('Inputs', workflow.inputs);
                                },
                              },
                              ['Inputs\t']
                            ),
                            h(
                              Link,
                              {
                                onClick: () => {
                                  getKeys(workflow.outputs);
                                  showTaskDataModal('Outputs', workflow.outputs);
                                },
                              },
                              ['Outputs']
                            ),
                          ]);
                        },
                      },
                    ],
                  }),
              ]),
            ]
          ),
        ]
      ),
      !_.isEmpty(sortedPreviousRuns) &&
        div({ style: { marginBottom: '1.5rem', right: '4rem' } }, [
          // @ts-expect-error
          paginator({
            filteredDataLength: sortedPreviousRuns.length,
            unfilteredDataLength: sortedPreviousRuns.length,
            pageNumber,
            setPageNumber,
            itemsPerPage,
            setItemsPerPage: (v) => {
              setPageNumber(1);
              setItemsPerPage(v);
            },
            itemsPerPageOptions: [10, 25, 50, 100],
          }),
        ]),
      viewErrorsId !== undefined &&
        h(
          Modal,
          {
            title: 'Error Messages',
            width: 600,
            onDismiss: () => setViewErrorsId(undefined),
            showCancel: false,
            okButton: h(
              ButtonPrimary,
              {
                disabled: false,
                onClick: () => setViewErrorsId(undefined),
              },
              ['OK']
            ),
          },
          [
            h(
              TextCell,
              {
                style: {
                  textAlign: 'center',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: '3rem',
                  marginBottom: '1rem',
                },
              },
              [paginatedPreviousRuns[viewErrorsId]?.error_messages]
            ),
          ]
        ),
    ]
  );
};

export default FilterableWorkflowTable;
