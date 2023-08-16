import _ from 'lodash/fp';
import { Fragment, useCallback, useRef, useState } from 'react';
import { div, h, h2 } from 'react-hyperscript-helpers';
import { AutoSizer } from 'react-virtualized';
import { ButtonOutline, Clickable, Link } from 'src/components/common';
import { centeredSpinner, icon } from 'src/components/icons';
import { MenuButton } from 'src/components/MenuButton';
import { MenuTrigger } from 'src/components/PopupTrigger';
import { FlexTable, paginator, Sortable, tableHeight, TextCell } from 'src/components/table';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import * as Nav from 'src/libs/nav';
import { notify } from 'src/libs/notifications';
import { useCancellation, useOnMount, usePollingEffect } from 'src/libs/react-utils';
import { AppProxyUrlStatus, workflowsAppStore } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { doesAppProxyUrlExist, loadAppUrls } from 'src/workflows-app/utils/app-utils';
import {
  AutoRefreshInterval,
  CbasPollInterval,
  getDuration,
  isRunSetInTerminalState,
  makeStatusLine,
  statusType,
} from 'src/workflows-app/utils/submission-utils';
import { wrapWorkflowsPage } from 'src/workflows-app/WorkflowsContainer';

export const BaseSubmissionHistory = ({ name, namespace, workspace }, _ref) => {
  // State
  const [sort, setSort] = useState({ field: 'submission_timestamp', direction: 'desc' });
  const [pageNumber, setPageNumber] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [runSetsData, setRunSetData] = useState();
  const [runSetsFullyUpdated, setRunSetsFullyUpdated] = useState();
  const [loading, setLoading] = useState(false);

  const signal = useCancellation();
  const scheduledRefresh = useRef();
  const workspaceId = workspace.workspace.workspaceId;

  const loadRunSets = useCallback(
    async (cbasUrlRoot) => {
      try {
        const runSets = await Ajax(signal).Cbas.runSets.get(cbasUrlRoot);
        const durationEnhancedRunSets = _.map(
          (r) => _.merge(r, { duration: getDuration(r.state, r.submission_timestamp, r.last_modified_timestamp, isRunSetInTerminalState) }),
          runSets.run_sets
        );
        return _.merge(runSets, { run_sets: durationEnhancedRunSets });
      } catch (error) {
        notify('error', 'Error getting run set data', { detail: error instanceof Response ? await error.text() : error });
      }
    },
    [signal]
  );

  const loadAllRunSets = useCallback(
    async (cbasProxyUrlDetails) => {
      try {
        if (cbasProxyUrlDetails.status !== AppProxyUrlStatus.Ready) {
          const { cbasProxyUrlState } = await loadAppUrls(workspaceId, 'cbasProxyUrlState');

          if (cbasProxyUrlState.status === AppProxyUrlStatus.Ready) {
            const runSets = await loadRunSets(cbasProxyUrlState.state);
            if (runSets !== undefined) {
              setRunSetData(runSets.run_sets);
              setRunSetsFullyUpdated(runSets.fully_updated);
              return runSets;
            }
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
          const runSets = await loadRunSets(cbasProxyUrlDetails.state);
          if (runSets !== undefined) {
            setRunSetData(runSets.run_sets);
            setRunSetsFullyUpdated(runSets.fully_updated);
            return runSets;
          }
        }
      } catch (error) {
        notify('error', 'Error getting run set data', { detail: error instanceof Response ? await error.text() : error });
      }
    },
    [workspaceId, loadRunSets]
  );

  // helper for auto-refresh
  const refresh = Utils.withBusyState(setLoading, async () => {
    try {
      let updatedRunSets;
      if (workflowsAppStore.get().cbasProxyUrlState.status === AppProxyUrlStatus.Ready) {
        updatedRunSets = await loadAllRunSets(workflowsAppStore.get().cbasProxyUrlState);

        // only refresh if there are Run Sets in non-terminal state
        if (!updatedRunSets || _.some(({ state }) => !isRunSetInTerminalState(state), updatedRunSets)) {
          scheduledRefresh.current = setTimeout(refresh, AutoRefreshInterval);
        }
      }
    } catch (error) {
      notify('error', 'Error loading previous run sets', { detail: error instanceof Response ? await error.text() : error });
    }
  });

  const cancelRunSet = async (submissionId) => {
    try {
      await Ajax(signal).Cbas.runSets.cancel(workflowsAppStore.get().cbasProxyUrlState.state, submissionId);
      notify('success', 'Abort submission request submitted successfully', {
        message: 'You may refresh the page to get most recent status changes.',
        timeout: 5000,
      });
    } catch (error) {
      notify('error', 'Error aborting run set', { detail: error instanceof Response ? await error.text() : error });
    }
  };

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

  usePollingEffect(() => !doesAppProxyUrlExist(workspaceId, 'cbasProxyUrlState') && loadAllRunSets(workflowsAppStore.get().cbasProxyUrlState), {
    ms: CbasPollInterval,
    leading: false,
  });

  const stateCell = ({ state, error_count: errorCount }) => {
    const stateContent = {
      UNKNOWN: 'Unknown',
      RUNNING: 'Running',
      COMPLETE: 'Success',
      ERROR: h(TextCell, { style: { whiteSpace: 'pre-wrap', wordBreak: 'break-word' } }, [`Failed with ${errorCount} errors`]),
      CANCELING: 'Canceling',
      CANCELED: 'Canceled',
    };

    const stateIconKey = {
      UNKNOWN: 'unknown',
      RUNNING: 'running',
      COMPLETE: 'succeeded',
      ERROR: 'failed',
      CANCELING: 'canceling',
      CANCELED: 'canceled',
    };

    return div([makeStatusLine(statusType[stateIconKey[state]].icon, stateContent[state])]);
  };

  const sortedPreviousRunSets = _.orderBy(sort.field, sort.direction, runSetsData);
  const firstPageIndex = (pageNumber - 1) * itemsPerPage;
  const lastPageIndex = firstPageIndex + itemsPerPage;
  const paginatedPreviousRunSets = sortedPreviousRunSets.slice(firstPageIndex, lastPageIndex);

  const rowHeight = 175;

  return loading
    ? centeredSpinner()
    : div([
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
            style: { display: 'inline-flex', alignItems: 'center', margin: '1.5em 1.5em 0' },
          },
          [icon('arrowLeft', { style: { marginRight: '0.5rem' } }), 'Back to workflows']
        ),
        h(Fragment, [
          div({ style: { margin: '2em' } }, [
            div({ style: { display: 'flex', marginTop: '1rem', justifyContent: 'space-between' } }, [
              h2(['Submission History']),
              h(
                ButtonOutline,
                {
                  onClick: () =>
                    Nav.goToPath('workspace-workflows-app', {
                      name,
                      namespace,
                      workspace: {
                        workspace: { workspaceId },
                      },
                    }),
                },
                ['Submit another workflow']
              ),
            ]),
            runSetsFullyUpdated
              ? div([icon('check', { size: 15, style: { color: colors.success() } }), ' Submission statuses are all up to date.'])
              : div([
                  icon('warning-standard', { size: 15, style: { color: colors.warning() } }),
                  ' Some submission statuses are not up to date. Refreshing the page may update more statuses.',
                ]),
            div(
              {
                style: {
                  marginTop: '1em',
                  height: tableHeight({ actualRows: paginatedPreviousRunSets.length, maxRows: 12.5, heightPerRow: rowHeight }),
                  minHeight: '10em',
                },
              },
              [
                h(AutoSizer, [
                  ({ width, height }) =>
                    h(FlexTable, {
                      'aria-label': 'previous runs',
                      width,
                      height,
                      sort,
                      rowCount: paginatedPreviousRunSets.length,
                      noContentMessage: 'Nothing here yet! Your previously run workflows will be displayed here.',
                      hoverHighlight: true,
                      rowHeight,
                      styleCell: () => ({
                        display: 'inline',
                        alignItems: 'top',
                        paddingLeft: '1rem',
                        paddingRight: '1rem',
                        paddingTop: '1em',
                      }),
                      columns: [
                        {
                          size: { basis: 100, grow: 0 },
                          field: 'actions',
                          headerRenderer: () => h(TextCell, {}, ['Actions']),
                          cellRenderer: ({ rowIndex }) => {
                            return h(
                              MenuTrigger,
                              {
                                'aria-label': 'Action selection menu',
                                popupProps: {
                                  style: { left: '-20px' },
                                },
                                content: h(Fragment, [
                                  h(
                                    MenuButton,
                                    {
                                      style: { fontSize: 15 },
                                      disabled:
                                        isRunSetInTerminalState(paginatedPreviousRunSets[rowIndex].state) ||
                                        paginatedPreviousRunSets[rowIndex].state === 'CANCELING',
                                      tooltip:
                                        isRunSetInTerminalState(paginatedPreviousRunSets[rowIndex].state) && 'Cannot abort a terminal submission',
                                      onClick: () => cancelRunSet(paginatedPreviousRunSets[rowIndex].run_set_id),
                                    },
                                    ['Abort']
                                  ),
                                ]),
                              },
                              [
                                h(
                                  Clickable,
                                  {
                                    style: { textAlign: 'center' },
                                    'aria-label': 'Action selection menu',
                                  },
                                  [icon('cardMenuIcon', { size: 35 })]
                                ),
                              ]
                            );
                          },
                        },
                        {
                          size: { basis: 350 },
                          field: 'runset_name',
                          headerRenderer: () => h(Sortable, { sort, field: 'runset_name', onSort: setSort }, ['Submission name']),
                          cellRenderer: ({ rowIndex }) => {
                            return div([
                              h(
                                Link,
                                {
                                  onClick: () => {
                                    Nav.goToPath('workspace-workflows-app-submission-details', {
                                      name: workspace.workspace.name,
                                      namespace,
                                      submissionId: paginatedPreviousRunSets[rowIndex].run_set_id,
                                    });
                                  },
                                  style: { fontWeight: 'bold' },
                                },
                                [paginatedPreviousRunSets[rowIndex].run_set_name || 'No name']
                              ),
                              h(TextCell, { style: { display: 'block', marginTop: '1em', whiteSpace: 'normal' } }, [
                                `Data used: ${paginatedPreviousRunSets[rowIndex].record_type}`,
                              ]),
                              h(TextCell, { style: { display: 'block', marginTop: '1em', whiteSpace: 'normal' } }, [
                                `${paginatedPreviousRunSets[rowIndex].run_count} workflows`,
                              ]),
                            ]);
                          },
                        },
                        {
                          size: { basis: 200, grow: 0 },
                          field: 'state',
                          headerRenderer: () => h(Sortable, { sort, field: 'state', onSort: setSort }, ['Status']),
                          cellRenderer: ({ rowIndex }) => {
                            return stateCell(paginatedPreviousRunSets[rowIndex]);
                          },
                        },
                        {
                          size: { basis: 200, grow: 0 },
                          field: 'submission_timestamp',
                          headerRenderer: () => h(Sortable, { sort, field: 'submission_timestamp', onSort: setSort }, ['Date Submitted']),
                          cellRenderer: ({ rowIndex }) => {
                            return h(TextCell, { style: { whiteSpace: 'normal' } }, [
                              Utils.makeCompleteDate(paginatedPreviousRunSets[rowIndex].submission_timestamp),
                            ]);
                          },
                        },
                        {
                          size: { basis: 175, grow: 0 },
                          field: 'duration',
                          headerRenderer: () => h(Sortable, { sort, field: 'duration', onSort: setSort }, ['Duration']),
                          cellRenderer: ({ rowIndex }) => {
                            const row = paginatedPreviousRunSets[rowIndex];
                            return h(TextCell, [
                              Utils.customFormatDuration(
                                getDuration(row.state, row.submission_timestamp, row.last_modified_timestamp, isRunSetInTerminalState)
                              ),
                            ]);
                          },
                        },
                        {
                          size: { basis: 600, grow: 0 },
                          field: 'comment',
                          headerRenderer: () => h(Sortable, { sort, field: 'comment', onSort: setSort }, ['Comment']),
                          cellRenderer: ({ rowIndex }) => {
                            return div({ style: { width: '100%', textAlign: 'left' } }, [
                              h(TextCell, { style: { whiteSpace: 'normal', fontStyle: 'italic' } }, [
                                paginatedPreviousRunSets[rowIndex].run_set_description || 'No Description',
                              ]),
                            ]);
                          },
                        },
                      ],
                    }),
                ]),
              ]
            ),
            !_.isEmpty(sortedPreviousRunSets) &&
              div({ style: { bottom: 0, position: 'absolute', marginBottom: '1.5rem', right: '4rem' } }, [
                paginator({
                  filteredDataLength: sortedPreviousRunSets.length,
                  unfilteredDataLength: sortedPreviousRunSets.length,
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
          ]),
        ]),
      ]);
};

export const SubmissionHistory = wrapWorkflowsPage({ name: 'SubmissionHistory' })(BaseSubmissionHistory);

export const navPaths = [
  {
    name: 'workspace-workflows-app-submission-history',
    path: '/workspaces/:namespace/:name/workflows-app/submission-history',
    component: SubmissionHistory,
    title: ({ name }) => `${name} - Submission History`,
  },
];
