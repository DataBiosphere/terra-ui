import _ from 'lodash/fp';
import { Fragment, useCallback, useMemo, useRef, useState } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import { centeredSpinner, icon } from 'src/components/icons';
import { collapseStatus } from 'src/components/job-common';
import { UriViewer } from 'src/components/UriViewer/UriViewer';
import { Ajax } from 'src/libs/ajax';
import { notify } from 'src/libs/notifications';
import { useCancellation, useOnMount, usePollingEffect } from 'src/libs/react-utils';
import { AppProxyUrlStatus } from 'src/libs/state';
import { elements } from 'src/libs/style';
import { cond, newTabLinkProps } from 'src/libs/utils';
import CallTable from 'src/pages/workspaces/workspace/jobHistory/CallTable';
import InputOutputModal from 'src/workflows-app/components/InputOutputModal';
import { HeaderSection, statusType, SubmitNewWorkflowButton } from 'src/workflows-app/components/job-common';
import { TroubleshootingBox } from 'src/workflows-app/components/TroubleshootingBox';
import { WorkflowInfoBox } from 'src/workflows-app/components/WorkflowInfoBox';
import { doesAppProxyUrlExist, loadAppUrls } from 'src/workflows-app/utils/app-utils';
import { wrapWorkflowsPage } from 'src/workflows-app/WorkflowsContainer';

export const CromwellPollInterval = 1000 * 30; // 30 seconds

export const BaseRunDetails = (
  {
    name,
    namespace,
    workspace,
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
  const [logUri, setLogUri] = useState({});
  const [isStdLog, setIsStdLog] = useState(false);

  const [taskDataTitle, setTaskDataTitle] = useState('');
  const [taskDataJson, setTaskDataJson] = useState({});
  const [showTaskData, setShowTaskData] = useState(false);

  const [loadWorkflowFailed, setLoadWorkflowFailed] = useState(false);

  const signal = useCancellation();
  const stateRefreshTimer = useRef();

  const [sasToken, setSasToken] = useState('');
  const showLogModal = useCallback((logUri, isStdLog = false) => {
    setLogUri(logUri);
    setShowLog(true);
    setIsStdLog(isStdLog);
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
      // 'outputs', //not sure if I need this yet
      // 'inputs', //not sure if I need this yet
      'jobId',
      'start',
      'end',
      'stderr',
      'stdout',
      'attempt',
      'subWorkflowId', // needed for task type column
      // 'subWorkflowMetadata' //may need this later
    ],
    []
  );
  const excludeKey = useMemo(() => [], []);
  const fetchMetadata = useCallback(
    async (cromwellProxyUrl, workflowId) => Ajax(signal).CromwellApp.workflows(workflowId).metadata(cromwellProxyUrl, { includeKey, excludeKey }),
    [includeKey, excludeKey, signal]
  );

  const loadWorkflow = useCallback(
    async (workflowId, updateWorkflowPath = undefined) => {
      try {
        const { cromwellProxyUrlState } = await loadAppUrls(workspaceId, 'cromwellProxyUrlState');
        if (cromwellProxyUrlState.status === AppProxyUrlStatus.Ready) {
          let failedTasks = {};
          const metadata = await fetchMetadata(cromwellProxyUrlState.state, workflowId);
          if (metadata?.status?.toLocaleLowerCase() === 'failed') {
            try {
              failedTasks = await Ajax(signal).CromwellApp.workflows(workflowId).failedTasks(cromwellProxyUrlState.state);
            } catch (error) {
              // do nothing, failure here means that user may not have access to an updated version of Cromwell
            }
          }
          const { workflowName } = metadata;
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
    [signal, fetchMetadata, workspaceId]
  );

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
        path: 'workspace-workflows-app-submission-history',
        params: { name, namespace },
      },
      {
        label: `Submission ${submissionId}`,
        path: 'workspace-workflows-app-submission-details',
        params: { name, namespace, submissionId },
      },
      {
        label: workflow?.workflowName,
      },
    ];

    return h(HeaderSection, { breadcrumbPathObjects, button: h(SubmitNewWorkflowButton, { name, namespace }), title: 'Workflow Details' });
  }, [workflow, submissionId, name, namespace]);

  return div({ 'data-testid': 'run-details-container', id: 'run-details-page' }, [
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
          div({ 'data-testid': 'details-top-container', style: { display: 'flex', justifyContent: 'space-between', padding: '1rem 2rem 2rem' } }, [
            h(WorkflowInfoBox, { workflow }, []),
            h(TroubleshootingBox, { name, namespace, logUri: workflow.workflowLog, submissionId, workflowId, showLogModal }, []),
          ]),
          div(
            {
              'data-testid': 'call-table-container',
              style: {
                margin: '2rem',
              },
            },
            [
              h(CallTable, {
                enableExplorer: workflow?.status.toLocaleLowerCase() === 'succeeded',
                loadWorkflow,
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
              }),
            ]
          ),
          showLog && h(UriViewer, { workspace, uri: logUri || '', onDismiss: () => setShowLog(false), isStdLog }),
          showTaskData &&
            h(InputOutputModal, { title: taskDataTitle, jsonData: taskDataJson, onDismiss: () => setShowTaskData(false), sasToken }, []),
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
