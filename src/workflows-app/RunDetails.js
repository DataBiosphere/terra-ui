import { TooltipTrigger } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { Fragment, useCallback, useMemo, useRef, useState } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import { centeredSpinner, icon } from 'src/components/icons';
import { calculateTotalCost, collapseStatus, renderTaskCostElement } from 'src/components/job-common';
import { Ajax } from 'src/libs/ajax';
import { useMetricsEvent } from 'src/libs/ajax/metrics/useMetrics';
import colors from 'src/libs/colors';
import Events from 'src/libs/events';
import { notify } from 'src/libs/notifications';
import { useCancellation, useOnMount, usePollingEffect } from 'src/libs/react-utils';
import { AppProxyUrlStatus } from 'src/libs/state';
import { elements } from 'src/libs/style';
import { cond, newTabLinkProps } from 'src/libs/utils';
import CallTable from 'src/pages/workspaces/workspace/jobHistory/CallTable';
import InputOutputModal from 'src/workflows-app/components/InputOutputModal';
import { HeaderSection, statusType, SubmitNewWorkflowButton } from 'src/workflows-app/components/job-common';
import { LogViewer } from 'src/workflows-app/components/LogViewer';
import { TroubleshootingBox } from 'src/workflows-app/components/TroubleshootingBox';
import { WorkflowInfoBox } from 'src/workflows-app/components/WorkflowInfoBox';
import { doesAppProxyUrlExist, loadAppUrls } from 'src/workflows-app/utils/app-utils';
import { wrapWorkflowsPage } from 'src/workflows-app/WorkflowsContainer';

import { fetchMetadata } from './utils/submission-utils';

export const CromwellPollInterval = 1000 * 30; // 30 seconds

export const BaseRunDetails = (
  {
    name,
    namespace,
    workspace: {
      workspace: { workspaceId },
    },
    submissionId,
    workflowId,
  },
  _ref
) => {
  /*
   * State setup
   */
  const [workflow, setWorkflow] = useState();
  const [callObjects, setCallObjects] = useState({});
  const [failedTasks, setFailedTasks] = useState({});

  const [showLog, setShowLog] = useState(false);
  const [logsModalTitle, setLogsModalTitle] = useState('');
  const [logsArray, setLogsArray] = useState([]);
  const [tesLogDirectory, setTesLogDirectory] = useState('');

  const [taskDataTitle, setTaskDataTitle] = useState('');
  const [taskDataJson, setTaskDataJson] = useState({});
  const [showTaskData, setShowTaskData] = useState(false);

  const [loadWorkflowFailed, setLoadWorkflowFailed] = useState(false);
  const [stdOut, setStdOut] = useState();
  const [appIdMatched, setAppIdMatched] = useState();

  const signal = useCancellation();
  const stateRefreshTimer = useRef();
  const { captureEvent } = useMetricsEvent();

  const [sasToken, setSasToken] = useState('');
  const showLogModal = useCallback((modalTitle, logsArray, tesLog) => {
    setShowLog(true);
    setLogsModalTitle(modalTitle);
    setLogsArray(logsArray);
    setTesLogDirectory(tesLog);
  }, []);

  const showTaskDataModal = useCallback((taskDataTitle, taskJson) => {
    setTaskDataTitle(taskDataTitle);
    setTaskDataJson(taskJson);
    setShowTaskData(true);
  }, []);

  const includeKey = useMemo(
    () => [
      'backendStatus',
      'executionStatus',
      'shardIndex',
      'outputs',
      'inputs',
      'jobId',
      'start',
      'end',
      'stderr',
      'stdout',
      'tes_stdout',
      'tes_stderr',
      'attempt',
      'subWorkflowId', // needed for task type column
      'status',
      'submittedFiles',
      'callCaching',
      'workflowLog',
      'failures',
      'taskStartTime',
      'taskEndTime',
      'vmCostUsd',
      'workflowName',
    ],
    []
  );
  const excludeKey = useMemo(() => [], []);

  const loadWorkflow = useCallback(
    async (workflowId, updateWorkflowPath = undefined) => {
      try {
        const { cromwellProxyUrlState } = await loadAppUrls(workspaceId, 'cromwellProxyUrlState');
        if (cromwellProxyUrlState.status === AppProxyUrlStatus.Ready) {
          let failedTasks = {};
          const metadata = await fetchMetadata({
            cromwellProxyUrl: cromwellProxyUrlState.state,
            workflowId,
            signal,
            includeKeys: includeKey,
            excludeKeys: excludeKey,
          });
          if (metadata?.status?.toLocaleLowerCase() === 'failed') {
            try {
              failedTasks = await Ajax(signal).CromwellApp.workflows(workflowId).failedTasks(cromwellProxyUrlState.state);
            } catch (error) {
              // do nothing, failure here means that user may not have access to an updated version of Cromwell
            }
          }
          const { workflowName } = metadata;
          const metadataCalls = Object.values(metadata.calls);
          const firstCall = metadataCalls ? metadataCalls[0] : null;
          const firstCallInfo = firstCall && firstCall !== null ? firstCall[0] : null;
          const stdOut = firstCallInfo.stdout;
          setStdOut(stdOut);
          setAppIdMatched(stdOut && stdOut !== null ? stdOut.match('terra-app-[0-9a-fA-f-]*') : null);
          _.isNil(updateWorkflowPath) && setWorkflow(metadata);
          if (!_.isEmpty(metadata?.calls)) {
            setFailedTasks(Object.values(failedTasks)[0]?.calls || {});
            setCallObjects(metadata?.calls || {});
            if (_.includes(collapseStatus(metadata.status), [statusType.running, statusType.submitted])) {
              stateRefreshTimer.current = setTimeout(() => {
                loadWorkflow(workflowId, updateWorkflowPath);
              }, 60000);
            }
          }
          !_.isNil(updateWorkflowPath) && updateWorkflowPath(workflowId, workflowName);
        }
      } catch (error) {
        notify('error', 'Error loading run details', { detail: error instanceof Response ? await error.text() : error });
      }
    },
    [signal, workspaceId, includeKey, excludeKey]
  );

  //  Below two methods are data fetchers used in the call cache wizard. Defined
  // here so we can easily use the cloud context (we're in Azure, which proxy URL.)
  const loadCallCacheDiff = useCallback(
    async (thisWorkflow, thatWorkflow) => {
      const { cromwellProxyUrlState } = await loadAppUrls(workspaceId, 'cromwellProxyUrlState');
      if (cromwellProxyUrlState.status === AppProxyUrlStatus.Ready) {
        return Ajax(signal).CromwellApp.callCacheDiff(cromwellProxyUrlState.state, thisWorkflow, thatWorkflow);
      }
    },
    [signal, workspaceId]
  );

  const renderInProgressElement = (workflow) => {
    if (workflow.status === 'Running') {
      return span({ style: { fontStyle: 'italic' } }, ['In progress - ']);
    }
  };

  const taskCostTotal = useMemo(() => {
    return callObjects ? calculateTotalCost(callObjects) : undefined;
  }, [callObjects]);

  const loadCallCacheMetadata = useCallback(
    async (wfId, includeKey, excludeKey) => {
      const { cromwellProxyUrlState } = await loadAppUrls(workspaceId, 'cromwellProxyUrlState');
      if (cromwellProxyUrlState.status === AppProxyUrlStatus.Ready) {
        return Ajax(signal).CromwellApp.workflows(wfId).metadata(cromwellProxyUrlState.state, { includeKey, excludeKey });
      }
    },
    [signal, workspaceId]
  );

  const getWorkflowName = () => {
    return appIdMatched
      ? stdOut
          .substring(appIdMatched.index + appIdMatched[0].length + 1)
          .substring(0, stdOut.substring(appIdMatched.index + appIdMatched[0].length + 1).indexOf('/'))
      : null;
  };

  // poll if we're missing CBAS proxy url and stop polling when we have it
  usePollingEffect(() => !doesAppProxyUrlExist(workspaceId, 'cromwellProxyUrlState') && loadWorkflow(workflowId), {
    ms: CromwellPollInterval,
    leading: false,
  });

  /*
   * Data fetchers
   */
  useOnMount(() => {
    const load = async () => {
      try {
        const fetchSasToken = async () => {
          const { sas } = await Ajax(signal).AzureStorage.details(workspaceId);
          setSasToken(sas.token);
        };
        await Promise.all([fetchSasToken(), loadWorkflow(workflowId)]);
      } catch (error) {
        setLoadWorkflowFailed(true);
      }
    };
    load();
    return () => {
      clearTimeout(stateRefreshTimer.current);
    };
  });

  const metadataArchiveStatus = useMemo(() => workflow?.metadataArchiveStatus, [workflow]);

  const header = useMemo(() => {
    const breadcrumbPathObjects = [
      {
        label: 'Submission History',
        path: 'workspace-workflows-app',
        pathParams: { name, namespace },
        queryParams: { tab: 'submission-history' },
      },
      {
        label: `Submission ${submissionId}`,
        path: 'workspace-workflows-app-submission-details',
        pathParams: { name, namespace, submissionId },
      },
      {
        label: workflow?.workflowName,
      },
    ];

    return h(HeaderSection, { breadcrumbPathObjects, button: h(SubmitNewWorkflowButton, { name, namespace }), title: 'Workflow Details' });
  }, [workflow, submissionId, name, namespace]);

  return div({ id: 'run-details-page' }, [
    // Loading state (spinner)
    cond(
      [
        loadWorkflowFailed === true,
        () =>
          h(Fragment, [
            span({ style: { fontStyle: 'italic', marginBottom: '1rem' } }, [
              'Failed to load workflow data. Please refresh and try again. If the problem persists, contact Terra Support for help',
            ]),
          ]),
      ],
      [
        workflow === undefined,
        () => h(Fragment, [div({ style: { fontStyle: 'italic', marginBottom: '1rem' } }, ['Fetching workflow metadata...']), centeredSpinner()]),
      ],
      [
        metadataArchiveStatus === 'ArchivedAndDeleted',
        () =>
          h(Fragment, [
            div({ style: { lineHeight: '24px', marginTop: '0.5rem', ...elements.sectionHeader } }, ' Run Details Archived'),
            div({ style: { lineHeight: '24px', marginTop: '0.5rem' } }, [
              "This run's details have been archived. Please refer to the ",
              h(
                Link,
                {
                  href: 'https://support.terra.bio/hc/en-us/articles/360060601631',
                  ...newTabLinkProps,
                },
                [icon('pop-out', { size: 18 }), ' Run Details Archived']
              ),
              ' support article for details on how to access the archive.',
            ]),
          ]),
      ],
      () =>
        div([
          div({ style: { padding: '1rem 2rem 2rem' } }, [header]),
          div({ style: { display: 'flex', justifyContent: 'space-between', padding: '1rem 2rem 1rem' } }, [
            h(WorkflowInfoBox, { workflow }, []),
            h(
              TroubleshootingBox,
              {
                name,
                namespace,
                logUri: workflow.workflowLog,
                submissionId,
                workflowId,
                showLogModal,
                appId: appIdMatched,
                workflowName: getWorkflowName(),
              },
              []
            ),
          ]),
          div({ style: { fontSize: 16, padding: '0rem 2.5rem 1rem' } }, [
            span({ style: { fontWeight: 'bold' } }, ['Approximate workflow cost: ']),
            renderInProgressElement(workflow),
            renderTaskCostElement(taskCostTotal),
            h(
              TooltipTrigger,
              {
                content:
                  'Approximate cost is calculated based on the list price of the VMs used and does not include disk cost, subworkflow cost, or any cloud account discounts',
              },
              [icon('info-circle', { style: { marginLeft: '0.4rem', color: colors.accent(1) } })]
            ),
          ]),
          div(
            {
              style: {
                margin: '2rem',
              },
            },
            [
              h(CallTable, {
                enableExplorer: workflow?.status.toLocaleLowerCase() === 'succeeded',
                loadWorkflow,
                loadCallCacheDiff,
                loadCallCacheMetadata,
                defaultFailedFilter: workflow?.status.toLocaleLowerCase().includes('failed'),
                isRendered: !_.isEmpty(callObjects),
                showLogModal,
                showTaskDataModal,
                callObjects,
                failedTasks,
                workflowName: workflow?.workflowName,
                workflowId: workflow?.id,
                name,
                namespace,
                submissionId,
                isAzure: true,
              }),
            ]
          ),
          showLog &&
            h(LogViewer, {
              modalTitle: logsModalTitle,
              logs: logsArray,
              workspaceId,
              templateLogDirectory: tesLogDirectory,
              onDismiss: () => {
                setShowLog(false);
                captureEvent(Events.workflowsAppCloseLogViewer);
              },
            }),
          showTaskData &&
            h(InputOutputModal, { title: taskDataTitle, jsonData: taskDataJson, onDismiss: () => setShowTaskData(false), sasToken, workspaceId }, []),
        ])
    ),
  ]);
};

export const RunDetails = wrapWorkflowsPage({ name: 'RunDetails' })(BaseRunDetails);

export const navPaths = [
  {
    name: 'workspace-workflows-app-run-details',
    path: '/workspaces/:namespace/:name/workflows-app/submission-monitoring/:submissionId/:workflowId',
    component: RunDetails,
    title: ({ name }) => `${name} - Run Details`,
  },
];
