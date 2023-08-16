import _ from 'lodash/fp';
import { useCallback, useMemo, useRef, useState } from 'react';
import { div, h, h2, h3 } from 'react-hyperscript-helpers';
import { AutoSizer } from 'react-virtualized';
import { ButtonPrimary, Link, Select } from 'src/components/common';
import { centeredSpinner, icon } from 'src/components/icons';
import Modal from 'src/components/Modal';
import { FlexTable, paginator, Sortable, tableHeight, TextCell } from 'src/components/table';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import * as Nav from 'src/libs/nav';
import { notify } from 'src/libs/notifications';
import { useCancellation, useOnMount, usePollingEffect } from 'src/libs/react-utils';
import { AppProxyUrlStatus, workflowsAppStore } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { customFormatDuration, differenceFromNowInSeconds, makeCompleteDate } from 'src/libs/utils';
import { HeaderSection, statusType, SubmitNewWorkflowButton } from 'src/workflows-app/components/job-common';
import { doesAppProxyUrlExist, loadAppUrls } from 'src/workflows-app/utils/app-utils';
import {
  AutoRefreshInterval,
  CbasPollInterval,
  getDuration,
  isRunInTerminalState,
  isRunSetInTerminalState,
  makeStatusLine,
} from 'src/workflows-app/utils/submission-utils';
import { wrapWorkflowsPage } from 'src/workflows-app/WorkflowsContainer';

export const BaseSubmissionDetails = ({ name, namespace, workspace, submissionId }, _ref) => {
  // State
  const [sort, setSort] = useState({ field: 'duration', direction: 'desc' });
  const [pageNumber, setPageNumber] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [viewErrorsId, setViewErrorsId] = useState();
  const [runsData, setRunsData] = useState();
  const [runsFullyUpdated, setRunsFullyUpdated] = useState();
  const [loading, setLoading] = useState(false);

  const [runSetData, setRunSetData] = useState();
  const [methodsData, setMethodsData] = useState();
  const [filterOption, setFilterOption] = useState(null);

  const signal = useCancellation();
  const scheduledRefresh = useRef();
  const workspaceId = workspace.workspace.workspaceId;

  const getFilter = (filterOption) => {
    let filterStatement;
    switch (filterOption) {
      case 'Error':
        filterStatement = _.filter((r) => errorStates.includes(r.state));
        break;
      case 'Succeeded':
        filterStatement = _.filter((r) => r.state === 'COMPLETE');
        break;
      default:
        filterStatement = (data) => data;
    }
    return filterStatement;
  };

  const state = (state, submissionDate) => {
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

  const loadMethodsData = useCallback(
    async (cbasUrlRoot, methodId, methodVersion) => {
      try {
        const methodsResponse = await Ajax(signal).Cbas.methods.getById(cbasUrlRoot, methodId, methodVersion);
        const allMethods = methodsResponse.methods;
        if (allMethods) {
          setMethodsData(allMethods);
        } else {
          notify('error', 'Error loading methods data', { detail: 'Method not found.' });
        }
      } catch (error) {
        notify('error', 'Error loading methods data', { detail: error instanceof Response ? await error.text() : error });
      }
    },
    [signal]
  );

  const loadRuns = useCallback(
    async (cbasUrlRoot) => {
      try {
        const runsResponse = await Ajax(signal).Cbas.runs.get(cbasUrlRoot, submissionId);
        const runsAnnotatedWithDurations = _.map(
          (r) => _.merge(r, { duration: getDuration(r.state, r.submission_date, r.last_modified_timestamp, isRunInTerminalState) }),
          runsResponse.runs
        );
        setRunsData(runsAnnotatedWithDurations);
        setRunsFullyUpdated(runsResponse.fully_updated);
      } catch (error) {
        notify('error', 'Error loading saved workflows', { detail: error instanceof Response ? await error.text() : error });
      }
    },
    [signal, submissionId]
  );

  const loadRunSets = useCallback(
    async (cbasUrlRoot) => {
      try {
        const runSets = await Ajax(signal).Cbas.runSets.get(cbasUrlRoot);
        setRunSetData(runSets.run_sets);
        return runSets.run_sets;
      } catch (error) {
        notify('error', 'Error getting run set data', { detail: error instanceof Response ? await error.text() : error });
      }
    },
    [signal]
  );

  // helper for auto-refresh
  const refresh = Utils.withBusyState(setLoading, async () => {
    try {
      let updatedRunSets;
      if (workflowsAppStore.get().cbasProxyUrlState.status === AppProxyUrlStatus.Ready) {
        updatedRunSets = await loadAllRunSets(workflowsAppStore.get().cbasProxyUrlState);
      }
      // only refresh if there are run sets in non-terminal state
      if (!updatedRunSets || _.some(({ state }) => !isRunSetInTerminalState(state), updatedRunSets)) {
        scheduledRefresh.current = setTimeout(refresh, AutoRefreshInterval);
      }
    } catch (error) {
      notify('error', 'Error loading previous runs', { detail: error instanceof Response ? await error.text() : error });
    }
  });

  const loadAllRunSets = useCallback(
    async (cbasProxyUrlDetails) => {
      try {
        if (cbasProxyUrlDetails.status !== AppProxyUrlStatus.Ready) {
          const { cbasProxyUrlState } = await loadAppUrls(workspaceId, 'cbasProxyUrlState');

          if (cbasProxyUrlState.status === AppProxyUrlStatus.Ready) {
            await loadRuns(cbasProxyUrlState.state);
            const runSets = await loadRunSets(cbasProxyUrlState.state);
            if (runSets !== undefined) {
              setRunSetData(runSets);
              await loadMethodsData(cbasProxyUrlDetails.state, runSets.method_id, runSets.method_version_id);
              return runSets;
            }
            // });
          } else {
            const cbasUrlState = cbasProxyUrlState.state;
            const errorDetails = cbasUrlState instanceof Response ? await cbasUrlState.text() : cbasUrlState;
            const additionalDetails = errorDetails ? `Error details: ${JSON.stringify(errorDetails)}` : '';
            notify('warn', 'Error loading Workflows app', {
              detail: `Workflows app not found. Will retry in 30 seconds. ${additionalDetails}`,
              timeout: CbasPollInterval - 1000,
            });
          }
        } else {
          await loadRuns(cbasProxyUrlDetails.state);

          const runSets = await loadRunSets(cbasProxyUrlDetails.state);
          if (runSets !== undefined) {
            setRunSetData(runSets);
            await loadMethodsData(cbasProxyUrlDetails.state, runSets.method_id, runSets.method_version_id);
            return runSets;
          }
        }
      } catch (error) {
        notify('error', 'Error getting run set data', { detail: error instanceof Response ? await error.text() : error });
      }
    },
    [workspaceId, loadRuns, loadRunSets, loadMethodsData]
  );

  // poll if we're missing CBAS proxy url and stop polling when we have it
  usePollingEffect(() => !doesAppProxyUrlExist(workspaceId, 'cbasProxyUrlState') && loadAllRunSets(workflowsAppStore.get().cbasProxyUrlState), {
    ms: CbasPollInterval,
    leading: false,
  });

  useOnMount(() => {
    const loadWorkflowsApp = async () => {
      const { cbasProxyUrlState } = await loadAppUrls(workspaceId, 'cbasProxyUrlState');

      if (cbasProxyUrlState.status === AppProxyUrlStatus.Ready) {
        await loadAllRunSets(cbasProxyUrlState);
      }
    };
    loadWorkflowsApp();
    refresh();

    return () => {
      if (scheduledRefresh.current) {
        clearTimeout(scheduledRefresh.current);
      }
    };
  });

  const filteredRunSets = _.filter((r) => r.run_set_id === submissionId, runSetData);
  const methodId = filteredRunSets[0]?.method_id;
  const getSpecificMethod = _.filter((m) => m.method_id === methodId, methodsData);

  const errorStates = ['SYSTEM_ERROR', 'EXECUTOR_ERROR'];
  const filteredPreviousRuns = filterOption ? getFilter(filterOption)(runsData) : runsData;
  const sortedPreviousRuns = _.orderBy(sort.field, sort.direction, filteredPreviousRuns);
  const filterOptions = ['Error', 'No filter', 'Succeeded'];

  const firstPageIndex = (pageNumber - 1) * itemsPerPage;
  const lastPageIndex = firstPageIndex + itemsPerPage;
  const paginatedPreviousRuns = sortedPreviousRuns.slice(firstPageIndex, lastPageIndex);

  const header = useMemo(() => {
    const breadcrumbPathObjects = [
      {
        label: 'Submission History',
        path: 'workspace-workflows-app-submission-history',
        params: { name, namespace },
      },
      {
        label: `Submission ${submissionId}`,
      },
    ];
    return h(HeaderSection, { breadcrumbPathObjects, button: h(SubmitNewWorkflowButton, { name, namespace }), title: 'Submission Details' });
  }, [name, namespace, submissionId]);

  const rowWidth = 100;
  const rowHeight = 50;
  return loading
    ? centeredSpinner()
    : div({ id: 'submission-details-page' }, [
        div(
          {
            style: {
              borderBottom: '2px solid rgb(116, 174, 67)',
              boxShadow: 'rgb(0 0 0 / 26%) 0px 2px 5px 0px, rgb(0 0 0 / 16%) 0px 2px 10px 0px',
              position: 'relative',
            },
          },
          [
            div({ style: { marginLeft: '4em', lineHeight: 1.25 } }, [
              h(
                Link,
                {
                  onClick: () =>
                    Nav.goToPath('workspace-workflows-app', {
                      name,
                      namespace,
                      workspace: {
                        workspace: { workspaceId },
                      },
                    }),
                  style: { display: 'inline-flex', alignItems: 'center', padding: '1rem 0 0', fontSize: '115%' },
                },
                [icon('arrowLeft', { style: { marginRight: '0.5rem' } }), 'Back to workflows']
              ),
              header,
              h2(['Submission name: ', filteredRunSets[0]?.run_set_name]),
              h3(['Workflow name: ', getSpecificMethod[0]?.name]),
              h3(['Submission date: ', filteredRunSets[0] && makeCompleteDate(filteredRunSets[0].submission_timestamp)]),
              h3([
                'Duration: ',
                filteredRunSets[0] &&
                  customFormatDuration(
                    getDuration(
                      filteredRunSets[0].state,
                      filteredRunSets[0].submission_timestamp,
                      filteredRunSets[0].last_modified_timestamp,
                      isRunSetInTerminalState
                    )
                  ),
              ]),
            ]),
          ]
        ),
        div(
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
                  height: tableHeight({ actualRows: paginatedPreviousRuns.length, maxRows: 12.5, heightPerRow: 250 }),
                  minHeight: '10em',
                },
              },
              [
                div([h2(['Workflows'])]),
                runsFullyUpdated
                  ? div([icon('check', { size: 15, style: { color: colors.success() } }), ' Workflow statuses are all up to date.'])
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
                  onChange: ({ value }) => {
                    setFilterOption(value);
                  },
                  styles: { container: (old) => ({ ...old, display: 'inline-block', width: 200, marginBottom: '1.5rem' }) },
                  options: filterOptions,
                }),
                h(AutoSizer, [
                  ({ width, height }) =>
                    h(FlexTable, {
                      'aria-label': 'previous runs',
                      width,
                      height,
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
                            return div({ style: { width: '100%', textAlign: 'left' } }, [
                              h(
                                Link,
                                {
                                  onClick: () => {
                                    Nav.goToPath('workspace-workflows-app-run-details', {
                                      namespace,
                                      name,
                                      submissionId,
                                      workflowId: paginatedPreviousRuns[rowIndex].engine_id,
                                    });
                                  },
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
                            const status = state(paginatedPreviousRuns[rowIndex].state, paginatedPreviousRuns[rowIndex].submission_date);
                            if (errorStates.includes(paginatedPreviousRuns[rowIndex].state)) {
                              return div({ style: { width: '100%', textAlign: 'center' } }, [
                                h(Link, { key: 'error link', style: { fontWeight: 'bold' }, onClick: () => setViewErrorsId(rowIndex) }, [
                                  makeStatusLine((style) => status.icon(style), status.label(paginatedPreviousRuns[rowIndex].state), {
                                    textAlign: 'center',
                                  }),
                                ]),
                              ]);
                            }
                            return h(TextCell, { style: { fontWeight: 'bold' } }, [
                              makeStatusLine((style) => status.icon(style), status.label(paginatedPreviousRuns[rowIndex].state), {
                                textAlign: 'center',
                              }),
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
                      ],
                    }),
                ]),
              ]
            ),
            !_.isEmpty(sortedPreviousRuns) &&
              div({ style: { bottom: 0, position: 'absolute', marginBottom: '1.5rem', right: '4rem' } }, [
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
                      style: { textAlign: 'center', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: '3rem', marginBottom: '1rem' },
                    },
                    [paginatedPreviousRuns[viewErrorsId]?.error_messages]
                  ),
                ]
              ),
          ]
        ),
      ]);
};

export const SubmissionDetails = wrapWorkflowsPage({ name: 'SubmissionDetails' })(BaseSubmissionDetails);

export const navPaths = [
  {
    name: 'workspace-workflows-app-submission-details',
    path: '/workspaces/:namespace/:name/workflows-app/submission-history/:submissionId',
    component: SubmissionDetails,
    title: ({ name }) => `${name} - Submission Details`,
  },
];
