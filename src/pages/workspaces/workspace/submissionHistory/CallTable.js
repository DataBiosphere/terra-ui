import { Icon, TooltipTrigger } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { div, h, input, label, span } from 'react-hyperscript-helpers';
import { AutoSizer } from 'react-virtualized';
import { bucketBrowserUrl } from 'src/auth/auth';
import { Clickable, Link, Select } from 'src/components/common';
import { makeCromwellStatusLine, makeStatusLine, statusType } from 'src/components/job-common';
import { FlexTable, Sortable, tableHeight, TextCell, TooltipCell } from 'src/components/table';
import colors from 'src/libs/colors';
import * as Utils from 'src/libs/utils';
import CallCacheWizard from 'src/pages/workspaces/workspace/submissionHistory/CallCacheWizard';
import { FailuresModal } from 'src/pages/workspaces/workspace/submissionHistory/FailuresViewer';
import { collapseCromwellStatus } from 'src/workflows-app/components/job-common';

/* FILTER UTILITY FUNCTIONS */
export const taskNameFilter = (searchText) => {
  const searchTerms = searchText.toLowerCase().split(/[\s_/]/);
  return _.filter((callObject) => {
    return searchTerms.every((term) => (callObject?.taskName || '').toLowerCase().includes(term));
  });
};

export const statusFilter = (statuses) => {
  return _.filter(({ statusObj }) => {
    return _.isEmpty(statuses) ? true : statuses.includes(statusObj.label());
  });
};

export const filterCallObjectsFn = (searchText, sort, statuses) =>
  _.flow(taskNameFilter(searchText), statusFilter(statuses), _.sortBy(sort.field), sort.direction === 'asc' ? _.identity : _.reverse);

// Cromwell reports jobId as the full Batch resource name, e.g.
// `projects/terra-bb519a4d/locations/us-central1/jobs/job-fe6d19c1-helloworldecho-1-0f9d2497`.
export const makeBatchJobUrl = (jobId) => {
  const match = /^projects\/([^/]+)\/locations\/([^/]+)\/jobs\/(.+)$/.exec(jobId || '');
  if (!match) return undefined;
  const [, project, region, jobName] = match;
  return `https://console.cloud.google.com/batch/jobsDetail/regions/${region}/jobs/${jobName}/details?project=${project}`;
};

// Same signals as Job Manager (servers/cromwell/jobs/controllers/jobs_controller.py), not the call's name:
// a call that ran inside a scatter has a shardIndex other than -1, and a subworkflow call has a subWorkflowId.
// A call can be both (a scattered subworkflow); it shows as Scatter, the way Job Manager groups it as a scatter.
export const callType = ({ shardIndex = -1, subWorkflowId }) =>
  Utils.cond([shardIndex !== -1, () => 'Scatter'], [!_.isEmpty(subWorkflowId), () => 'Subworkflow'], () => 'Task');

// Cromwell names calls "<workflow>.<call>"; synthetic scatters like "ScatterAt154_14" have no prefix.
export const callDisplayName = (taskName) => taskName.replace(/^[^.]*\./, '');

// Like Job Manager, a scatter's status is its most urgent shard status (_get_scattered_task_status), so it's listed first
const scatterStatusRank = ['failed', 'retryableFailure', 'aborted', 'running', 'submitted', 'waitingForQuota', 'queued', 'succeeded', 'unknown'];

// Rolls each scatter's shards (already filtered and sorted) into one row, placed where its first shard sorts.
// An expanded scatter is followed by its shards, in shard and attempt order.
export const groupScatters = (calls, expandedScatters) => {
  const shardsByName = _.groupBy('taskName', _.filter({ type: 'Scatter' }, calls));
  const placed = new Set();
  return _.flatMap((call) => {
    if (call.type !== 'Scatter') return [call];
    if (placed.has(call.taskName)) return [];
    placed.add(call.taskName);
    const shards = _.sortBy(['shardIndex', 'attempt'], shardsByName[call.taskName]);
    const scatterRow = { rowKind: 'scatter', taskName: call.taskName, type: 'Scatter', shards };
    return _.includes(call.taskName, expandedScatters) ? [scatterRow, ..._.map((shard) => ({ ...shard, rowKind: 'shard' }), shards)] : [scatterRow];
  }, calls);
};

// One status line per distinct status, most urgent first, e.g. "1 Failed" then "3 Succeeded"
export const scatterStatusCounts = (shards) =>
  _.flow(
    _.groupBy(({ statusObj }) => statusObj.id),
    _.map((group) => ({ statusObj: group[0].statusObj, count: group.length })),
    _.sortBy(({ statusObj }) => {
      const rank = scatterStatusRank.indexOf(statusObj.id);
      return rank === -1 ? scatterStatusRank.length : rank;
    })
  )(shards);

// Helper method to generate data for the call table
const generateCallTableData = (calls) => {
  if (_.isEmpty(calls)) return [];
  const taskNames = Object.keys(calls);
  return _.flatMap((taskName) => {
    const targetData = calls[taskName];
    return _.map((taskCall) =>
      _.merge({ taskName, type: callType(taskCall), statusObj: collapseCromwellStatus(taskCall.executionStatus, taskCall.backendStatus) }, taskCall)
    )(targetData);
  })(taskNames);
};

// helper method to combine metadata tasks and failed tasks into a single array
// if the failed task data is not empty, combine only successful tasks from the metadata with the failed tasks data
// otherwise just return the metadata
const organizeCallTableData = (metadataCalls = {}, failedTaskCalls = {}) => {
  const metadataTableData = generateCallTableData(metadataCalls);
  const failedTaskTableData = generateCallTableData(failedTaskCalls);
  if (!_.isEmpty(failedTaskTableData)) {
    const successfulMetadata = _.filter(({ statusObj }) => {
      const { id } = statusObj;
      return id?.toLocaleLowerCase() !== 'failed';
    }, metadataTableData);
    return successfulMetadata.concat(failedTaskTableData);
  }
  return metadataTableData;
};

/* STATUS COUNT SUB-COMPONENT */
const StatusCounts = ({ statusListObjects }) => {
  const statuses = Object.keys(statusListObjects);
  const statusCountRender = statuses.map((status) => {
    const { count, icon } = statusListObjects[status];
    return span({ key: `${status}-status-count`, style: { marginRight: '20px' } }, [
      icon(),
      span({ style: { fontWeight: 800, marginLeft: '3px' } }, [`${count} `]),
      span(`${status}`),
    ]);
  });
  return div({}, [statusCountRender]);
};

/* TABLE SEARCH BAR */
const SearchBar = ({ searchText, setSearchText }) => {
  return div(
    {
      id: 'task-name-search',
      style: {
        flexBasis: '400px',
      },
    },
    [
      input({
        type: 'text',
        placeholder: 'Search by task name',
        style: { width: '100%', padding: '9px', borderRadius: '15px', border: '1px solid #8F95A0' },
        value: searchText,
        onChange: (e) => setSearchText(e.target.value),
      }),
    ]
  );
};

/* WORKFLOW BREADCRUMB SUB-COMPONENT */
const WorkflowBreadcrumb = ({ workflowPath, loadWorkflow, updateWorkflowPath }) => {
  const workflowPathRender = workflowPath.map((workflow, index) => {
    const { id, workflowName } = workflow;
    const isLast = index === workflowPath.length - 1;
    return span({ key: `${id}-breadcrumb`, style: { marginRight: '5px' } }, [
      isLast ? span([workflowName]) : h(Link, { style: { cursor: 'pointer' }, onClick: () => loadWorkflow(id, updateWorkflowPath) }, [workflowName]),
      !isLast && span(' > '),
    ]);
  });
  return div({ 'aria-label': 'Workflow Breadcrumb', style: { marginBottom: '10px' } }, [workflowPathRender]);
};

// Same size as the Status column's icons, but greyscale so call caching doesn't compete with them.
// Icon only; the full Cromwell text is in the tooltip. With onClick, the icon is a button that darkens on hover,
// and the tooltip says so (the copy button still copies just the Cromwell text).
const callCachingIcon = (shape, label, tooltip, onClick) =>
  h(
    TooltipTrigger,
    {
      content: onClick
        ? div([tooltip, div({ style: { marginTop: '0.5rem', fontStyle: 'italic', color: colors.dark(0.7) } }, ['Click to debug'])])
        : tooltip,
      copyText: tooltip,
      copyable: true,
    },
    [
      onClick
        ? h(Clickable, { 'aria-label': label, onClick, style: { display: 'flex', color: colors.dark(0.7) }, hover: { color: colors.dark() } }, [
            h(Icon, { icon: shape, size: 24 }),
          ])
        : h(Icon, { icon: shape, size: 24, 'aria-label': label, style: { color: colors.dark(0.7), flexShrink: 0 } }),
    ]
  );

// Centers the icon in the cell.
const centeredInCell = (children) =>
  div({ style: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' } }, _.castArray(children));

// Room for a scatter's expand/collapse arrow; shard names are indented one more step
const expanderWidth = 20;

/* EXTRA STYLING FOR TEXT HEAVY CELLS */
const basicCellTextStyle = {
  wordBreak: 'break-word',
};

/* CALL TABLE */
const CallTable = ({
  name,
  namespace,
  submissionId,
  callObjects,
  defaultFailedFilter = false,
  showInputOutputModal = undefined,
  loadWorkflow,
  loadCallCacheDiff,
  loadCallCacheMetadata,
  enableExplorer = false,
  workflowName,
  workflowId,
  failedTasks,
}) => {
  const [failuresModalParams, setFailuresModalParams] = useState();
  const [wizardSelection, setWizardSelection] = useState();
  const tableData = useMemo(() => organizeCallTableData(callObjects, failedTasks), [callObjects, failedTasks]);
  const [sort, setSort] = useState({ field: 'index', direction: 'asc' });
  const [statusFilter, setStatusFilter] = useState([]);
  // NOTE: workflowPath is used to load the workflow in the explorer, implement after the table update is confirmed to be working
  const [workflowPath, setWorkflowPath] = useState([{ id: workflowId, workflowName }]);
  const [searchText, setSearchText] = useState('');
  const filteredCallObjects = useMemo(() => {
    return filterCallObjectsFn(searchText, sort, statusFilter)(tableData);
  }, [searchText, sort, statusFilter, tableData]);
  const [expandedScatters, setExpandedScatters] = useState([]);
  const rows = useMemo(() => groupScatters(filteredCallObjects, expandedScatters), [filteredCallObjects, expandedScatters]);

  useEffect(() => {
    if (defaultFailedFilter) {
      setStatusFilter(['Failed']);
    }
  }, [defaultFailedFilter]);

  const statusListObjects = useMemo(() => {
    const statusSet = {};
    tableData.forEach(({ statusObj }) => {
      if (!_.isEmpty(statusObj)) {
        const { icon, label } = statusObj;
        const labelText = label();
        if (!statusSet[labelText]) {
          statusSet[labelText] = { count: 0 };
        }
        statusSet[labelText].count += 1;
        statusSet[labelText].icon = icon;
      } else {
        return {};
      }
    });
    return statusSet;
  }, [tableData]);

  const updateWorkflowPath = useCallback(
    (id, workflowName) => {
      const currentIndex = workflowPath.findIndex((workflow) => workflow.id === id);
      if (currentIndex !== -1) {
        setWorkflowPath(workflowPath.slice(0, currentIndex + 1));
      } else {
        setWorkflowPath([...workflowPath, { id, workflowName }]);
      }
    },
    [workflowPath]
  );

  return div([
    label(
      {
        isRendered: !enableExplorer,
        style: {
          fontWeight: 700,
        },
      },
      ['Filter by:']
    ),
    div({ style: { margin: '1rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } }, [
      div(
        {
          id: 'filter-section-left',
          style: {
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            flexBasis: 400,
            flexGrow: 2,
          },
        },
        [
          div({ style: { flexBasis: 250, marginRight: '20px' }, isRendered: !enableExplorer }, [
            h(Select, {
              isClearable: true,
              isMulti: true,
              isSearchable: false,
              placeholder: 'Status',
              'aria-label': 'Status',
              value: statusFilter,
              onChange: (data) => setStatusFilter(_.map('value', data)),
              options: Object.keys(statusListObjects),
            }),
          ]),
          h(StatusCounts, { statusListObjects }),
        ]
      ),
      div(
        {
          id: 'filter-section-right',
          style: {
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            flexBasis: 400,
            flexGrow: 1,
          },
        },
        [h(SearchBar, { searchText, setSearchText })]
      ),
    ]),
    h(WorkflowBreadcrumb, { isRendered: enableExplorer, workflowPath, loadWorkflow, updateWorkflowPath }),
    h(AutoSizer, { disableHeight: true }, [
      ({ width }) =>
        h(FlexTable, {
          'aria-label': 'call table',
          height: tableHeight({ actualRows: rows.length, maxRows: 10.5 }), // The half-row here hints at there being extra rows if scrolled
          width,
          sort,
          rowCount: rows.length,
          noContentMessage: 'No matching calls',
          columns: [
            {
              size: { basis: 300, grow: 2 },
              field: 'taskName',
              headerRenderer: () => h(Sortable, { sort, field: 'taskName', onSort: setSort }, ['Name']),
              cellRenderer: ({ rowIndex }) => {
                const { rowKind, taskName, shards, shardIndex } = rows[rowIndex];
                if (rowKind === 'scatter') {
                  const isExpanded = _.includes(taskName, expandedScatters);
                  const shardCount = _.size(_.uniqBy('shardIndex', shards));
                  // The whole name toggles the shards, not just the arrow
                  return h(
                    Clickable,
                    {
                      'aria-label': `${isExpanded ? 'Collapse' : 'Expand'} ${callDisplayName(taskName)} shards`,
                      'aria-expanded': isExpanded,
                      onClick: () => setExpandedScatters(_.xor([taskName])),
                      style: { display: 'flex', alignItems: 'center', minWidth: 0 },
                    },
                    [
                      div({ style: { display: 'flex', width: expanderWidth, flexShrink: 0, color: colors.accent() } }, [
                        h(Icon, { icon: isExpanded ? 'angle-down' : 'angle-right', size: 16 }),
                      ]),
                      h(TextCell, [
                        callDisplayName(taskName),
                        span({ style: { color: colors.dark(0.7) } }, [` (${shardCount} shard${shardCount === 1 ? '' : 's'})`]),
                      ]),
                    ]
                  );
                }
                if (rowKind === 'shard') {
                  return h(TextCell, { style: { paddingLeft: 2 * expanderWidth } }, [`Shard ${shardIndex}`]);
                }
                // Same indent as scatter names, so all names line up
                return h(TextCell, { style: { paddingLeft: expanderWidth } }, [callDisplayName(taskName)]);
              },
            },
            {
              size: { basis: 100, grow: 1 },
              field: 'type',
              headerRenderer: () => h(Sortable, { sort, field: 'type', onSort: setSort }, ['Type']),
              cellRenderer: ({ rowIndex }) => {
                const row = rows[rowIndex];
                // Each shard is one run of the scattered task or subworkflow
                const type = row.rowKind === 'shard' ? callType({ subWorkflowId: row.subWorkflowId }) : row.type;
                return div({ style: basicCellTextStyle }, [type]);
              },
            },
            {
              size: { basis: 110, grow: 1 },
              field: 'attempt',
              headerRenderer: () => h(Sortable, { sort, field: 'attempt', onSort: setSort }, ['Attempt']),
              cellRenderer: ({ rowIndex }) => {
                if (rows[rowIndex].rowKind === 'scatter') return null; // Attempts and links are per shard
                const { attempt, jobId, callRoot, subWorkflowId, inputs, outputs } = rows[rowIndex];
                const batchJobUrl = makeBatchJobUrl(jobId);
                const executionDirUrl = callRoot?.startsWith('gs://') ? bucketBrowserUrl(callRoot.replace('gs://', '')) : undefined;
                const showInputsOutputs = !!showInputOutputModal && _.isEmpty(subWorkflowId);
                return div({ style: { ...basicCellTextStyle, display: 'flex', alignItems: 'center' } }, [
                  attempt,
                  showInputsOutputs &&
                    h(
                      Link,
                      {
                        key: 'io',
                        style: { marginLeft: '0.5rem', display: 'flex', alignItems: 'center' },
                        tooltip: 'Inputs & Outputs',
                        onClick: () => showInputOutputModal('Inputs & Outputs', inputs, outputs),
                      },
                      [h(Icon, { icon: 'listAlt', size: 18, 'aria-label': 'View task inputs and outputs' })]
                    ),
                  h(
                    Link,
                    {
                      key: 'batch',
                      ...(batchJobUrl ? Utils.newTabLinkProps : {}),
                      href: batchJobUrl,
                      disabled: !batchJobUrl,
                      style: { marginLeft: '0.5rem', display: 'flex', alignItems: 'center' },
                      tooltip: batchJobUrl ? 'GCP Batch Job' : 'No job found',
                    },
                    [h(Icon, { icon: 'cloud', size: 18, 'aria-label': 'GCP Batch job details' })]
                  ),
                  h(
                    Link,
                    {
                      key: 'execDir',
                      ...(executionDirUrl ? Utils.newTabLinkProps : {}),
                      href: executionDirUrl,
                      disabled: !executionDirUrl,
                      style: { marginLeft: '0.5rem', display: 'flex', alignItems: 'center' },
                      tooltip: executionDirUrl ? 'Execution Directory' : 'No directory found',
                    },
                    [h(Icon, { icon: 'folder-open', size: 18, 'aria-label': 'Execution directory' })]
                  ),
                ]);
              },
            },
            {
              size: { basis: 140, grow: 2 },
              field: 'status',
              headerRenderer: () => h(Sortable, { sort, field: 'status', onSort: setSort }, ['Status']),
              cellRenderer: ({ rowIndex }) => {
                if (rows[rowIndex].rowKind === 'scatter') {
                  return div(
                    { style: { display: 'flex', flexWrap: 'wrap', columnGap: '1rem' } },
                    _.map(
                      ({ statusObj, count }) =>
                        div({ key: statusObj.id }, [
                          makeStatusLine((style) => statusObj.icon(style), `${count} ${statusObj.label()}`, { marginLeft: '0.5rem' }),
                        ]),
                      scatterStatusCounts(rows[rowIndex].shards)
                    )
                  );
                }
                const { taskName, index, attempt, executionStatus, backendStatus, failures } = rows[rowIndex];
                const failureCount = _.size(failures);
                const collapsedStatus = collapseCromwellStatus(executionStatus);
                if (collapsedStatus.id === statusType.failed.id && failureCount > 0) {
                  return h(
                    Link,
                    {
                      onClick: () => setFailuresModalParams({ callFqn: taskName, index, attempt, failures }),
                    },
                    [
                      div({ style: { display: 'flex', alignItems: 'center' } }, [
                        makeStatusLine(
                          (style) => collapsedStatus.icon(style),
                          `${collapsedStatus.label(executionStatus)} (${failureCount} Message${failureCount > 1 ? 's' : ''})`,
                          { marginLeft: '0.5rem' }
                        ),
                      ]),
                    ]
                  );
                }
                return div({ style: basicCellTextStyle }, [makeCromwellStatusLine(executionStatus, backendStatus, failures)]);
              },
            },
            {
              size: { basis: 200, grow: 1 },
              field: 'start',
              headerRenderer: () => h(Sortable, { sort, field: 'start', onSort: setSort }, ['Start']),
              cellRenderer: ({ rowIndex }) => {
                const { rowKind, shards } = rows[rowIndex];
                // A scatter starts with its first shard
                const start = rowKind === 'scatter' ? _.min(_.compact(_.map('start', shards))) : rows[rowIndex].start;
                return h(TooltipCell, [start ? Utils.makeCompleteDate(start) : 'N/A']);
              },
            },
            {
              size: { basis: 200, grow: 1 },
              field: 'end',
              headerRenderer: () => h(Sortable, { sort, field: 'end', onSort: setSort }, ['End']),
              cellRenderer: ({ rowIndex }) => {
                const { rowKind, shards } = rows[rowIndex];
                // A scatter ends with its last shard, once they all have
                const end = rowKind === 'scatter' ? _.every('end', shards) && _.max(_.map('end', shards)) : rows[rowIndex].end;
                return h(TooltipCell, [end ? Utils.makeCompleteDate(end) : 'N/A']);
              },
            },
            {
              size: { basis: 90, grow: 0 },
              field: 'callCachingResult',
              headerRenderer: () => 'Caching',
              cellRenderer: ({ rowIndex }) => {
                if (rows[rowIndex].rowKind === 'scatter') return null; // Caching is per shard
                const { taskName, shardIndex: index, callCaching: { effectiveCallCachingMode, result } = {} } = rows[rowIndex];
                if (effectiveCallCachingMode === 'ReadAndWriteCache' || effectiveCallCachingMode === 'ReadCache') {
                  // Pick the icon; clicking a miss opens the call cache debug wizard
                  return result
                    ? centeredInCell(
                        Utils.cond(
                          [_.startsWith('Cache Hit', result), () => callCachingIcon('success-standard', 'Cache hit', result)],
                          [
                            _.startsWith('Cache Miss', result),
                            () =>
                              callCachingIcon('times-circle', 'Cache miss: open call cache debug wizard', result, () =>
                                setWizardSelection({ callFqn: taskName, index })
                              ),
                          ],
                          () => h(TooltipCell, [result])
                        )
                      )
                    : null; // No info, e.g. initializing
                }
                if (effectiveCallCachingMode === 'WriteCache' || effectiveCallCachingMode === 'CallCachingOff') {
                  return centeredInCell(callCachingIcon('minus-circle', 'Call caching disabled', 'Disabled'));
                }
                // No call caching mode, e.g. it's a subworkflow or scatter call
                return null;
              },
            },
          ],
        }),
    ]),
    failuresModalParams && h(FailuresModal, { ...failuresModalParams, onDismiss: () => setFailuresModalParams(undefined) }),
    wizardSelection &&
      h(CallCacheWizard, {
        onDismiss: () => setWizardSelection(undefined),
        namespace,
        name,
        submissionId,
        workflowId,
        ...wizardSelection,
        loadCallCacheDiff,
        loadCallCacheMetadata,
      }),
  ]);
};

export default CallTable;
