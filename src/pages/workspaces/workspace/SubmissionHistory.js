import { Modal, TooltipTrigger } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { Fragment, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { div, h, span, table, tbody, td, tr } from 'react-hyperscript-helpers';
import { AutoSizer } from 'react-virtualized';
import { bucketBrowserUrl } from 'src/auth/auth';
import * as breadcrumbs from 'src/components/breadcrumbs';
import { Clickable, Link, Select, spinnerOverlay } from 'src/components/common';
import { icon } from 'src/components/icons';
import { DelayedSearchInput } from 'src/components/input';
import { collapseStatus, statusType } from 'src/components/job-common';
import { MenuButton } from 'src/components/MenuButton';
import { MenuTrigger } from 'src/components/PopupTrigger';
import { FlexTable, HeaderRenderer, TextCell, TooltipCell } from 'src/components/table';
import { Workspaces } from 'src/libs/ajax/workspaces/Workspaces';
import colors from 'src/libs/colors';
import { reportError } from 'src/libs/error';
import * as Nav from 'src/libs/nav';
import { forwardRefWithName, useCancellation, useOnMount } from 'src/libs/react-utils';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import UpdateUserCommentModal from 'src/pages/workspaces/workspace/submissionHistory/UpdateUserCommentModal';
import { rerunFailures } from 'src/pages/workspaces/workspace/workflows/FailureRerunner';
import { wrapWorkspace } from 'src/workspaces/container/WorkspaceContainer';

const styles = {
  submissionsTable: {
    padding: '1rem',
    flex: 1,
  },
  deemphasized: {
    fontWeight: 'initial',
  },
  statusDetailCell: {
    align: 'center',
    style: { padding: '0.5rem' },
  },
  multiLineCellText: {
    fontSize: 12,
  },
  dropdownStyle: {
    padding: '0.5rem 0.5rem',
    borderRadius: 4,
    border: `1px solid ${colors.dark(0.2)}`,
    background: colors.light(0.1),
    fontSize: 14,
    height: 36,
    cursor: 'pointer',
  },
};

const isTerminal = (submissionStatus) => submissionStatus === 'Aborted' || submissionStatus === 'Done';

const collapsedStatuses = _.flow(
  _.toPairs,
  _.map(([status, count]) => ({ [collapseStatus(status).id]: count })),
  _.reduce(_.mergeWith(_.add), {})
);

const statusCell = (workflowStatuses, status) => {
  const statuses = collapsedStatuses(workflowStatuses);
  const { succeeded, failed, running, submitted } = statuses;

  const summary = _.flow(
    _.toPairs,
    _.map(([status, count]) => `${count} ${status}`),
    _.join(', ')
  )(statuses);

  return h(
    TooltipTrigger,
    {
      side: 'bottom',
      content: table([
        tbody({}, [
          tr({}, [
            td(styles.statusDetailCell, [statusType.succeeded.icon()]),
            td(styles.statusDetailCell, [statusType.failed.icon()]),
            td(styles.statusDetailCell, [statusType.running.icon()]),
            td(styles.statusDetailCell, [statusType.submitted.icon()]),
          ]),
          tr({}, [
            td(styles.statusDetailCell, [succeeded || 0]),
            td(styles.statusDetailCell, [failed || 0]),
            td(styles.statusDetailCell, [running || 0]),
            td(styles.statusDetailCell, [submitted || 0]),
          ]),
        ]),
      ]),
    },
    [
      div({ style: { display: 'flex', alignItems: 'center' } }, [
        span(
          {
            tabIndex: 0,
            role: 'note',
            'aria-label': summary,
          },
          [
            succeeded && statusType.succeeded.icon(),
            failed && statusType.failed.icon(),
            running && statusType.running.icon(),
            submitted && statusType.submitted.icon(),
          ]
        ),
        _.keys(collapsedStatuses(workflowStatuses)).length === 1 &&
          span(
            {
              style: { marginLeft: '0.5em' },
            },
            [status]
          ),
      ]),
    ]
  );
};

const noJobsMessage = (dateRange) =>
  div({ style: { fontSize: 20, margin: '1rem' } }, [
    div([
      `You have not run any submissions ${dateRange === '30' ? 'in the last 30 days' : 'yet'}. To get started, go to the `,
      span({ style: { fontWeight: 600 } }, ['Workflows']),
      ' tab and select a workflow to run.',
    ]),
    div({ style: { marginTop: '1rem', fontSize: 16 } }, [
      h(
        Link,
        {
          ...Utils.newTabLinkProps,
          href: 'https://support.terra.bio/hc/en-us/articles/360037096272',
        },
        ['What is a submission?']
      ),
    ]),
  ]);

const getInitialDateRange = () => {
  const hashParts = window.location.hash.split('?');
  const params = new URLSearchParams(hashParts[1] || '');
  const urlDateRange = params.get('dateRange');

  // Only return valid values, otherwise default to 30
  if (urlDateRange === 'all' || urlDateRange === '30') {
    return urlDateRange;
  }
  return '30';
};

export const SubmissionHistory = _.flow(
  forwardRefWithName('SubmissionHistory'),
  wrapWorkspace({
    breadcrumbs: (props) => breadcrumbs.commonPaths.workspaceDashboard(props),
    title: 'Submission History',
    activeTab: 'submission history',
  })
)(({ namespace, name, workspace }, ref) => {
  // State
  const [submissions, setSubmissions] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [abortingId, setAbortingId] = useState(undefined);
  const [textFilter, setTextFilter] = useState('');
  const [dateRange, setDateRange] = useState(getInitialDateRange);
  const [sort, setSort] = useState({ field: 'submissionDate', direction: 'desc' });
  const [updatingCommentId, setUpdatingCommentId] = useState(undefined);

  const scheduledRefresh = useRef();
  const signal = useCancellation();

  // Redirect to submission history url
  useEffect(() => {
    window.location.hash = window.location.hash.replace('job_history', 'submission_history');
  }, []);

  // Helpers
  const refresh = Utils.withBusyState(setLoading, async () => {
    try {
      let startDate;
      if (dateRange === '30') {
        startDate = new Date();
        startDate.setDate(new Date().getDate() - 30);
      } else {
        startDate = undefined;
      }

      const params = {};
      if (startDate) params.startDate = startDate.toISOString().split('T')[0];

      const submissions = _.flow(
        _.orderBy('submissionDate', 'desc'),
        _.map((sub) => {
          const {
            methodConfigurationName,
            methodConfigurationNamespace,
            status,
            submissionDate,
            submissionEntity: { entityType, entityName } = {},
            submissionId,
            submitter,
            userComment,
          } = sub;

          const subAsText = _.join(' ', [
            methodConfigurationName,
            methodConfigurationNamespace,
            status,
            submissionDate,
            entityType,
            entityName,
            submissionId,
            submitter,
            userComment,
          ]).toLowerCase();

          return _.set('asText', subAsText, sub);
        })
      )(await Workspaces(signal).workspace(namespace, name).listSubmissions(params));
      setSubmissions(submissions);

      if (_.some(({ status }) => !isTerminal(status), submissions)) {
        scheduledRefresh.current = setTimeout(refresh, 1000 * 60);
      }
    } catch (error) {
      reportError('Error loading submissions list', error);
      setSubmissions([]);
    }
  });

  const makeHeaderRenderer = (name, label, sortable = true, ariaLabel = label) => {
    return () =>
      h(HeaderRenderer, {
        sort: sortable ? sort : undefined,
        name,
        label,
        onSort: setSort,
        style: { fontWeight: 400 },
        'aria-label': ariaLabel,
      });
  };

  // Lifecycle
  useOnMount(() => {
    refresh();

    return () => {
      if (scheduledRefresh.current) {
        clearTimeout(scheduledRefresh.current);
      }
    };
  });

  // Set dateRange in URL if missing on mount
  useEffect(() => {
    const hashParts = window.location.hash.split('?');
    const params = new URLSearchParams(hashParts[1] || '');
    if (!params.has('dateRange')) {
      params.set('dateRange', dateRange);
      window.history.replaceState({}, '', `${window.location.pathname}${hashParts[0]}?${params.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Sync dateRange state with URL changes
    const handleHashChange = () => {
      const hashParts = window.location.hash.split('?');
      const params = new URLSearchParams(hashParts[1] || '');
      const urlDateRange = params.get('dateRange');

      if ((urlDateRange === 'all' || urlDateRange === '30') && urlDateRange !== dateRange) {
        setDateRange(urlDateRange);
        // eslint-disable-next-line
        return; // return to avoid duplicate refresh
      }
    };
    // Update URL when dateRange changes
    const hashParts = window.location.hash.split('?');
    const params = new URLSearchParams(hashParts[1] || '');
    const urlDateRange = params.get('dateRange');
    if (dateRange !== urlDateRange) {
      params.set('dateRange', dateRange);
      window.history.replaceState({}, '', `${window.location.pathname}${hashParts[0]}?${params.toString()}`);
    }
    refresh();

    // Listen for URL changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  useImperativeHandle(ref, () => ({ refresh }));

  // Render
  const filteredSubmissions = _.filter(({ asText }) => _.every((term) => asText.includes(term.toLowerCase()), textFilter.split(/\s+/)), submissions);

  const sortedSubmissions = _.orderBy(
    Utils.switchCase(
      sort.field,
      ['entityName', () => 'submissionEntity.entityName'],
      ['numberOfWorkflows', () => [(s) => _.sum(_.values(s.workflowStatuses))]],
      [
        'status',
        () => [
          (s) => {
            const { succeeded, failed, running, submitted } = collapsedStatuses(s.workflowStatuses);
            return [submitted, running, failed, succeeded];
          },
        ],
      ],
      [Utils.DEFAULT, () => sort.field]
    ),
    [sort.direction],
    filteredSubmissions
  );

  const hasJobs = !_.isEmpty(submissions);
  const { running, submitted } = abortingId ? collapsedStatuses(_.find({ submissionId: abortingId }, filteredSubmissions).workflowStatuses) : {};

  return h(Fragment, [
    div({ style: { display: 'flex', alignItems: 'center', margin: '1rem 1rem 0' } }, [
      div({ style: { display: 'flex', alignItems: 'center' } }, [
        span({ style: { marginRight: '0.5rem', fontWeight: 'bold' } }, ['Date range']),
        h(Select, {
          id: 'submission-date-range-select',
          isSearchable: false,
          value: dateRange,
          onChange: (option) => setDateRange(option.value),
          options: [
            { value: '30', label: 'Last 30 Days' },
            { value: 'all', label: 'All Submissions' },
          ],
        }),
      ]),
      div({ style: { flexGrow: 1 } }),
      h(DelayedSearchInput, {
        'aria-label': 'Search',
        style: { width: 300, marginLeft: '1rem' },
        placeholder: 'Search',
        onChange: setTextFilter,
        value: textFilter,
      }),
    ]),
    div({ style: styles.submissionsTable }, [
      hasJobs &&
        h(AutoSizer, [
          ({ width, height }) =>
            h(FlexTable, {
              'aria-label': 'submission history',
              width,
              height,
              rowCount: sortedSubmissions.length,
              hoverHighlight: true,
              noContentMessage: 'No matching submissions',
              sort,
              columns: [
                {
                  size: { basis: 500, grow: 0 },
                  field: 'methodConfigurationName',
                  headerRenderer: makeHeaderRenderer('methodConfigurationName', 'Submission (click for details)', true, 'Submission'),
                  cellRenderer: ({ rowIndex }) => {
                    const { methodConfigurationNamespace, methodConfigurationName, submitter, submissionId, workflowStatuses } =
                      sortedSubmissions[rowIndex];
                    const { failed, running, submitted } = collapsedStatuses(workflowStatuses);

                    return h(
                      Clickable,
                      {
                        hover: {
                          backgroundColor: Utils.cond(
                            [!!failed, () => colors.danger(0.3)],
                            [!!running || !!submitted, () => colors.accent(0.3)],
                            () => colors.success(0.3)
                          ),
                        },
                        style: {
                          flex: 1,
                          alignSelf: 'stretch',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          margin: '0 -1rem',
                          padding: '0 1rem',
                          minWidth: 0,
                          fontWeight: 600,
                          backgroundColor: Utils.cond(
                            [!!failed, () => colors.danger(0.2)],
                            [!!running || !!submitted, () => colors.accent(0.2)],
                            () => colors.success(0.2)
                          ),
                        },
                        tooltip: Utils.cond(
                          [!!failed, () => 'This submission failed'],
                          [!!running || !!submitted, () => 'This submission is running...'],
                          () => 'This submission succeeded'
                        ),
                        href: Nav.getLink('workspace-submission-details', { namespace, name, submissionId }),
                      },
                      [
                        div({ style: Style.noWrapEllipsis }, [
                          methodConfigurationNamespace !== namespace && span({ style: styles.deemphasized }, [`${methodConfigurationNamespace}/`]),
                          methodConfigurationName,
                        ]),
                        div({ style: Style.noWrapEllipsis }, [span({ style: styles.deemphasized }, 'Submitted by '), submitter]),
                      ]
                    );
                  },
                },
                {
                  size: { basis: 250, grow: 0 },
                  field: 'entityName',
                  headerRenderer: makeHeaderRenderer('entityName', 'Data entity'),
                  cellRenderer: ({ rowIndex }) => {
                    const { submissionEntity: { entityName, entityType } = {} } = sortedSubmissions[rowIndex];
                    return h(TooltipCell, [entityName && `${entityName} (${entityType})`]);
                  },
                },
                {
                  size: { basis: 160, grow: 0 },
                  field: 'numberOfWorkflomws',
                  headerRenderer: makeHeaderRenderer('numberOfWorkflows', 'No. of Workflows', true, 'Number of Workflows'),
                  cellRenderer: ({ rowIndex }) => {
                    const { workflowStatuses } = sortedSubmissions[rowIndex];
                    return h(TextCell, Utils.formatNumber(_.sum(_.values(workflowStatuses))));
                  },
                },
                {
                  // Disable shrinking so that "Submitted" and "Aborted" do not render outside of the cell
                  size: { basis: 150, grow: 0, shrink: 0 },
                  field: 'status',
                  headerRenderer: makeHeaderRenderer('status'),
                  cellRenderer: ({ rowIndex }) => {
                    const { workflowStatuses, status } = sortedSubmissions[rowIndex];
                    return statusCell(workflowStatuses, status);
                  },
                },
                {
                  size: { basis: 150, grow: 0 },
                  field: 'submissionDate',
                  headerRenderer: makeHeaderRenderer('submissionDate', 'Submitted'),
                  cellRenderer: ({ rowIndex }) => {
                    const { submissionDate } = sortedSubmissions[rowIndex];
                    const dateParts = Utils.makeCompleteDateParts(submissionDate);
                    return div({ style: styles.multiLineCellText }, [div([dateParts[0]]), div([dateParts[1]])]);
                  },
                },
                {
                  // Disable shrinking so that the ID does not render outside of the cell
                  size: { basis: 150, grow: 1, shrink: 0 },
                  field: 'submissionId',
                  headerRenderer: makeHeaderRenderer('submissionId', 'Submission ID'),
                  cellRenderer: ({ rowIndex }) => {
                    const { submissionId, submissionRoot } = sortedSubmissions[rowIndex];
                    return h(
                      Link,
                      {
                        style: styles.multiLineCellText,
                        ...Utils.newTabLinkProps,
                        href: bucketBrowserUrl(submissionRoot.replace('gs://', '')),
                      },
                      [submissionId]
                    );
                  },
                },
                {
                  size: { basis: 250, grow: 1 },
                  headerRenderer: makeHeaderRenderer('userComment', 'Comment'),
                  cellRenderer: ({ rowIndex }) => {
                    const { userComment } = sortedSubmissions[rowIndex];
                    return h(TooltipCell, [userComment]);
                  },
                },
                {
                  size: { min: 90, max: 90 },
                  headerRenderer: makeHeaderRenderer('actions', 'Actions', false),
                  cellRenderer: ({ rowIndex }) => {
                    const {
                      methodConfigurationNamespace,
                      methodConfigurationName,
                      methodConfigurationDeleted,
                      submissionId,
                      workflowStatuses,
                      status,
                      submissionEntity,
                      userComment,
                    } = sortedSubmissions[rowIndex];
                    const canAbort = !isTerminal(status) && status !== 'Aborting';
                    const canRelaunch =
                      isTerminal(status) && (workflowStatuses.Failed || workflowStatuses.Aborted) && submissionEntity && !methodConfigurationDeleted;
                    return div({ style: { width: '100%', textAlign: 'center' } }, [
                      updatingCommentId === submissionId &&
                        h(UpdateUserCommentModal, {
                          workspace: { name, namespace },
                          submissionId,
                          userComment,
                          onDismiss: () => setUpdatingCommentId(undefined),
                          onSuccess: refresh,
                        }),
                      h(
                        MenuTrigger,
                        {
                          closeOnClick: true,
                          content: h(Fragment, [
                            h(
                              MenuButton,
                              {
                                onClick: () => setUpdatingCommentId(submissionId),
                              },
                              ['Edit Comment']
                            ),
                            h(
                              MenuButton,
                              {
                                disabled: !canAbort,
                                onClick: () => setAbortingId(submissionId),
                              },
                              ['Abort workflows']
                            ),
                            h(
                              MenuButton,
                              {
                                disabled: !canRelaunch,
                                onClick: () =>
                                  rerunFailures({
                                    workspace,
                                    submissionId,
                                    configNamespace: methodConfigurationNamespace,
                                    configName: methodConfigurationName,
                                    onDone: refresh,
                                  }),
                              },
                              ['Relaunch failures']
                            ),
                          ]),
                          side: 'bottom',
                        },
                        [
                          h(Link, { 'aria-label': `Menu for submission ID beginning: ${_.split('-', submissionId)[0]}` }, [
                            icon('cardMenuIcon', { size: 24 }),
                          ]),
                        ]
                      ),
                    ]);
                  },
                },
              ],
            }),
        ]),
      !loading && !hasJobs && noJobsMessage(dateRange),
      !!abortingId &&
        h(
          Modal,
          {
            onDismiss: () => setAbortingId(undefined),
            title: 'Abort All Workflows',
            showX: true,
            okButton: async () => {
              try {
                setAbortingId(undefined);
                setLoading(true);
                await Workspaces().workspace(namespace, name).submission(abortingId).abort();
                refresh();
              } catch (e) {
                setLoading(false);
                reportError('Error aborting submission', e);
              }
            },
          },
          [`Are you sure you want to abort ${Utils.formatNumber(_.add(running, submitted))} running workflow(s)?`]
        ),
      loading && spinnerOverlay,
    ]),
  ]);
});

const submissionHistoryRoute = {
  name: 'workspace-submission-history',
  component: SubmissionHistory,
  title: ({ name }) => `${name} - Submission History`,
};

export const navPaths = [
  {
    ...submissionHistoryRoute,
    path: '/workspaces/:namespace/:name/submission_history',
  },
  {
    ...submissionHistoryRoute,
    path: '/workspaces/:namespace/:name/job_history',
  },
];
